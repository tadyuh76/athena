import { OrderModel, CreateOrderData, OrderWithDetails } from '../models/OrderModel';
import { CartModel } from '../models/CartModel';
import { ProductVariantModel } from '../models/ProductVariantModel';
import { Order } from '../types/database.types';
import { createPaymentIntent, isStripeConfigured } from '../utils/stripe';
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
}
