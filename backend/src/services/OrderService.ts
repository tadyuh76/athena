import { OrderModel, CreateOrderData, OrderWithDetails } from '../models/OrderModel';
import { CartModel } from '../models/CartModel';
import { ProductVariantModel } from '../models/ProductVariantModel';
import { Order } from '../types/database.types';
import { createPaymentIntent, createCheckoutSession, isStripeConfigured } from '../utils/stripe';
import { supabaseAdmin } from '../utils/supabase';

export interface CreateOrderRequest {
  userId?: string;
  shippingInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    address: string;
    city: string;
    state: string;
    zip: string;
  };
  paymentMethod: 'stripe' | 'paypal';
}

export interface CreateOrderResponse {
  success: boolean;
  order: OrderWithDetails;
  clientSecret?: string; // For Stripe frontend integration
  checkoutUrl?: string; // For Stripe Checkout redirect
  message?: string;
}

export class OrderService {
  private orderModel: OrderModel;
  private cartModel: CartModel;
  private variantModel: ProductVariantModel;

  constructor() {
    this.orderModel = new OrderModel();
    this.cartModel = new CartModel();
    this.variantModel = new ProductVariantModel();
  }

  /**
   * Create order from user's cart
   */
  async createOrder(request: CreateOrderRequest): Promise<CreateOrderResponse> {
    try {
      // 1. Get user's cart items
      const cartItems = request.userId
        ? await this.cartModel.findByUserId(request.userId)
        : [];

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // 2. Calculate order totals
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price_at_time * item.quantity,
        0
      );

      const tax = subtotal * 0.085; // 8.5% tax
      const shipping = subtotal >= 150 ? 0 : 15; // Free shipping over $150
      const discount = 0;
      const total = subtotal + tax + shipping - discount;

      // 3. Validate inventory availability
      for (const item of cartItems) {
        const available = await this.variantModel.getAvailableQuantity(item.variant_id);
        if (available < item.quantity) {
          throw new Error(
            `Insufficient inventory for ${item.product?.name}. Only ${available} available.`
          );
        }
      }

      // 4. Create Stripe PaymentIntent (if using Stripe)
      let clientSecret: string | undefined;
      let paymentIntentId: string | undefined;

      if (request.paymentMethod === 'stripe') {
        if (!isStripeConfigured()) {
          throw new Error('Stripe is not configured. Please contact support.');
        }

        const paymentIntent = await createPaymentIntent(total, 'usd', {
          customer_email: request.shippingInfo.email,
          order_type: 'ecommerce',
        });

        clientSecret = paymentIntent.client_secret || undefined;
        paymentIntentId = paymentIntent.id;
      }

      // 5. Prepare order data
      const orderData: CreateOrderData = {
        user_id: request.userId,
        customer_email: request.shippingInfo.email,
        customer_phone: request.shippingInfo.phone,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(tax * 100) / 100,
        shipping_amount: shipping,
        discount_amount: discount,
        total_amount: Math.round(total * 100) / 100,
        shipping_method: shipping === 0 ? 'Free Shipping' : 'Standard Shipping',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price_at_time: item.price_at_time,
          product_name: item.product?.name || 'Unknown Product',
          product_sku: item.variant?.sku || item.product?.sku || 'N/A',
          variant_title: item.variant?.size || item.variant?.color || undefined,
          product_image_url: item.product?.featured_image_url || undefined,
        })),
        shippingAddress: {
          type: 'shipping',
          first_name: request.shippingInfo.firstName,
          last_name: request.shippingInfo.lastName,
          address_line1: request.shippingInfo.address,
          city: request.shippingInfo.city,
          state: request.shippingInfo.state,
          postal_code: request.shippingInfo.zip,
          country: 'VN',
          phone: request.shippingInfo.phone,
        },
      };

      // 6. Create order in database
      const order = await this.orderModel.createOrderWithDetails(orderData);

      // 7. Create payment record if Stripe
      if (paymentIntentId) {
        await supabaseAdmin.from('payments').insert({
          order_id: order.id,
          payment_provider: 'stripe',
          payment_method_type: 'card',
          payment_status: 'pending',
          amount: order.total_amount,
          currency_code: 'USD',
          transaction_id: paymentIntentId,
          metadata: {
            client_secret: clientSecret,
          },
        });
      }

      // 8. Commit inventory (decrement inventory_quantity, release reserved_quantity)
      for (const item of cartItems) {
        await this.commitInventory(item.variant_id, item.quantity);
      }

      // 9. Clear user's cart
      if (request.userId) {
        await this.cartModel.deleteByUserId(request.userId);
      }

      return {
        success: true,
        order,
        clientSecret,
        message: 'Order created successfully',
      };
    } catch (error) {
      throw new Error(
        `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create Stripe Checkout Session for order
   */
  async createStripeCheckoutSession(request: CreateOrderRequest, baseUrl: string): Promise<CreateOrderResponse> {
    try {
      console.log('[OrderService.createStripeCheckoutSession] Starting checkout session creation');
      console.log('[OrderService.createStripeCheckoutSession] User ID:', request.userId);

      // 1. Get user's cart items
      const cartItems = request.userId
        ? await this.cartModel.findByUserId(request.userId)
        : [];

      console.log('[OrderService.createStripeCheckoutSession] Cart items count:', cartItems.length);
      console.log('[OrderService.createStripeCheckoutSession] Cart items:', JSON.stringify(cartItems, null, 2));

      if (!cartItems || cartItems.length === 0) {
        throw new Error('Cart is empty');
      }

      // 2. Calculate order totals
      const subtotal = cartItems.reduce(
        (sum, item) => sum + item.price_at_time * item.quantity,
        0
      );

      const tax = subtotal * 0.085; // 8.5% tax
      const shipping = subtotal >= 150 ? 0 : 15; // Free shipping over $150
      const discount = 0;
      const total = subtotal + tax + shipping - discount;

      // 3. Validate inventory availability
      for (const item of cartItems) {
        const available = await this.variantModel.getAvailableQuantity(item.variant_id);
        if (available < item.quantity) {
          throw new Error(
            `Insufficient inventory for ${item.product?.name}. Only ${available} available.`
          );
        }
      }

      // 4. Prepare order data
      const orderData: CreateOrderData = {
        user_id: request.userId,
        customer_email: request.shippingInfo.email,
        customer_phone: request.shippingInfo.phone,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(tax * 100) / 100,
        shipping_amount: shipping,
        discount_amount: discount,
        total_amount: Math.round(total * 100) / 100,
        shipping_method: shipping === 0 ? 'Free Shipping' : 'Standard Shipping',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          variant_id: item.variant_id,
          quantity: item.quantity,
          price_at_time: item.price_at_time,
          product_name: item.product?.name || 'Unknown Product',
          product_sku: item.variant?.sku || item.product?.sku || 'N/A',
          variant_title: item.variant?.size || item.variant?.color || undefined,
          product_image_url: item.product?.featured_image_url || undefined,
        })),
        shippingAddress: {
          type: 'shipping',
          first_name: request.shippingInfo.firstName,
          last_name: request.shippingInfo.lastName,
          address_line1: request.shippingInfo.address,
          city: request.shippingInfo.city,
          state: request.shippingInfo.state,
          postal_code: request.shippingInfo.zip,
          country: 'VN',
          phone: request.shippingInfo.phone,
        },
      };

      // 5. Create order in database
      console.log('[OrderService.createStripeCheckoutSession] Creating order in database');
      const order = await this.orderModel.createOrderWithDetails(orderData);
      console.log('[OrderService.createStripeCheckoutSession] Order created:', order.id);

      // 6. Create Stripe Checkout Session
      console.log('[OrderService.createStripeCheckoutSession] Checking Stripe configuration');
      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured. Please contact support.');
      }

      const successUrl = `${baseUrl}/order-confirmation.html?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`;
      const cancelUrl = `${baseUrl}/checkout.html`;

      console.log('[OrderService.createStripeCheckoutSession] Creating Stripe checkout session');
      console.log('[OrderService.createStripeCheckoutSession] Total amount:', total);
      console.log('[OrderService.createStripeCheckoutSession] Success URL:', successUrl);

      const session = await createCheckoutSession(
        order.id,
        total,
        'usd',
        request.shippingInfo.email,
        successUrl,
        cancelUrl
      );
      console.log('[OrderService.createStripeCheckoutSession] Stripe session created:', session.id);

      // 7. Store session ID in transaction record
      console.log('[OrderService.createStripeCheckoutSession] Storing transaction record');
      const { error: transactionError } = await supabaseAdmin.from('transactions').insert({
        order_id: order.id,
        provider: 'stripe',
        type: 'payment',
        provider_transaction_id: session.id,
        amount: order.total_amount,
        currency_code: 'USD',
        status: 'pending',
        details: {
          checkout_session_id: session.id,
          checkout_url: session.url,
        },
      });

      if (transactionError) {
        console.error('[OrderService.createStripeCheckoutSession] Transaction record error:', transactionError);
        throw transactionError;
      }
      console.log('[OrderService.createStripeCheckoutSession] Transaction record created');

      // 8. Commit inventory (decrement inventory_quantity, release reserved_quantity)
      console.log('[OrderService.createStripeCheckoutSession] Committing inventory');
      for (const item of cartItems) {
        await this.commitInventory(item.variant_id, item.quantity);
      }
      console.log('[OrderService.createStripeCheckoutSession] Inventory committed');

      // 9. Clear user's cart
      console.log('[OrderService.createStripeCheckoutSession] Clearing cart');
      if (request.userId) {
        await this.cartModel.deleteByUserId(request.userId);
      }
      console.log('[OrderService.createStripeCheckoutSession] Cart cleared');

      console.log('[OrderService.createStripeCheckoutSession] Checkout URL:', session.url);
      console.log('[OrderService.createStripeCheckoutSession] Checkout session creation complete');

      return {
        success: true,
        order,
        checkoutUrl: session.url || undefined,
        message: 'Order created successfully',
      };
    } catch (error) {
      console.error('[OrderService.createStripeCheckoutSession] Fatal error:', error);
      throw new Error(
        `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Commit inventory after order creation
   * Decrements inventory_quantity and resets reserved_quantity
   */
  private async commitInventory(variantId: string, quantity: number): Promise<void> {
    try {
      const variant = await this.variantModel.findById(variantId);

      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      const newInventory = Math.max(0, variant.inventory_quantity - quantity);
      const newReserved = Math.max(0, variant.reserved_quantity - quantity);

      await supabaseAdmin
        .from('product_variants')
        .update({
          inventory_quantity: newInventory,
          reserved_quantity: newReserved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variantId);
    } catch (error) {
      throw new Error(
        `Failed to commit inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get all orders (Admin only)
   */
  async getAllOrders(filters?: {
    search?: string;
    status?: string;
    dateFrom?: string;
    dateTo?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<{
    orders: Order[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      const page = filters?.page || 1;
      const limit = filters?.limit || 20;
      const sortBy = filters?.sortBy || 'created_at';
      const sortOrder = filters?.sortOrder || 'desc';
      const ascending = sortOrder === 'asc';

      // Build query with shipping address and items join
      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          shipping_address:order_addresses!order_addresses_order_id_fkey(
            first_name,
            last_name,
            address_line1,
            address_line2,
            city,
            state_province,
            postal_code,
            country_code,
            phone
          ),
          items:order_items(
            id,
            product_name,
            variant_title,
            quantity,
            unit_price
          )
        `, { count: 'exact' });

      // Apply search filter (search in order_number, customer_email, customer_phone)
      if (filters?.search) {
        const searchTerm = filters.search.toLowerCase();
        query = query.or(
          `order_number.ilike.%${searchTerm}%,customer_email.ilike.%${searchTerm}%,customer_phone.ilike.%${searchTerm}%`
        );
      }

      // Apply status filter
      if (filters?.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }

      // Apply date range filters
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        // Add one day to include the entire end date
        const endDate = new Date(filters.dateTo);
        endDate.setDate(endDate.getDate() + 1);
        query = query.lt('created_at', endDate.toISOString());
      }

      // Apply sorting
      query = query.order(sortBy, { ascending });

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        console.error('[OrderService.getAllOrders] Supabase error:', JSON.stringify(error, null, 2));
        throw error;
      }

      return {
        orders: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
      };
    } catch (error) {
      console.error('[OrderService.getAllOrders] Full error:', error);
      throw new Error(
        `Failed to get all orders: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get order count (Admin only)
   */
  async getOrderCount(): Promise<number> {
    try {
      const { count, error } = await supabaseAdmin
        .from('orders')
        .select('*', { count: 'exact', head: true });

      if (error) {
        throw error;
      }
      return count || 0;
    } catch (error) {
      throw new Error(
        `Failed to get order count: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Create Stripe Checkout Session for direct "Buy Now" purchase
   * Creates order directly from product variant and quantity, not from cart
   */
  async createBuyNowCheckoutSession(
    userId: string | undefined,
    productId: string,
    variantId: string,
    quantity: number,
    shippingInfo: CreateOrderRequest['shippingInfo'],
    baseUrl: string
  ): Promise<CreateOrderResponse> {
    try {
      console.log('[OrderService.createBuyNowCheckoutSession] Starting buy now checkout');
      console.log('[OrderService.createBuyNowCheckoutSession] Product ID:', productId);
      console.log('[OrderService.createBuyNowCheckoutSession] Variant ID:', variantId);
      console.log('[OrderService.createBuyNowCheckoutSession] Quantity:', quantity);

      // 1. Get variant details with product info
      const variant = await this.variantModel.findById(variantId);
      if (!variant) {
        throw new Error('Product variant not found');
      }

      // Get product details
      const { data: product, error: productError } = await supabaseAdmin
        .from('products')
        .select('*')
        .eq('id', productId)
        .single();

      if (productError || !product) {
        throw new Error('Product not found');
      }

      // 2. Validate inventory availability
      const available = await this.variantModel.getAvailableQuantity(variantId);
      if (available < quantity) {
        throw new Error(
          `Insufficient inventory. Only ${available} available.`
        );
      }

      // 3. Calculate order totals
      const unitPrice = variant.price || product.base_price;
      const subtotal = unitPrice * quantity;
      const tax = subtotal * 0.085; // 8.5% tax
      const shipping = subtotal >= 150 ? 0 : 15; // Free shipping over $150
      const discount = 0;
      const total = subtotal + tax + shipping - discount;

      // 4. Prepare order data with single item
      const orderData: CreateOrderData = {
        user_id: userId,
        customer_email: shippingInfo.email,
        customer_phone: shippingInfo.phone,
        subtotal: Math.round(subtotal * 100) / 100,
        tax_amount: Math.round(tax * 100) / 100,
        shipping_amount: shipping,
        discount_amount: discount,
        total_amount: Math.round(total * 100) / 100,
        shipping_method: shipping === 0 ? 'Free Shipping' : 'Standard Shipping',
        items: [{
          product_id: productId,
          variant_id: variantId,
          quantity: quantity,
          price_at_time: unitPrice,
          product_name: product.name,
          product_sku: variant.sku || product.sku || 'N/A',
          variant_title: variant.size || variant.color || undefined,
          product_image_url: product.featured_image_url || undefined,
        }],
        shippingAddress: {
          type: 'shipping',
          first_name: shippingInfo.firstName,
          last_name: shippingInfo.lastName,
          address_line1: shippingInfo.address,
          city: shippingInfo.city,
          state: shippingInfo.state,
          postal_code: shippingInfo.zip,
          country: 'VN',
          phone: shippingInfo.phone,
        },
      };

      // 5. Create order in database
      console.log('[OrderService.createBuyNowCheckoutSession] Creating order in database');
      const order = await this.orderModel.createOrderWithDetails(orderData);
      console.log('[OrderService.createBuyNowCheckoutSession] Order created:', order.id);

      // 6. Create Stripe Checkout Session
      console.log('[OrderService.createBuyNowCheckoutSession] Checking Stripe configuration');
      if (!isStripeConfigured()) {
        throw new Error('Stripe is not configured. Please contact support.');
      }

      const successUrl = `${baseUrl}/order-confirmation.html?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`;
      const cancelUrl = `${baseUrl}/checkout.html`;

      console.log('[OrderService.createBuyNowCheckoutSession] Creating Stripe checkout session');
      const session = await createCheckoutSession(
        order.id,
        total,
        'usd',
        shippingInfo.email,
        successUrl,
        cancelUrl
      );
      console.log('[OrderService.createBuyNowCheckoutSession] Stripe session created:', session.id);

      // 7. Store session ID in transaction record
      console.log('[OrderService.createBuyNowCheckoutSession] Storing transaction record');
      const { error: transactionError } = await supabaseAdmin.from('transactions').insert({
        order_id: order.id,
        provider: 'stripe',
        type: 'payment',
        provider_transaction_id: session.id,
        amount: order.total_amount,
        currency_code: 'USD',
        status: 'pending',
        details: {
          checkout_session_id: session.id,
          checkout_url: session.url,
        },
      });

      if (transactionError) {
        console.error('[OrderService.createBuyNowCheckoutSession] Transaction record error:', transactionError);
        throw transactionError;
      }

      // 8. Reserve inventory (decrement inventory_quantity, increment reserved_quantity)
      console.log('[OrderService.createBuyNowCheckoutSession] Reserving inventory');
      await this.reserveInventory(variantId, quantity);
      console.log('[OrderService.createBuyNowCheckoutSession] Inventory reserved');

      console.log('[OrderService.createBuyNowCheckoutSession] Checkout URL:', session.url);
      console.log('[OrderService.createBuyNowCheckoutSession] Buy now checkout session creation complete');

      return {
        success: true,
        order,
        checkoutUrl: session.url || undefined,
        message: 'Order created successfully',
      };
    } catch (error) {
      console.error('[OrderService.createBuyNowCheckoutSession] Fatal error:', error);
      throw new Error(
        `Failed to create buy now checkout: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Reserve inventory for an order (used by buy now)
   * Decrements inventory_quantity and increments reserved_quantity
   */
  private async reserveInventory(variantId: string, quantity: number): Promise<void> {
    try {
      const variant = await this.variantModel.findById(variantId);

      if (!variant) {
        throw new Error(`Variant ${variantId} not found`);
      }

      const newInventory = Math.max(0, variant.inventory_quantity - quantity);
      const newReserved = variant.reserved_quantity + quantity;

      await supabaseAdmin
        .from('product_variants')
        .update({
          inventory_quantity: newInventory,
          reserved_quantity: newReserved,
          updated_at: new Date().toISOString(),
        })
        .eq('id', variantId);
    } catch (error) {
      throw new Error(
        `Failed to reserve inventory: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get order by ID with details
   */
  async getOrderById(orderId: string): Promise<OrderWithDetails | null> {
    return this.orderModel.findByIdWithDetails(orderId);
  }

  /**
   * Get orders for a user
   */
  async getUserOrders(userId: string): Promise<Order[]> {
    return this.orderModel.findByUserId(userId);
  }

  /**
   * Update payment status after webhook confirmation
   * When payment is successful, order stays in 'pending' status waiting for admin confirmation
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'paid' | 'failed'
  ): Promise<void> {
    try {
      await this.orderModel.updatePaymentStatus(orderId, paymentStatus);

      // Update order status based on payment
      if (paymentStatus === 'paid') {
        // Keep order in 'pending' status - admin needs to confirm it to move to 'preparing'
        // No status change needed here
      } else {
        await this.orderModel.updateOrderStatus(orderId, 'cancelled');
      }
    } catch (error) {
      throw new Error(
        `Failed to update payment status: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Admin confirms order - changes status from pending to preparing
   * Workflow: pending → preparing → shipping → [auto after 2 days] → delivered
   */
  async confirmOrder(orderId: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== 'pending') {
        throw new Error('Chỉ có thể xác nhận đơn hàng đang chờ xử lý (pending)');
      }

      const now = new Date().toISOString();

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'preparing',
          confirmed_at: now,
          updated_at: now,
        })
        .eq('id', orderId);

      return this.orderModel.findByIdWithDetails(orderId) as Promise<OrderWithDetails>;
    } catch (error) {
      throw new Error(
        `Không thể xác nhận đơn hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Admin manually marks order as shipping
   * Can be triggered anytime after order is in preparing status
   */
  async markAsShipped(orderId: string, trackingNumber?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== 'preparing') {
        throw new Error('Chỉ có thể chuyển sang giao hàng cho đơn hàng đang chuẩn bị (preparing)');
      }

      const now = new Date().toISOString();
      const updateData: any = {
        status: 'shipping',
        shipped_at: now, // This timestamp is used by cron job to auto-mark as shipped after 2 days
        updated_at: now,
      };

      if (trackingNumber) {
        updateData.metadata = {
          ...(order.metadata as any || {}),
          tracking_number: trackingNumber,
        };
      }

      await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      return this.orderModel.findByIdWithDetails(orderId) as Promise<OrderWithDetails>;
    } catch (error) {
      throw new Error(
        `Không thể đánh dấu đang giao hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Admin/Auto marks order as delivered - normally auto-triggered after 2 days from shipping status
   * Can also be manually triggered by admin
   */
  async markAsDelivered(orderId: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== 'shipping') {
        throw new Error('Chỉ có thể hoàn thành đơn hàng đang giao hàng (shipping)');
      }

      const now = new Date().toISOString();

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'delivered',
          fulfillment_status: 'fulfilled',
          delivered_at: now,
          updated_at: now,
        })
        .eq('id', orderId);

      return this.orderModel.findByIdWithDetails(orderId) as Promise<OrderWithDetails>;
    } catch (error) {
      throw new Error(
        `Không thể đánh dấu đã giao hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Admin cancels order
   */
  async cancelOrder(orderId: string, reason?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (['delivered', 'cancelled'].includes(order.status)) {
        throw new Error('Không thể hủy đơn hàng đã giao hoặc đã hủy');
      }

      const updateData: any = {
        status: 'cancelled',
        updated_at: new Date().toISOString(),
      };

      if (reason) {
        updateData.internal_notes = `Lý do hủy: ${reason}\n${order.internal_notes || ''}`;
      }

      await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      // TODO: Refund payment if already paid
      // TODO: Release inventory back to stock

      return this.orderModel.findByIdWithDetails(orderId) as Promise<OrderWithDetails>;
    } catch (error) {
      throw new Error(
        `Không thể hủy đơn hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
