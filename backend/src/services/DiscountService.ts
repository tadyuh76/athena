import { DiscountModel, Discount, CreateDiscountData, UpdateDiscountData } from '../models/DiscountModel.js';
import { DiscountUsageModel, CreateDiscountUsageData } from '../models/DiscountUsageModel.js';

export interface ValidateDiscountResult {
  valid: boolean;
  discount?: Discount;
  error?: string;
  discountAmount?: number;
}

export interface CalculateDiscountParams {
  discountCode: string;
  userId?: string;
  items: Array<{
    product_id: string;
    category_id?: string;
    collection_id?: string;
    quantity: number;
    price: number;
  }>;
  subtotal: number;
}

export class DiscountService {
  private discountModel: DiscountModel;
  private discountUsageModel: DiscountUsageModel;

  constructor() {
    this.discountModel = new DiscountModel();
    this.discountUsageModel = new DiscountUsageModel();
  }

  /**
   * Tạo discount mới
   */
  async createDiscount(data: CreateDiscountData): Promise<Discount> {
    // Validate data
    if (!data.type || !data.value) {
      throw new Error('Loại và giá trị giảm giá là bắt buộc');
    }

    if (data.type === 'percentage' && (data.value <= 0 || data.value > 100)) {
      throw new Error('Giá trị phần trăm phải từ 0-100');
    }

    if ((data.type === 'fixed_amount' || data.type === 'free_shipping') && data.value < 0) {
      throw new Error('Giá trị giảm giá phải lớn hơn 0');
    }

    // Kiểm tra mã code đã tồn tại chưa
    if (data.code) {
      const existing = await this.discountModel.findByCode(data.code);
      if (existing) {
        throw new Error('Mã giảm giá đã tồn tại');
      }
    }

    return await this.discountModel.create(data);
  }

  /**
   * Cập nhật discount
   */
  async updateDiscount(id: string, data: UpdateDiscountData): Promise<Discount> {
    const discount = await this.discountModel.findById(id);
    if (!discount) {
      throw new Error('Không tìm thấy mã giảm giá');
    }

    // Validate data
    if (data.type === 'percentage' && data.value && (data.value <= 0 || data.value > 100)) {
      throw new Error('Giá trị phần trăm phải từ 0-100');
    }

    if (data.type && (data.type === 'fixed_amount' || data.type === 'free_shipping') &&
        data.value && data.value < 0) {
      throw new Error('Giá trị giảm giá phải lớn hơn 0');
    }

    // Kiểm tra mã code nếu thay đổi
    if (data.code && data.code !== discount.code) {
      const existing = await this.discountModel.findByCode(data.code);
      if (existing) {
        throw new Error('Mã giảm giá đã tồn tại');
      }
    }

    return await this.discountModel.update(id, data);
  }

  /**
   * Xóa discount
   */
  async deleteDiscount(id: string): Promise<void> {
    const discount = await this.discountModel.findById(id);
    if (!discount) {
      throw new Error('Không tìm thấy mã giảm giá');
    }

    await this.discountModel.delete(id);
  }

  /**
   * Lấy discount theo ID
   */
  async getDiscountById(id: string): Promise<Discount> {
    const discount = await this.discountModel.findById(id);
    if (!discount) {
      throw new Error('Không tìm thấy mã giảm giá');
    }
    return discount;
  }

  /**
   * Lấy danh sách discounts với filter
   */
  async getDiscounts(filters: {
    is_active?: boolean;
    type?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<{ discounts: Discount[]; total: number; page: number; limit: number }> {
    const result = await this.discountModel.findAllWithFilter(filters);
    return {
      ...result,
      page: filters.page || 1,
      limit: filters.limit || 20
    };
  }

  /**
   * Validate và tính toán discount cho cart
   */
  async validateAndCalculateDiscount(params: CalculateDiscountParams): Promise<ValidateDiscountResult> {
    const { discountCode, userId, items, subtotal } = params;

    // Tìm discount theo code
    const discount = await this.discountModel.findByCode(discountCode);
    if (!discount) {
      return {
        valid: false,
        error: 'Mã giảm giá không tồn tại'
      };
    }

    // Log discount details for debugging
    console.log('[DiscountService] Validating discount:', {
      code: discount.code,
      is_active: discount.is_active,
      starts_at: discount.starts_at,
      ends_at: discount.ends_at,
      usage_count: discount.usage_count,
      usage_limit: discount.usage_limit,
      current_time: new Date().toISOString()
    });

    // Kiểm tra discount còn hợp lệ không
    const isValid = await this.discountModel.isDiscountValid(discount.id);
    if (!isValid) {
      return {
        valid: false,
        error: 'Mã giảm giá đã hết hạn hoặc không còn khả dụng'
      };
    }

    // Kiểm tra usage limit per user
    if (userId && discount.usage_limit_per_user) {
      const userUsageCount = await this.discountModel.getUserUsageCount(discount.id, userId);
      if (userUsageCount >= discount.usage_limit_per_user) {
        return {
          valid: false,
          error: 'Bạn đã sử dụng hết số lần áp dụng mã giảm giá này'
        };
      }
    }

    // Kiểm tra minimum purchase amount
    if (discount.min_purchase_amount && subtotal < discount.min_purchase_amount) {
      return {
        valid: false,
        error: `Giá trị đơn hàng tối thiểu là ${discount.min_purchase_amount.toLocaleString('vi-VN')} đ`
      };
    }

    // Kiểm tra minimum quantity
    if (discount.min_quantity) {
      const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
      if (totalQuantity < discount.min_quantity) {
        return {
          valid: false,
          error: `Số lượng sản phẩm tối thiểu là ${discount.min_quantity}`
        };
      }
    }

    // Kiểm tra applies_to
    if (discount.applies_to !== 'all') {
      const applicableItems = await this.getApplicableItems(discount, items);
      if (applicableItems.length === 0) {
        return {
          valid: false,
          error: 'Mã giảm giá không áp dụng cho sản phẩm trong giỏ hàng'
        };
      }
    }

    // Tính toán discount amount
    const discountAmount = await this.calculateDiscountAmount(discount, items, subtotal);

    return {
      valid: true,
      discount,
      discountAmount
    };
  }

  /**
   * Lấy danh sách items áp dụng được discount
   */
  private async getApplicableItems(
    discount: Discount,
    items: Array<{
      product_id: string;
      category_id?: string;
      collection_id?: string;
      quantity: number;
      price: number;
    }>
  ): Promise<typeof items> {
    if (discount.applies_to === 'all') {
      return items;
    }

    const applicableItems: typeof items = [];

    for (const item of items) {
      let isApplicable = false;

      if (discount.applies_to === 'products') {
        isApplicable = discount.applicable_product_ids.includes(item.product_id);
      } else if (discount.applies_to === 'categories' && item.category_id) {
        isApplicable = discount.applicable_category_ids.includes(item.category_id);
      } else if (discount.applies_to === 'collections' && item.collection_id) {
        isApplicable = discount.applicable_collection_ids.includes(item.collection_id);
      }

      if (isApplicable) {
        applicableItems.push(item);
      }
    }

    return applicableItems;
  }

  /**
   * Tính toán số tiền giảm giá
   */
  private async calculateDiscountAmount(
    discount: Discount,
    items: Array<{
      product_id: string;
      category_id?: string;
      collection_id?: string;
      quantity: number;
      price: number;
    }>,
    subtotal: number
  ): Promise<number> {
    let discountAmount = 0;

    if (discount.type === 'percentage') {
      if (discount.applies_to === 'all') {
        discountAmount = (subtotal * discount.value) / 100;
      } else {
        const applicableItems = await this.getApplicableItems(discount, items);
        const applicableSubtotal = applicableItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );
        discountAmount = (applicableSubtotal * discount.value) / 100;
      }
    } else if (discount.type === 'fixed_amount') {
      discountAmount = discount.value;
    } else if (discount.type === 'free_shipping') {
      // Free shipping - amount sẽ được tính ở frontend/cart summary
      discountAmount = discount.value;
    }

    // Đảm bảo discount amount không vượt quá subtotal
    return Math.min(discountAmount, subtotal);
  }

  /**
   * Tạo discount usage khi order được tạo
   */
  async createDiscountUsage(data: CreateDiscountUsageData): Promise<void> {
    await this.discountUsageModel.create(data);
    await this.discountModel.incrementUsageCount(data.discount_id);
  }

  /**
   * Lấy discount usage history
   */
  async getDiscountUsageHistory(filters: {
    discount_id?: string;
    user_id?: string;
    page?: number;
    limit?: number;
  }) {
    return await this.discountUsageModel.findWithDetails(filters);
  }

  /**
   * Lấy thống kê discount
   */
  async getDiscountStats(discountId: string) {
    const discount = await this.discountModel.findById(discountId);
    if (!discount) {
      throw new Error('Không tìm thấy mã giảm giá');
    }

    const totalSavings = await this.discountUsageModel.getTotalSavings(discountId);

    return {
      discount,
      usage_count: discount.usage_count,
      total_savings: totalSavings,
      remaining_uses: discount.usage_limit
        ? discount.usage_limit - discount.usage_count
        : null
    };
  }
}
