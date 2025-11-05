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
          country: 'US',
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
          country: 'US',
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
  async getAllOrders(): Promise<Order[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
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
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: 'paid' | 'failed'
  ): Promise<void> {
    try {
      await this.orderModel.updatePaymentStatus(orderId, paymentStatus);

      // Update order status based on payment
      if (paymentStatus === 'paid') {
        await this.orderModel.updateOrderStatus(orderId, 'processing');
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
   * Admin confirms order - changes status to confirmed and sets estimated delivery
   */
  async confirmOrder(orderId: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== 'processing') {
        throw new Error('Chỉ có thể xác nhận đơn hàng đang xử lý');
      }

      // Set estimated delivery to 3 days from now
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + 3);

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'confirmed',
          estimated_delivery_date: estimatedDelivery.toISOString().split('T')[0],
          updated_at: new Date().toISOString(),
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
   * Admin marks order as shipped
   */
  async markAsShipped(orderId: string, trackingNumber?: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== 'confirmed') {
        throw new Error('Chỉ có thể giao hàng cho đơn hàng đã xác nhận');
      }

      const updateData: any = {
        status: 'shipped',
        fulfillment_status: 'fulfilled',
        updated_at: new Date().toISOString(),
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
        `Không thể đánh dấu đã giao hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Admin marks order as delivered
   */
  async markAsDelivered(orderId: string): Promise<OrderWithDetails> {
    try {
      const order = await this.orderModel.findById(orderId);

      if (!order) {
        throw new Error('Đơn hàng không tồn tại');
      }

      if (order.status !== 'shipped') {
        throw new Error('Chỉ có thể hoàn thành đơn hàng đã giao');
      }

      await supabaseAdmin
        .from('orders')
        .update({
          status: 'delivered',
          fulfillment_status: 'fulfilled',
          updated_at: new Date().toISOString(),
        })
        .eq('id', orderId);

      return this.orderModel.findByIdWithDetails(orderId) as Promise<OrderWithDetails>;
    } catch (error) {
      throw new Error(
        `Không thể đánh dấu đã nhận hàng: ${error instanceof Error ? error.message : 'Unknown error'}`
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
