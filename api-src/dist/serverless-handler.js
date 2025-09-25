"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = handleRequest;
const AuthService_1 = require("./services/AuthService");
const ProductService_1 = require("./services/ProductService");
const WishlistService_1 = require("./services/WishlistService");
const CartService_1 = require("./services/CartService");
const auth_1 = require("./middleware/auth");
const request_handler_1 = require("./utils/request-handler");
const authService = new AuthService_1.AuthService();
const productService = new ProductService_1.ProductService();
const wishlistService = new WishlistService_1.WishlistService();
const cartService = new CartService_1.CartService();
async function handleRequest(req, res) {
    (0, request_handler_1.setCorsHeaders)(res);
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    const { pathname, query } = (0, request_handler_1.parseUrl)(req);
    const method = req.method || 'GET';
    try {
        if (pathname === '/api/auth/register' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.register(body);
            (0, request_handler_1.sendJSON)(res, result.success ? 201 : 400, result);
            return;
        }
        if (pathname === '/api/auth/login' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.login(body);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 401, result);
            return;
        }
        if (pathname === '/api/auth/logout' && method === 'POST') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const result = await authService.logout();
            (0, request_handler_1.sendJSON)(res, 200, result);
            return;
        }
        if (pathname === '/api/auth/forgot-password' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.forgotPassword(body.email);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
            return;
        }
        if (pathname === '/api/auth/reset-password' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.resetPassword(body.password);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
            return;
        }
        if (pathname === '/api/auth/verify-otp' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.verifyOTP(body.email, body.otp);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
            return;
        }
        if (pathname === '/api/auth/resend-verification' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.resendVerificationEmail(body.email);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
            return;
        }
        if (pathname === '/api/auth/google' && method === 'GET') {
            try {
                const { url } = await authService.googleAuth();
                res.writeHead(302, { Location: url });
                res.end();
            }
            catch (error) {
                (0, request_handler_1.sendError)(res, 500, 'Google auth failed');
            }
            return;
        }
        if (pathname === '/api/auth/oauth-profile' && method === 'POST') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.createOAuthProfile(body.user_id, body.email, body.metadata);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
            return;
        }
        if (pathname === '/api/auth/me' && method === 'GET') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            (0, request_handler_1.sendJSON)(res, 200, { user: authReq.user });
            return;
        }
        if (pathname === '/api/auth/me' && method === 'PUT') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await authService.updateUser(authReq.userId, body);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
            return;
        }
        if (pathname === '/api/products' && method === 'GET') {
            const page = parseInt(query.get('page') || '1');
            const limit = parseInt(query.get('limit') || '20');
            const filter = {
                category_id: query.get('category_id') || undefined,
                collection_id: query.get('collection_id') || undefined,
                min_price: query.get('min_price') ? parseFloat(query.get('min_price')) : undefined,
                max_price: query.get('max_price') ? parseFloat(query.get('max_price')) : undefined,
                in_stock: query.get('in_stock') === 'true',
                is_featured: query.get('featured') === 'true',
                search: query.get('search') || undefined,
                status: (query.get('status') || 'active')
            };
            const result = await productService.getProducts(filter, page, limit);
            (0, request_handler_1.sendJSON)(res, 200, result);
            return;
        }
        const productByIdMatch = (0, request_handler_1.matchRoute)(pathname, '/api/products/:id');
        if (productByIdMatch && method === 'GET') {
            const product = await productService.getProductById(productByIdMatch.id);
            if (!product) {
                (0, request_handler_1.sendError)(res, 404, 'Product not found');
                return;
            }
            (0, request_handler_1.sendJSON)(res, 200, product);
            return;
        }
        const productBySlugMatch = (0, request_handler_1.matchRoute)(pathname, '/api/products/slug/:slug');
        if (productBySlugMatch && method === 'GET') {
            const product = await productService.getProductBySlug(productBySlugMatch.slug);
            if (!product) {
                (0, request_handler_1.sendError)(res, 404, 'Product not found');
                return;
            }
            (0, request_handler_1.sendJSON)(res, 200, product);
            return;
        }
        if (pathname === '/api/categories' && method === 'GET') {
            const categories = await productService.getCategories();
            (0, request_handler_1.sendJSON)(res, 200, categories);
            return;
        }
        if (pathname === '/api/collections' && method === 'GET') {
            const collections = await productService.getCollections();
            (0, request_handler_1.sendJSON)(res, 200, collections);
            return;
        }
        if (pathname === '/api/wishlist' && method === 'GET') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const wishlist = await wishlistService.getUserWishlist(authReq.userId);
            (0, request_handler_1.sendJSON)(res, 200, wishlist);
            return;
        }
        if (pathname === '/api/wishlist' && method === 'POST') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await wishlistService.addToWishlist(authReq.userId, body.product_id, body.variant_id, body.notes);
            (0, request_handler_1.sendJSON)(res, 201, result);
            return;
        }
        const wishlistItemMatch = (0, request_handler_1.matchRoute)(pathname, '/api/wishlist/:id');
        if (wishlistItemMatch && method === 'DELETE') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            await wishlistService.removeFromWishlist(authReq.userId, wishlistItemMatch.id);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
            return;
        }
        if (wishlistItemMatch && method === 'PUT') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await wishlistService.updateWishlistItem(authReq.userId, wishlistItemMatch.id, body);
            (0, request_handler_1.sendJSON)(res, 200, result);
            return;
        }
        if (pathname === '/api/wishlist/count' && method === 'GET') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const count = await wishlistService.getWishlistCount(authReq.userId);
            (0, request_handler_1.sendJSON)(res, 200, { count });
            return;
        }
        if (pathname === '/api/cart' && method === 'GET') {
            const authReq = req;
            await (0, auth_1.optionalAuth)(authReq);
            const sessionId = query.get('session_id') || undefined;
            const cart = await cartService.getCart(authReq.userId, sessionId);
            (0, request_handler_1.sendJSON)(res, 200, cart);
            return;
        }
        if (pathname === '/api/cart/items' && method === 'POST') {
            const authReq = req;
            await (0, auth_1.optionalAuth)(authReq);
            const body = await (0, request_handler_1.parseBody)(req);
            const sessionId = body.session_id || query.get('session_id') || undefined;
            const result = await cartService.addItem(authReq.userId, sessionId, body.product_id, body.variant_id, body.quantity);
            (0, request_handler_1.sendJSON)(res, 201, result);
            return;
        }
        if (pathname === '/api/cart/summary' && method === 'GET') {
            const authReq = req;
            await (0, auth_1.optionalAuth)(authReq);
            const sessionId = query.get('session_id') || undefined;
            const summary = await cartService.getCartSummary(authReq.userId, sessionId);
            (0, request_handler_1.sendJSON)(res, 200, summary);
            return;
        }
        const cartItemMatch = (0, request_handler_1.matchRoute)(pathname, '/api/cart/items/:id');
        if (cartItemMatch && method === 'PUT') {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await cartService.updateItemQuantity(cartItemMatch.id, body.quantity);
            (0, request_handler_1.sendJSON)(res, 200, result);
            return;
        }
        if (cartItemMatch && method === 'DELETE') {
            await cartService.removeItem(cartItemMatch.id);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
            return;
        }
        if (pathname === '/api/cart/clear' && method === 'POST') {
            const authReq = req;
            await (0, auth_1.optionalAuth)(authReq);
            const sessionId = query.get('session_id') || undefined;
            await cartService.clearCart(authReq.userId, sessionId);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
            return;
        }
        if (pathname === '/api/cart/merge' && method === 'POST') {
            const authReq = req;
            if (!await (0, auth_1.requireAuth)(authReq, res))
                return;
            const body = await (0, request_handler_1.parseBody)(req);
            await cartService.mergeGuestCart(body.session_id, authReq.userId);
            (0, request_handler_1.sendJSON)(res, 200, { success: true });
            return;
        }
        if (pathname === '/api/health' && method === 'GET') {
            (0, request_handler_1.sendJSON)(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
            return;
        }
        (0, request_handler_1.sendError)(res, 404, 'Route not found');
    }
    catch (error) {
        console.error('Server error:', error);
        (0, request_handler_1.sendError)(res, 500, 'Internal server error');
    }
}
//# sourceMappingURL=serverless-handler.js.map