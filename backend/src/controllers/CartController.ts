import { IncomingMessage, ServerResponse } from 'http';
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
      sendError(res, 500, 'Failed to fetch cart');
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
      sendError(res, 500, 'Failed to add item to cart');
    }
  }

  async updateItemQuantity(req: IncomingMessage, res: ServerResponse, itemId: string) {
    try {
      const body = await parseBody(req);
      const result = await this.cartService.updateItemQuantity(itemId, body.quantity);
      sendJSON(res, 200, result);
    } catch (error) {
      sendError(res, 500, 'Failed to update item quantity');
    }
  }

  async removeItem(_req: IncomingMessage, res: ServerResponse, itemId: string) {
    try {
      await this.cartService.removeItem(itemId);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Failed to remove item from cart');
    }
  }

  async getCartSummary(req: AuthRequest, res: ServerResponse) {
    try {
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;
      const summary = await this.cartService.getCartSummary(req.userId, sessionId);
      sendJSON(res, 200, summary);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch cart summary');
    }
  }

  async clearCart(req: AuthRequest, res: ServerResponse) {
    try {
      const { query } = parseUrl(req);
      const sessionId = query.get('session_id') || undefined;
      await this.cartService.clearCart(req.userId, sessionId);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Failed to clear cart');
    }
  }

  async mergeGuestCart(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      await this.cartService.mergeGuestCart(body.session_id, req.userId!);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Failed to merge cart');
    }
  }
}