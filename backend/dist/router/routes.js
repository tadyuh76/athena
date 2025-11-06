"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.setupRoutes = setupRoutes;
const Router_1 = require("./Router");
const AuthController_1 = require("../controllers/AuthController");
const ProductController_1 = require("../controllers/ProductController");
const CartController_1 = require("../controllers/CartController");
const OrderController_1 = require("../controllers/OrderController");
const ReviewController_1 = require("../controllers/ReviewController");
const StripeWebhookController_1 = require("../controllers/StripeWebhookController");
const AddressController_1 = require("../controllers/AddressController");
const DiscountController_1 = require("../controllers/DiscountController");
const UserManagementController_1 = require("../controllers/UserManagementController");
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
    const orderController = new OrderController_1.OrderController();
    const reviewController = new ReviewController_1.ReviewController();
    const stripeWebhookController = new StripeWebhookController_1.StripeWebhookController();
    const addressController = new AddressController_1.AddressController();
    const discountController = new DiscountController_1.DiscountController();
    const userManagementController = new UserManagementController_1.UserManagementController();
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
    router.put('/api/cart/items/:id', (req, res, params) => cartController.updateItemQuantity(req, res, params.id), [Router_1.Router.optionalAuth]);
    router.delete('/api/cart/items/:id', (req, res, params) => cartController.removeItem(req, res, params.id), [Router_1.Router.optionalAuth]);
    router.get('/api/cart/summary', (req, res) => cartController.getCartSummary(req, res), [Router_1.Router.optionalAuth]);
    router.post('/api/cart/clear', (req, res) => cartController.clearCart(req, res), [Router_1.Router.optionalAuth]);
    router.post('/api/cart/merge', (req, res) => cartController.mergeGuestCart(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/addresses', (req, res) => addressController.getAddresses(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/addresses/default', (req, res) => addressController.getDefaultAddress(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/addresses/:id', (req, res, params) => addressController.getAddressById(req, res, params.id), [Router_1.Router.requireAuth]);
    router.post('/api/addresses', (req, res) => addressController.createAddress(req, res), [Router_1.Router.requireAuth]);
    router.put('/api/addresses/:id', (req, res, params) => addressController.updateAddress(req, res, params.id), [Router_1.Router.requireAuth]);
    router.delete('/api/addresses/:id', (req, res, params) => addressController.deleteAddress(req, res, params.id), [Router_1.Router.requireAuth]);
    router.put('/api/addresses/:id/default', (req, res, params) => addressController.setDefaultAddress(req, res, params.id), [Router_1.Router.requireAuth]);
    router.post('/api/orders', (req, res) => orderController.createOrder(req, res), [Router_1.Router.requireAuth]);
    router.post('/api/orders/checkout-session', (req, res) => orderController.createCheckoutSession(req, res), [Router_1.Router.requireAuth]);
    router.post('/api/orders/buy-now-checkout', (req, res) => orderController.createBuyNowCheckoutSession(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/orders/me', (req, res) => orderController.getMyOrders(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/orders/:id', (req, res, params) => orderController.getOrderById(req, res, params.id), [Router_1.Router.requireAuth]);
    router.get('/api/admin/orders', (req, res) => orderController.getAllOrders(req, res), [Router_1.Router.requireRole(['admin'])]);
    router.post('/api/admin/orders/:id/confirm', (req, res, params) => orderController.confirmOrder(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.post('/api/admin/orders/:id/ship', (req, res, params) => orderController.markAsShipped(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.post('/api/admin/orders/:id/deliver', (req, res, params) => orderController.markAsDelivered(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.post('/api/admin/orders/:id/cancel', (req, res, params) => orderController.cancelOrder(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.post('/api/webhooks/stripe', (req, res) => stripeWebhookController.handleWebhook(req, res));
    router.get('/api/products/:productId/reviews', (req, res, params) => reviewController.getProductReviews(req, res, params.productId), [Router_1.Router.optionalAuth]);
    router.get('/api/products/:productId/reviews/eligibility', (req, res, params) => reviewController.checkReviewEligibility(req, res, params.productId), [Router_1.Router.requireAuth]);
    router.get('/api/reviews/user', (req, res) => reviewController.getUserReviews(req, res), [Router_1.Router.requireAuth]);
    router.get('/api/reviews/:id', (req, res, params) => reviewController.getReviewById(req, res, params.id));
    router.post('/api/reviews', (req, res) => reviewController.createReview(req, res), [Router_1.Router.requireAuth]);
    router.post('/api/reviews/upload-image', (req, res) => reviewController.uploadReviewImage(req, res), [Router_1.Router.requireAuth]);
    router.put('/api/reviews/:id', (req, res, params) => reviewController.updateReview(req, res, params.id), [Router_1.Router.requireAuth]);
    router.delete('/api/reviews/:id', (req, res, params) => reviewController.deleteReview(req, res, params.id), [Router_1.Router.requireAuth]);
    router.post('/api/reviews/:id/helpful', (req, res, params) => reviewController.markHelpful(req, res, params.id));
    router.post('/api/reviews/:id/like', (req, res, params) => reviewController.toggleLike(req, res, params.id), [Router_1.Router.requireAuth]);
    router.post('/api/discounts/validate', (req, res) => discountController.validateDiscount(req, res), [Router_1.Router.optionalAuth]);
    router.get('/api/admin/discounts', (req, res) => discountController.getDiscounts(req, res), [Router_1.Router.requireRole(['admin'])]);
    router.get('/api/admin/discounts/:id', (req, res, params) => discountController.getDiscountById(req, res, params), [Router_1.Router.requireRole(['admin'])]);
    router.post('/api/admin/discounts', (req, res) => discountController.createDiscount(req, res), [Router_1.Router.requireRole(['admin'])]);
    router.put('/api/admin/discounts/:id', (req, res, params) => discountController.updateDiscount(req, res, params), [Router_1.Router.requireRole(['admin'])]);
    router.delete('/api/admin/discounts/:id', (req, res, params) => discountController.deleteDiscount(req, res, params), [Router_1.Router.requireRole(['admin'])]);
    router.get('/api/admin/discounts/:id/stats', (req, res, params) => discountController.getDiscountStats(req, res, params), [Router_1.Router.requireRole(['admin'])]);
    router.get('/api/admin/discounts/:id/usage', (req, res, params) => discountController.getDiscountUsage(req, res, params), [Router_1.Router.requireRole(['admin'])]);
    router.get('/api/admin/users', (req, res) => userManagementController.getAllUsers(req, res), [Router_1.Router.requireRole(['admin'])]);
    router.get('/api/admin/users/stats', (req, res) => userManagementController.getUserStats(req, res), [Router_1.Router.requireRole(['admin'])]);
    router.get('/api/admin/users/:id', (req, res, params) => userManagementController.getUserById(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.put('/api/admin/users/:id/status', (req, res, params) => userManagementController.updateUserStatus(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.put('/api/admin/users/:id/role', (req, res, params) => userManagementController.updateUserRole(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
    router.put('/api/admin/users/:id', (req, res, params) => userManagementController.updateUserProfile(req, res, params.id), [Router_1.Router.requireRole(['admin'])]);
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
            (0, request_handler_1.sendError)(res, 500, "Error loading admin dashboard");
        }
    });
    router.get("/api/admin/collections", CollectionController_1.CollectionController.getAll, [Router_1.Router.requireRole(['admin'])]);
    router.post("/api/admin/collections", CollectionController_1.CollectionController.create, [Router_1.Router.requireRole(['admin'])]);
    router.put("/api/admin/collections/:id", CollectionController_1.CollectionController.update, [Router_1.Router.requireRole(['admin'])]);
    router.delete("/api/admin/collections/:id", CollectionController_1.CollectionController.remove, [Router_1.Router.requireRole(['admin'])]);
    router.post("/api/admin/collections/upload-image", CollectionController_1.CollectionController.uploadImage, [Router_1.Router.requireRole(['admin'])]);
    (0, adminProducts_1.registerAdminProductRoutes)(router);
    (0, adminProductVariant_1.registerAdminProductVariantRoutes)(router);
    (0, adminProductImages_1.registerAdminProductImagesRoutes)(router);
    (0, adminImageBrowser_1.registerAdminImageBrowser)(router);
    return router;
}
//# sourceMappingURL=routes.js.map