import { BaseModel } from './BaseModel.js';

export interface Discount {
  id: string;
  code: string | null;
  description: string | null;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_purchase_amount: number | null;
  min_quantity: number | null;
  usage_limit: number | null;
  usage_limit_per_user: number | null;
  usage_count: number;
  applies_to: 'all' | 'products' | 'categories' | 'collections';
  applicable_product_ids: string[];
  applicable_category_ids: string[];
  applicable_collection_ids: string[];
  is_active: boolean;
  starts_at: string;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDiscountData {
  code?: string;
  description?: string;
  type: 'percentage' | 'fixed_amount' | 'free_shipping';
  value: number;
  min_purchase_amount?: number;
  min_quantity?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  applies_to?: 'all' | 'products' | 'categories' | 'collections';
  applicable_product_ids?: string[];
  applicable_category_ids?: string[];
  applicable_collection_ids?: string[];
  is_active?: boolean;
  starts_at?: string;
  ends_at?: string;
}

export interface UpdateDiscountData {
  code?: string;
  description?: string;
  type?: 'percentage' | 'fixed_amount' | 'free_shipping';
  value?: number;
  min_purchase_amount?: number;
  min_quantity?: number;
  usage_limit?: number;
  usage_limit_per_user?: number;
  applies_to?: 'all' | 'products' | 'categories' | 'collections';
  applicable_product_ids?: string[];
  applicable_category_ids?: string[];
  applicable_collection_ids?: string[];
  is_active?: boolean;
  starts_at?: string;
  ends_at?: string;
}

export class DiscountModel extends BaseModel<Discount> {
  protected tableName = 'discounts';

  /**
   * Tìm discount theo mã code
   */
  async findByCode(code: string): Promise<Discount | null> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('code', code)
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
   * Kiểm tra xem discount có hợp lệ không (còn hạn, còn lượt dùng)
   */
  async isDiscountValid(discountId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from(this.tableName)
      .select('is_active, starts_at, ends_at, usage_limit, usage_count')
      .eq('id', discountId)
      .single();

    if (error || !data) {
      console.log('[DiscountModel] Error or no data:', error);
      return false;
    }

    const now = new Date();
    const startsAt = new Date(data.starts_at);
    const endsAt = data.ends_at ? new Date(data.ends_at) : null;

    console.log('[DiscountModel] Validation check:', {
      now: now.toISOString(),
      startsAt: startsAt.toISOString(),
      endsAt: endsAt?.toISOString(),
      is_active: data.is_active,
      usage_count: data.usage_count,
      usage_limit: data.usage_limit
    });

    // Kiểm tra trạng thái active
    if (!data.is_active) {
      console.log('[DiscountModel] Discount is not active');
      return false;
    }

    // Kiểm tra thời gian
    if (now < startsAt) {
      console.log('[DiscountModel] Discount has not started yet');
      return false;
    }

    if (endsAt && now > endsAt) {
      console.log('[DiscountModel] Discount has expired');
      return false;
    }

    // Kiểm tra usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) {
      console.log('[DiscountModel] Discount usage limit reached');
      return false;
    }

    return true;
  }

  /**
   * Lấy số lần user đã dùng discount
   */
  async getUserUsageCount(discountId: string, userId: string): Promise<number> {
    const { count, error } = await this.client
      .from('discount_usage')
      .select('*', { count: 'exact', head: true })
      .eq('discount_id', discountId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return count || 0;
  }

  /**
   * Tăng usage_count của discount
   */
  async incrementUsageCount(discountId: string): Promise<void> {
    const discount = await this.findById(discountId);
    if (!discount) {
      throw new Error('Discount not found');
    }

    await this.update(discountId, {
      usage_count: (discount.usage_count || 0) + 1
    } as any);
  }

  /**
   * Lấy danh sách discounts với filter
   */
  async findAllWithFilter(filters: {
    is_active?: boolean;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ discounts: Discount[]; total: number }> {
    let query = this.client.from(this.tableName).select('*', { count: 'exact' });

    if (filters.is_active !== undefined) {
      query = query.eq('is_active', filters.is_active);
    }

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.search) {
      query = query.or(`code.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    // Order by created_at desc
    query = query.order('created_at', { ascending: false });

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const offset = (page - 1) * limit;

    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      discounts: data || [],
      total: count || 0
    };
  }

  /**
   * Lấy danh sách discount đang active và còn hạn
   */
  async findActiveDiscounts(): Promise<Discount[]> {
    const now = new Date().toISOString();

    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('is_active', true)
      .lte('starts_at', now)
      .or(`ends_at.is.null,ends_at.gte.${now}`)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data || [];
  }
}
