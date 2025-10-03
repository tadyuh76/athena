"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WishlistController = void 0;
const WishlistService_1 = require("../services/WishlistService");
const request_handler_1 = require("../utils/request-handler");
class WishlistController {
    wishlistService;
    constructor() {
        this.wishlistService = new WishlistService_1.WishlistService();
    }
    async getUserWishlist(req, res) {
        try {
            const wishlist = await this.wishlistService.getUserWishlist(req.userId);
            (0, request_handler_1.sendJSON)(res, 200, wishlist);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Failed to fetch wishlist');
        }
    }
    async addToWishlist(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.wishlistService.addToWishlist(req.userId, body.product_id, body.variant_id, body.notes);
            (0, request_handler_1.sendJSON)(res, 201, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Failed to add to wishlist');
        }
    }
    async removeFromWishlist(req, res, itemId) {
        try {
            await this.wishlistService.removeFromWishlist(req.userId, itemId);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Failed to remove from wishlist');
        }
    }
    async updateWishlistItem(req, res, itemId) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.wishlistService.updateWishlistItem(req.userId, itemId, body);
            (0, request_handler_1.sendJSON)(res, 200, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Failed to update wishlist item');
        }
    }
    async getWishlistCount(req, res) {
        try {
            const count = await this.wishlistService.getWishlistCount(req.userId);
            (0, request_handler_1.sendJSON)(res, 200, { count });
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Failed to get wishlist count');
        }
    }
}
exports.WishlistController = WishlistController;
//# sourceMappingURL=WishlistController.js.map