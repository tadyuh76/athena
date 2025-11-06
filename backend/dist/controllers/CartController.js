"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartController = void 0;
const CartService_1 = require("../services/CartService");
const request_handler_1 = require("../utils/request-handler");
class CartController {
    cartService;
    constructor() {
        this.cartService = new CartService_1.CartService();
    }
    async getCart(req, res) {
        try {
            console.log('[CartController.getCart] Request received');
            console.log('[CartController.getCart] userId:', req.userId);
            const { query } = (0, request_handler_1.parseUrl)(req);
            const sessionId = query.get('session_id') || undefined;
            console.log('[CartController.getCart] sessionId:', sessionId);
            const cart = await this.cartService.getCart(req.userId, sessionId);
            console.log('[CartController.getCart] Cart retrieved:', { itemCount: cart?.items?.length || 0 });
            (0, request_handler_1.sendJSON)(res, 200, cart);
        }
        catch (error) {
            console.error('[CartController.getCart] Error:', error);
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải giỏ hàng');
        }
    }
    async addItem(req, res) {
        try {
            console.log('[CartController.addItem] Request received');
            console.log('[CartController.addItem] userId:', req.userId);
            const { query } = (0, request_handler_1.parseUrl)(req);
            const body = await (0, request_handler_1.parseBody)(req);
            console.log('[CartController.addItem] Request body:', body);
            const sessionId = body.session_id || query.get('session_id') || undefined;
            console.log('[CartController.addItem] sessionId:', sessionId);
            if (!body.product_id || typeof body.product_id !== 'string') {
                return (0, request_handler_1.sendError)(res, 400, 'product_id là bắt buộc và phải là chuỗi');
            }
            if (!body.variant_id || typeof body.variant_id !== 'string') {
                return (0, request_handler_1.sendError)(res, 400, 'variant_id là bắt buộc và phải là chuỗi');
            }
            if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 999) {
                return (0, request_handler_1.sendError)(res, 400, 'Số lượng phải là số nguyên từ 1 đến 999');
            }
            const result = await this.cartService.addItem(req.userId, sessionId, body.product_id, body.variant_id, body.quantity);
            console.log('[CartController.addItem] Item added successfully:', result.id);
            (0, request_handler_1.sendJSON)(res, 201, result);
        }
        catch (error) {
            console.error('[CartController.addItem] Error:', error);
            (0, request_handler_1.sendError)(res, 500, 'Không thể thêm sản phẩm vào giỏ hàng');
        }
    }
    async updateItemQuantity(req, res, itemId) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const { query } = (0, request_handler_1.parseUrl)(req);
            const sessionId = query.get('session_id') || undefined;
            if (!Number.isInteger(body.quantity) || body.quantity < 1 || body.quantity > 999) {
                return (0, request_handler_1.sendError)(res, 400, 'Số lượng phải là số nguyên từ 1 đến 999');
            }
            const authorized = await this.cartService.verifyCartItemOwnership(itemId, req.userId, sessionId);
            if (!authorized) {
                return (0, request_handler_1.sendError)(res, 403, 'Không có quyền truy cập mục giỏ hàng này');
            }
            const result = await this.cartService.updateItemQuantity(itemId, body.quantity);
            (0, request_handler_1.sendJSON)(res, 200, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể cập nhật số lượng');
        }
    }
    async removeItem(req, res, itemId) {
        try {
            const { query } = (0, request_handler_1.parseUrl)(req);
            const sessionId = query.get('session_id') || undefined;
            const authorized = await this.cartService.verifyCartItemOwnership(itemId, req.userId, sessionId);
            if (!authorized) {
                return (0, request_handler_1.sendError)(res, 403, 'Không có quyền truy cập mục giỏ hàng này');
            }
            await this.cartService.removeItem(itemId);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể xóa sản phẩm khỏi giỏ hàng');
        }
    }
    async getCartSummary(req, res) {
        try {
            const { query } = (0, request_handler_1.parseUrl)(req);
            const sessionId = query.get('session_id') || undefined;
            const summary = await this.cartService.getCartSummary(req.userId, sessionId);
            (0, request_handler_1.sendJSON)(res, 200, summary);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải tóm tắt giỏ hàng');
        }
    }
    async clearCart(req, res) {
        try {
            const { query } = (0, request_handler_1.parseUrl)(req);
            const sessionId = query.get('session_id') || undefined;
            await this.cartService.clearCart(req.userId, sessionId);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể xóa giỏ hàng');
        }
    }
    async mergeGuestCart(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            await this.cartService.mergeGuestCart(body.session_id, req.userId);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể hợp nhất giỏ hàng');
        }
    }
}
exports.CartController = CartController;
//# sourceMappingURL=CartController.js.map