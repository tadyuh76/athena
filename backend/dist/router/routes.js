"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const Router_1 = require("./Router");
const AuthController_1 = require("../controllers/AuthController");
const ProductController_1 = require("../controllers/ProductController");
const CartController_1 = require("../controllers/CartController");
const WishlistController_1 = require("../controllers/WishlistController");
const OrderController_1 = require("../controllers/OrderController");
const ReviewController_1 = require("../controllers/ReviewController");
const StripeWebhookController_1 = require("../controllers/StripeWebhookController");
const request_handler_1 = require("../utils/request-handler");
const supabase_1 = require("../utils/supabase");
const CollectionController_1 = require("../controllers/CollectionController");
const adminProducts_1 = require("./admin/adminProducts");
const adminProductImages_1 = require("./admin/adminProductImages");
const adminImageBrowser_1 = require("./admin/adminImageBrowser");
const adminProductVariant_1 = require("./admin/adminProductVariant");
function setupRoutes() {
    const router = new Router_1.Router();
    const authController = new AuthController_1.AuthController();
    const productController = new ProductController_1.ProductController();
    const cartController = new CartController_1.CartController();
    const wishlistController = new WishlistController_1.WishlistController();
    const orderController = new OrderController_1.OrderController();
    const reviewController = new ReviewController_1.ReviewController();
    const stripeWebhookController = new StripeWebhookController_1.StripeWebhookController();
    router.post('/api/auth/register', (req, res) => authController.register(req, res));
    router.post('/api/auth/login', (req, res) => authController.login(req, res));
    router.post('/api/auth/logout', (req, res) => authController.logout(req, res), [Router_1.Router.requireAuth]);
    router.post('/api/auth/forgot-password', (req, res) => authController.forgotPassword(req, res));
    router.post('/api/auth/reset-password', (req, res) => authController.resetPassword(req, res));
    router.post('/api/auth/verify-otp', (req, res) => authController.verifyOTP(req, res));
    router.post('/api/auth/resend-verification', (req, res) => authController.resendVerification(req, res));
    router.get('/api/auth/google', (req, res) => authController.googleAuth(req, res));
    router.post('/api/auth/oauth-profile', (req, res) => authController.createOAuthProfile(req, res));
    router.get('/api/auth/me', (req, res) => authController.getMe(req, res), [Router_1.Router.requireAuth]);
    router.put('/api/auth/me', (req, res) => authController.updateMe(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/products', (req, res) => productController.getProducts(req, res));
    router.get('/api/products/:id', (req, res, params) => productController.getProductById(req, res, params.id));
    router.get('/api/products/slug/:slug', (req, res, params) => productController.getProductBySlug(req, res, params.slug));
    router.get('/api/categories', (req, res) => productController.getCategories(req, res));
    router.get('/api/collections', (req, res) => productController.getCollections(req, res));
    router.get('/api/cart', (req, res) => cartController.getCart(req, res), [Router_1.Router.optionalAuth]);
    router.post('/api/cart/items', (req, res) => cartController.addItem(req, res), [Router_1.Router.optionalAuth]);
    router.put('/api/cart/items/:id', (req, res, params) => cartController.updateItemQuantity(req, res, params.id));
    router.delete('/api/cart/items/:id', (req, res, params) => cartController.removeItem(req, res, params.id));
    router.get('/api/cart/summary', (req, res) => cartController.getCartSummary(req, res), [Router_1.Router.optionalAuth]);
    router.post('/api/cart/clear', (req, res) => cartController.clearCart(req, res), [Router_1.Router.optionalAuth]);
    router.post('/api/cart/merge', (req, res) => cartController.mergeGuestCart(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/wishlist', (req, res) => wishlistController.getUserWishlist(req, res), [Router_1.Router.requireAuth]);
    router.post('/api/wishlist', (req, res) => wishlistController.addToWishlist(req, res), [Router_1.Router.requireAuth]);
    router.put('/api/wishlist/:id', (req, res, params) => wishlistController.updateWishlistItem(req, res, params.id), [Router_1.Router.requireAuth]);
    router.delete('/api/wishlist/:id', (req, res, params) => wishlistController.removeFromWishlist(req, res, params.id), [Router_1.Router.requireAuth]);
    router.get('/api/wishlist/count', (req, res) => wishlistController.getWishlistCount(req, res), [Router_1.Router.requireAuth]);
    router.post('/api/orders', (req, res) => orderController.createOrder(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/orders/me', (req, res) => orderController.getMyOrders(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/orders/:id', (req, res, params) => orderController.getOrderById(req, res, params.id), [Router_1.Router.requireAuth]);
    router.get('/api/admin/orders', (req, res) => orderController.getAllOrders(req, res), [Router_1.Router.requireRole(['admin', 'staff'])]);
    router.post('/api/webhooks/stripe', (req, res) => stripeWebhookController.handleWebhook(req, res));
    router.get('/api/products/:productId/reviews', (req, res, params) => reviewController.getProductReviews(req, res, params.productId));
    router.get('/api/products/:productId/reviews/eligibility', (req, res, params) => reviewController.checkReviewEligibility(req, res, params.productId), [Router_1.Router.requireAuth]);
    router.get('/api/reviews/user', (req, res) => reviewController.getUserReviews(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/reviews/:id', (req, res, params) => reviewController.getReviewById(req, res, params.id));
    router.post('/api/reviews', (req, res) => reviewController.createReview(req, res), [Router_1.Router.requireAuth]);
    router.put('/api/reviews/:id', (req, res, params) => reviewController.updateReview(req, res, params.id), [Router_1.Router.requireAuth]);
    router.delete('/api/reviews/:id', (req, res, params) => reviewController.deleteReview(req, res, params.id), [Router_1.Router.requireAuth]);
    router.post('/api/reviews/:id/helpful', (req, res, params) => reviewController.markHelpful(req, res, params.id));
    router.get('/api/health', async (_req, res) => {
        (0, request_handler_1.sendJSON)(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
    });
    router.get("/api/admin/dashboard", async (_req, res) => {
        try {
            const { data: orders, error: ordersError } = await supabase_1.supabase
                .from("orders")
                .select("subtotal, tax_amount, shipping_amount, discount_amount, total_amount");
            if (ordersError)
                throw ordersError;
            const totalOrders = orders?.length || 0;
            const totalRevenue = orders?.reduce((sum, o) => sum + (o.total_amount || 0), 0);
            const { count: totalCollections, error: collectionsError } = await supabase_1.supabase
                .from("product_collections")
                .select("*", { count: "exact", head: true });
            if (collectionsError)
                throw collectionsError;
            const { count: totalProducts, error: productsError } = await supabase_1.supabase
                .from("products")
                .select("*", { count: "exact", head: true });
            if (productsError)
                throw productsError;
            const responseBody = JSON.stringify({
                totalRevenue,
                totalOrders,
                totalCollections: totalCollections ?? 0,
                totalProducts: totalProducts ?? 0,
            });
            res.writeHead(200, { "Content-Type": "application/json" });
            res.end(responseBody);
        }
        catch (error) {
            console.error("Dashboard API Error:", error);
            res.writeHead(500, { "Content-Type": "application/json" });
            res.end(JSON.stringify({ message: "Error loading admin dashboard" }));
        }
    });
    router.get("/api/admin/collections", CollectionController_1.CollectionController.getAll, [Router_1.Router.requireRole(['admin', 'staff'])]);
    router.post("/api/admin/collections", CollectionController_1.CollectionController.create, [Router_1.Router.requireRole(['admin', 'staff'])]);
    router.put("/api/admin/collections/:id", CollectionController_1.CollectionController.update, [Router_1.Router.requireRole(['admin', 'staff'])]);
    router.delete("/api/admin/collections/:id", CollectionController_1.CollectionController.remove, [Router_1.Router.requireRole(['admin', 'staff'])]);
    (0, adminProducts_1.registerAdminProductRoutes)(router);
    (0, adminProductVariant_1.registerAdminProductVariantRoutes)(router);
    (0, adminProductImages_1.registerAdminProductImagesRoutes)(router);
    (0, adminImageBrowser_1.registerAdminImageBrowser)(router);
    return router;
}
//# sourceMappingURL=routes.js.map