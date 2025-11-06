import { BaseModel } from './BaseModel';
import { Order } from '../types/database.types';

export interface OrderItem {
  product_id: string;
  variant_id: string;
  quantity: number;
  price_at_time: number;
  product_name: string;
  product_sku: string;
  variant_title?: string;
  product_image_url?: string;
}

export interface OrderAddress {
  type: 'billing' | 'shipping' | 'both';
  first_name: string;
  last_name: string;
  address_line1: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  phone?: string;
}

export interface CreateOrderData {
  user_id?: string;
  customer_email: string;
  customer_phone?: string;
  subtotal: number;
  tax_amount: number;
  shipping_amount: number;
  discount_amount: number;
  total_amount: number;
  shipping_method?: string;
  customer_notes?: string;
  items: OrderItem[];
  shippingAddress: OrderAddress;
}

export interface OrderWithDetails extends Order {
  items?: any[];
  shipping_address?: any;
}

export class OrderModel extends BaseModel<Order> {
  protected tableName = 'orders';

  constructor() {
    super();
  }

  /**
   * Create a complete order with items and address
   */
  async createOrderWithDetails(orderData: CreateOrderData): Promise<OrderWithDetails> {
    try {
      console.log('[OrderModel.createOrderWithDetails] Starting order creation');
      console.log('[OrderModel.createOrderWithDetails] Order data items:', JSON.stringify(orderData.items, null, 2));

      // 1. Generate order number
      const orderNumber = await this.generateOrderNumber();
      console.log('[OrderModel.createOrderWithDetails] Generated order number:', orderNumber);

      // 2. Create order
      const { data: order, error: orderError } = await this.adminClient
        .from(this.tableName)
        .insert({
          order_number: orderNumber,
          user_id: orderData.user_id,
          customer_email: orderData.customer_email,
          customer_phone: orderData.customer_phone,
          status: 'pending',
          payment_status: 'pending',
          fulfillment_status: 'unfulfilled',
          currency_code: 'USD',
          subtotal: orderData.subtotal,
          tax_amount: orderData.tax_amount,
          shipping_amount: orderData.shipping_amount,
          discount_amount: orderData.discount_amount,
          total_amount: orderData.total_amount,
          shipping_method: orderData.shipping_method,
          customer_notes: orderData.customer_notes,
        })
        .select()
        .single();

      if (orderError) {
        console.error('[OrderModel.createOrderWithDetails] Order creation error:', orderError);
        throw orderError;
      }
      console.log('[OrderModel.createOrderWithDetails] Order created successfully:', order.id);

      // 3. Create order items
      const orderItems = orderData.items.map(item => ({
        order_id: order.id,
        product_id: item.product_id,
        variant_id: item.variant_id,
        quantity: item.quantity,
        product_name: item.product_name,
        product_sku: item.product_sku,
        variant_title: item.variant_title,
        product_image_url: item.product_image_url,
        unit_price: item.price_at_time,
        total_price: item.price_at_time * item.quantity,
        discount_amount: 0,
        tax_amount: 0,
      }));

      console.log('[OrderModel.createOrderWithDetails] Inserting order items:', JSON.stringify(orderItems, null, 2));

      const { error: itemsError } = await this.adminClient
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('[OrderModel.createOrderWithDetails] Order items error:', itemsError);
        throw itemsError;
      }
      console.log('[OrderModel.createOrderWithDetails] Order items created successfully');

      // 4. Create shipping address
      console.log('[OrderModel.createOrderWithDetails] Creating shipping address');
      const { error: addressError } = await this.adminClient
        .from('order_addresses')
        .insert({
          order_id: order.id,
          type: 'shipping',
          first_name: orderData.shippingAddress.first_name,
          last_name: orderData.shippingAddress.last_name,
          address_line1: orderData.shippingAddress.address_line1,
          city: orderData.shippingAddress.city,
          state_province: orderData.shippingAddress.state,
          postal_code: orderData.shippingAddress.postal_code,
          country_code: orderData.shippingAddress.country || 'US',
          phone: orderData.shippingAddress.phone,
        });

      if (addressError) {
        console.error('[OrderModel.createOrderWithDetails] Address creation error:', addressError);
        throw addressError;
      }
      console.log('[OrderModel.createOrderWithDetails] Address created successfully');

      console.log('[OrderModel.createOrderWithDetails] Order creation complete');
      return order;
    } catch (error) {
      console.error('[OrderModel.createOrderWithDetails] Fatal error:', error);
      throw new Error(
        `Failed to create order: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate unique order number in format: ATH-YYYYMMDD-####
   */
  async generateOrderNumber(): Promise<string> {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');

    const orderNumber = `ATH-${dateStr}-${random}`;

    // Check if order number already exists (very rare collision)
    const existing = await this.findByOrderNumber(orderNumber);

    if (existing) {
      // Regenerate if collision
      return this.generateOrderNumber();
    }

    return orderNumber;
  }

  /**
   * Find order by order number
   */
  async findByOrderNumber(orderNumber: string): Promise<Order | null> {
    try {
      const { data, error } = await this.adminClient
        .from(this.tableName)
        .select('*')
        .eq('order_number', orderNumber)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(
        `Failed to find order by number: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Find orders by user ID
   */
  async findByUserId(userId: string): Promise<Order[]> {
    try {
      const { data, error } = await this.adminClient
        .from(this.tableName)
        .select(`
          *,
          items:order_items(
            id,
            product_name,
            variant_title,
            quantity,
            unit_price
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      throw new Error(
        `Failed to find orders by user: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Update order status
   */
  async updateOrderStatus(
    orderId: string,
    status: string
  ): Promise<Order> {
    return this.update(orderId, { status } as any);
  }

  /**
   * Update payment status
   */
  async updatePaymentStatus(
    orderId: string,
    paymentStatus: string
  ): Promise<Order> {
    return this.update(orderId, { payment_status: paymentStatus } as any);
  }

  /**
   * Get order with all details (items, addresses)
   */
  async findByIdWithDetails(orderId: string): Promise<OrderWithDetails | null> {
    try {
      const { data, error } = await this.adminClient
        .from(this.tableName)
        .select(`
          *,
          items:order_items(
            *,
            product:products(*),
            variant:product_variants(*)
          ),
          shipping_address:order_addresses!order_addresses_order_id_fkey(*)
        `)
        .eq('id', orderId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(
        `Failed to find order with details: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}
