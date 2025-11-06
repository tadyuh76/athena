import { BaseModel } from './BaseModel.js';

export interface DiscountUsage {
  id: string;
  discount_id: string;
  order_id: string;
  user_id: string | null;
  amount_saved: number;
  created_at: string;
}

export interface CreateDiscountUsageData {
  discount_id: string;
  order_id: string;
  user_id?: string;
  amount_saved: number;
}

export class DiscountUsageModel extends BaseModel<DiscountUsage> {
  protected tableName = 'discount_usage';

  /**
   * Lấy discount usage theo order
   */
  async findByOrderId(orderId: string): Promise<DiscountUsage | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('order_id', orderId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null;
      }
      throw error;
    }

    return data;
  }

  /**
   * Lấy tất cả discount usage của một user
   */
  async findByUserId(userId: string, page = 1, limit = 20): Promise<{
    usages: DiscountUsage[];
    total: number;
  }> {
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.client
      .from(this.tableName)
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      throw error;
    }

    return {
      usages: data || [],
      total: count || 0
    };
  }

  /**
   * Lấy discount usage với thông tin chi tiết (join với discount và order)
   */
  async findWithDetails(filters: {
    discount_id?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }): Promise<{ usages: any[]; total: number }> {
    let query = this.client
      .from(this.tableName)
      .select(`
        *,
        discount:discounts(code, description, type),
        order:orders(order_number, total_amount, created_at)
      `, { count: 'exact' });

    if (filters.discount_id) {
      query = query.eq('discount_id', filters.discount_id);
    }

    if (filters.user_id) {
      query = query.eq('user_id', filters.user_id);
    }

    query = query.order('created_at', { ascending: false });

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      usages: data || [],
      total: count || 0
    };
  }

  /**
   * Kiểm tra xem user đã dùng discount trong order nào chưa
   */
  async hasUserUsedDiscountForOrder(
    userId: string,
    discountId: string,
    orderId: string
  ): Promise<boolean> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('id')
      .eq('user_id', userId)
      .eq('discount_id', discountId)
      .eq('order_id', orderId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return !!data;
  }

  /**
   * Thống kê tổng tiền đã tiết kiệm của discount
   */
  async getTotalSavings(discountId: string): Promise<number> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('amount_saved')
      .eq('discount_id', discountId);

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      return 0;
    }

    return data.reduce((sum: number, usage: any) => sum + Number(usage.amount_saved), 0);
  }
}
