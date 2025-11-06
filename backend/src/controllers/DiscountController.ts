import { IncomingMessage, ServerResponse } from 'http';
import { DiscountService } from '../services/DiscountService.js';
import { sendJSON, parseBody } from '../utils/request-handler.js';

export class DiscountController {
  private discountService: DiscountService;

  constructor() {
    this.discountService = new DiscountService();
  }

  /**
   * GET /api/admin/discounts - Lấy danh sách discounts (Admin only)
   */
  async getDiscounts(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const is_active = url.searchParams.get('is_active');
      const type = url.searchParams.get('type');
      const search = url.searchParams.get('search');
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const filters: any = { page, limit };
      if (is_active !== null) {
        filters.is_active = is_active === 'true';
      }
      if (type) {
        filters.type = type;
      }
      if (search) {
        filters.search = search;
      }

      const result = await this.discountService.getDiscounts(filters);
      sendJSON(res, 200, result);
    } catch (error: any) {
      console.error('Error getting discounts:', error);
      sendJSON(res, 500, {
        error: 'Lỗi khi lấy danh sách mã giảm giá',
        details: error.message
      });
    }
  }

  /**
   * GET /api/admin/discounts/:id - Lấy chi tiết discount (Admin only)
   */
  async getDiscountById(_req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      const discount = await this.discountService.getDiscountById(params.id);
      sendJSON(res, 200, discount);
    } catch (error: any) {
      console.error('Error getting discount:', error);
      sendJSON(res, 404, {
        error: error.message || 'Không tìm thấy mã giảm giá'
      });
    }
  }

  /**
   * POST /api/admin/discounts - Tạo discount mới (Admin only)
   */
  async createDiscount(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const data = await parseBody(req);
      const discount = await this.discountService.createDiscount(data);
      sendJSON(res, 201, {
        message: 'Tạo mã giảm giá thành công',
        discount
      });
    } catch (error: any) {
      console.error('Error creating discount:', error);
      sendJSON(res, 400, {
        error: error.message || 'Lỗi khi tạo mã giảm giá'
      });
    }
  }

  /**
   * PUT /api/admin/discounts/:id - Cập nhật discount (Admin only)
   */
  async updateDiscount(req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      const data = await parseBody(req);
      const discount = await this.discountService.updateDiscount(params.id, data);
      sendJSON(res, 200, {
        message: 'Cập nhật mã giảm giá thành công',
        discount
      });
    } catch (error: any) {
      console.error('Error updating discount:', error);
      sendJSON(res, 400, {
        error: error.message || 'Lỗi khi cập nhật mã giảm giá'
      });
    }
  }

  /**
   * DELETE /api/admin/discounts/:id - Xóa discount (Admin only)
   */
  async deleteDiscount(_req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      await this.discountService.deleteDiscount(params.id);
      sendJSON(res, 200, {
        message: 'Xóa mã giảm giá thành công'
      });
    } catch (error: any) {
      console.error('Error deleting discount:', error);
      sendJSON(res, 400, {
        error: error.message || 'Lỗi khi xóa mã giảm giá'
      });
    }
  }

  /**
   * POST /api/discounts/validate - Validate discount code cho checkout
   */
  async validateDiscount(req: IncomingMessage, res: ServerResponse): Promise<void> {
    try {
      const data = await parseBody(req);
      const { code, items, subtotal } = data;

      if (!code || !items || !subtotal) {
        sendJSON(res, 400, {
          error: 'Thiếu thông tin mã giảm giá, sản phẩm hoặc tổng tiền'
        });
        return;
      }

      // Lấy userId từ request nếu có (đã được set bởi optionalAuth middleware)
      const userId = (req as any).userId;

      const result = await this.discountService.validateAndCalculateDiscount({
        discountCode: code,
        userId,
        items,
        subtotal
      });

      if (!result.valid) {
        sendJSON(res, 400, {
          error: result.error
        });
        return;
      }

      sendJSON(res, 200, {
        message: 'Áp dụng mã giảm giá thành công',
        discount: result.discount,
        discountAmount: result.discountAmount
      });
    } catch (error: any) {
      console.error('Error validating discount:', error);
      sendJSON(res, 500, {
        error: 'Lỗi khi kiểm tra mã giảm giá',
        details: error.message
      });
    }
  }

  /**
   * GET /api/admin/discounts/:id/stats - Lấy thống kê discount (Admin only)
   */
  async getDiscountStats(_req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      const stats = await this.discountService.getDiscountStats(params.id);
      sendJSON(res, 200, stats);
    } catch (error: any) {
      console.error('Error getting discount stats:', error);
      sendJSON(res, 404, {
        error: error.message || 'Không tìm thấy mã giảm giá'
      });
    }
  }

  /**
   * GET /api/admin/discounts/:id/usage - Lấy lịch sử sử dụng discount (Admin only)
   */
  async getDiscountUsage(req: IncomingMessage, res: ServerResponse, params: any): Promise<void> {
    try {
      const url = new URL(req.url!, `http://${req.headers.host}`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');

      const result = await this.discountService.getDiscountUsageHistory({
        discount_id: params.id,
        page,
        limit
      });

      sendJSON(res, 200, result);
    } catch (error: any) {
      console.error('Error getting discount usage:', error);
      sendJSON(res, 500, {
        error: 'Lỗi khi lấy lịch sử sử dụng',
        details: error.message
      });
    }
  }
}
