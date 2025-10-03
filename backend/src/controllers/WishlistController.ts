import { ServerResponse } from 'http';
import { WishlistService } from '../services/WishlistService';
import { AuthRequest } from '../middleware/auth';
import { parseBody, sendJSON, sendError } from '../utils/request-handler';

export class WishlistController {
  private wishlistService: WishlistService;

  constructor() {
    this.wishlistService = new WishlistService();
  }

  async getUserWishlist(req: AuthRequest, res: ServerResponse) {
    try {
      const wishlist = await this.wishlistService.getUserWishlist(req.userId!);
      sendJSON(res, 200, wishlist);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch wishlist');
    }
  }

  async addToWishlist(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.wishlistService.addToWishlist(
        req.userId!,
        body.product_id,
        body.variant_id,
        body.notes
      );
      sendJSON(res, 201, result);
    } catch (error) {
      sendError(res, 500, 'Failed to add to wishlist');
    }
  }

  async removeFromWishlist(req: AuthRequest, res: ServerResponse, itemId: string) {
    try {
      await this.wishlistService.removeFromWishlist(req.userId!, itemId);
      sendJSON(res, 200, { success: true });
    } catch (error) {
      sendError(res, 500, 'Failed to remove from wishlist');
    }
  }

  async updateWishlistItem(req: AuthRequest, res: ServerResponse, itemId: string) {
    try {
      const body = await parseBody(req);
      const result = await this.wishlistService.updateWishlistItem(
        req.userId!,
        itemId,
        body
      );
      sendJSON(res, 200, result);
    } catch (error) {
      sendError(res, 500, 'Failed to update wishlist item');
    }
  }

  async getWishlistCount(req: AuthRequest, res: ServerResponse) {
    try {
      const count = await this.wishlistService.getWishlistCount(req.userId!);
      sendJSON(res, 200, { count });
    } catch (error) {
      sendError(res, 500, 'Failed to get wishlist count');
    }
  }
}