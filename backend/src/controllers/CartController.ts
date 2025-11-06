import { ServerResponse } from 'http';
import { CartService } from '../services/CartService';
import { AuthRequest } from '../middleware/auth';
import { parseBody, sendJSON, sendError, parseUrl } from '../utils/request-handler';

export class CartController {
  private cartService: CartService;

  constructor() {
    this.cartService = new CartService();
  }

  async getCart(req: AuthRequest, res: ServerResponse) {
    try {
      console.log('[CartController.getCart] Request received');
      console.log('[CartController.getCart] userId:', req.userId);
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;
      console.log('[CartController.getCart] sessionId:', sessionId);

      const cart = await this.cartService.getCart(req.userId, sessionId);
      console.log('[CartController.getCart] Cart retrieved:', { itemCount: cart?.items?.length || 0 });
      sendJSON(res, 200, cart);
    } catch (error) {
      console.error('[CartController.getCart] Error:', error);
      sendError(res, 500, 'Không thể tải giỏ hàng');
    }
  }

  async addItem(req: AuthRequest, res: ServerResponse) {
    try {
      console.log('[CartController.addItem] Request received');
      console.log('[CartController.addItem] userId:', req.userId);
      const { query } = parseUrl(req);
      const body = await parseBody(req);
      console.log('[CartController.addItem] Request body:', body);
      const sessionId = body.session_id || query.get('session_id') || undefined;
      console.log('[CartController.addItem] sessionId:', sessionId);

      // Validate input
      if (!body.product_id || typeof body.product_id !== 'string') {
        return sendError(res, 400, 'product_id là bắt buộc và phải là chuỗi');
      }

      if (!body.variant_id || typeof body.variant_id !== 'string') {
        return sendError(res, 400, 'variant_id là bắt buộc và phải là chuỗi');
      }

      if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 999) {
        return sendError(res, 400, 'Số lượng phải là số nguyên từ 1 đến 999');
      }

      const result = await this.cartService.addItem(
        req.userId,
        sessionId,
        body.product_id,
        body.variant_id,
        body.quantity
      );
      console.log('[CartController.addItem] Item added successfully:', result.id);
      sendJSON(res, 201, result);
    } catch (error) {
      console.error('[CartController.addItem] Error:', error);
      sendError(res, 500, 'Không thể thêm sản phẩm vào giỏ hàng');
    }
  }

  async updateItemQuantity(req: AuthRequest, res: ServerResponse, itemId: string) {
    try {
      const body = await parseBody(req);
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;

      // Validate input
      if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 999) {
        return sendError(res, 400, 'Số lượng phải là số nguyên từ 1 đến 999');
      }

      // Verify ownership before update
      const authorized = await this.cartService.verifyCartItemOwnership(
        itemId,
        req.userId,
        sessionId
      );

      if (!authorized) {
        return sendError(res, 403, 'Không có quyền truy cập mục giỏ hàng này');
      }

      const result = await this.cartService.updateItemQuantity(itemId, body.quantity);
      sendJSON(res, 200, result);
    } catch (error) {
      sendError(res, 500, 'Không thể cập nhật số lượng');
    }
  }

  async removeItem(req: AuthRequest, res: ServerResponse, itemId: string) {
    try {
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;

      // Verify ownership before delete
      const authorized = await this.cartService.verifyCartItemOwnership(
        itemId,
        req.userId,
        sessionId
      );

      if (!authorized) {
        return sendError(res, 403, 'Không có quyền truy cập mục giỏ hàng này');
      }

      await this.cartService.removeItem(itemId);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Không thể xóa sản phẩm khỏi giỏ hàng');
    }
  }

  async getCartSummary(req: AuthRequest, res: ServerResponse) {
    try {
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;
      const summary = await this.cartService.getCartSummary(req.userId, sessionId);
      sendJSON(res, 200, summary);
    } catch (error) {
      sendError(res, 500, 'Không thể tải tóm tắt giỏ hàng');
    }
  }

  async clearCart(req: AuthRequest, res: ServerResponse) {
    try {
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;
      await this.cartService.clearCart(req.userId, sessionId);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Không thể xóa giỏ hàng');
    }
  }

  async mergeGuestCart(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      await this.cartService.mergeGuestCart(body.session_id, req.userId!);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Không thể hợp nhất giỏ hàng');
    }
  }
}