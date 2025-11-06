import { Router } from './Router';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CartController } from '../controllers/CartController';
import { OrderController } from '../controllers/OrderController';
import { ReviewController } from '../controllers/ReviewController';
import { StripeWebhookController } from '../controllers/StripeWebhookController';
import { AddressController } from '../controllers/AddressController';
import { DiscountController } from '../controllers/DiscountController';
import { UserManagementController } from '../controllers/UserManagementController';
import { sendJSON, sendError } from '../utils/request-handler';
import { supabase } from "../utils/supabase";
import { CollectionController } from "../controllers/CollectionController";
import { registerAdminProductRoutes } from "./admin/adminProducts";
import { registerAdminProductImagesRoutes } from "./admin/adminProductImages";
import { registerAdminImageBrowser } from "./admin/adminImageBrowser";
import { registerAdminProductVariantRoutes } from "./admin/adminProductVariant";


export function setupRoutes(): Router {
  const router = new Router();

  const authController = new AuthController();
  const productController = new ProductController();
  const cartController = new CartController();
  const orderController = new OrderController();
  const reviewController = new ReviewController();
  const stripeWebhookController = new StripeWebhookController();
  const addressController = new AddressController();
  const discountController = new DiscountController();
  const userManagementController = new UserManagementController();

  // Auth routes
  router.post('/api/auth/register', (req, res) => authController.register(req, res));
  router.post('/api/auth/login', (req, res) => authController.login(req, res));
  router.post('/api/auth/logout', (req, res)  => authController.logout(req, res), [Router.requireAuth]);
  router.post('/api/auth/forgot-password', (req, res) => authController.forgotPassword(req, res));
  router.post('/api/auth/reset-password', (req, res) => authController.resetPassword(req, res));
  router.post('/api/auth/verify-otp', (req, res) => authController.verifyOTP(req, res));
  router.post('/api/auth/resend-verification', (req, res) => authController.resendVerification(req, res));
  router.get('/api/auth/google', (req, res) => authController.googleAuth(req, res));
  router.post('/api/auth/oauth-profile', (req, res) => authController.createOAuthProfile(req, res));
  router.get('/api/auth/me', (req, res) => authController.getMe(req, res), [Router.requireAuth]);
  router.put('/api/auth/me', (req, res) => authController.updateMe(req, res), [Router.requireAuth]);

  // Product routes
  router.get('/api/products', (req, res) => productController.getProducts(req, res));
  router.get('/api/products/:id', (req, res, params) => productController.getProductById(req, res, params.id));
  router.get('/api/products/slug/:slug', (req, res, params) => productController.getProductBySlug(req, res, params.slug));
  router.get('/api/categories', (req, res) => productController.getCategories(req, res));
  router.get('/api/collections', (req, res) => productController.getCollections(req, res));

  // Cart routes
  router.get('/api/cart', (req, res) => cartController.getCart(req, res), [Router.optionalAuth]);
  router.post('/api/cart/items', (req, res) => cartController.addItem(req, res), [Router.optionalAuth]);
  router.put('/api/cart/items/:id', (req, res, params) => cartController.updateItemQuantity(req, res, params.id), [Router.optionalAuth]);
  router.delete('/api/cart/items/:id', (req, res, params) => cartController.removeItem(req, res, params.id), [Router.optionalAuth]);
  router.get('/api/cart/summary', (req, res) => cartController.getCartSummary(req, res), [Router.optionalAuth]);
  router.post('/api/cart/clear', (req, res) => cartController.clearCart(req, res), [Router.optionalAuth]);
  router.post('/api/cart/merge', (req, res) => cartController.mergeGuestCart(req, res), [Router.requireAuth]);

  // Address routes
  router.get('/api/addresses', (req, res) => addressController.getAddresses(req, res), [Router.requireAuth]);
  router.get('/api/addresses/default', (req, res) => addressController.getDefaultAddress(req, res), [Router.requireAuth]);
  router.get('/api/addresses/:id', (req, res, params) => addressController.getAddressById(req, res, params.id), [Router.requireAuth]);
  router.post('/api/addresses', (req, res) => addressController.createAddress(req, res), [Router.requireAuth]);
  router.put('/api/addresses/:id', (req, res, params) => addressController.updateAddress(req, res, params.id), [Router.requireAuth]);
  router.delete('/api/addresses/:id', (req, res, params) => addressController.deleteAddress(req, res, params.id), [Router.requireAuth]);
  router.put('/api/addresses/:id/default', (req, res, params) => addressController.setDefaultAddress(req, res, params.id), [Router.requireAuth]);

  // Order routes
  // CUSTOMER: Create order
  router.post('/api/orders', (req, res) => orderController.createOrder(req, res), [Router.requireAuth]);
  // CUSTOMER: Create Stripe Checkout Session
  router.post('/api/orders/checkout-session', (req, res) => orderController.createCheckoutSession(req, res), [Router.requireAuth]);
  // CUSTOMER: Create Buy Now Checkout Session (direct purchase without cart)
  router.post('/api/orders/buy-now-checkout', (req, res) => orderController.createBuyNowCheckoutSession(req, res), [Router.requireAuth]);
  // CUSTOMER: Get my orders
  router.get('/api/orders/me', (req, res) => orderController.getMyOrders(req, res), [Router.requireAuth]);
  // CUSTOMER/ADMIN: Get order by ID
  router.get('/api/orders/:id', (req, res, params) => orderController.getOrderById(req, res, params.id), [Router.requireAuth]);
  // ADMIN: Get all orders
  router.get(
    '/api/admin/orders',
    (req, res) => orderController.getAllOrders(req, res),
    [Router.requireRole(['admin'])]
  );
  // ADMIN: Confirm order
  router.post(
    '/api/admin/orders/:id/confirm',
    (req, res, params) => orderController.confirmOrder(req, res, params.id),
    [Router.requireRole(['admin'])]
  );
  // ADMIN: Mark as shipped
  router.post(
    '/api/admin/orders/:id/ship',
    (req, res, params) => orderController.markAsShipped(req, res, params.id),
    [Router.requireRole(['admin'])]
  );
  // ADMIN: Mark as delivered
  router.post(
    '/api/admin/orders/:id/deliver',
    (req, res, params) => orderController.markAsDelivered(req, res, params.id),
    [Router.requireRole(['admin'])]
  );
  // ADMIN: Cancel order
  router.post(
    '/api/admin/orders/:id/cancel',
    (req, res, params) => orderController.cancelOrder(req, res, params.id),
    [Router.requireRole(['admin'])]
  );

  // Stripe Webhook route (must be before other POST routes to handle raw body)
  router.post('/api/webhooks/stripe', (req, res) => stripeWebhookController.handleWebhook(req, res));

  // Review routes
  router.get('/api/products/:productId/reviews', (req, res, params) => reviewController.getProductReviews(req, res, params.productId), [Router.optionalAuth]);
  router.get('/api/products/:productId/reviews/eligibility', (req, res, params) => reviewController.checkReviewEligibility(req, res, params.productId), [Router.requireAuth]);
  router.get('/api/reviews/user', (req, res) => reviewController.getUserReviews(req, res), [Router.requireAuth]);
  router.get('/api/reviews/:id', (req, res, params) => reviewController.getReviewById(req, res, params.id));
  router.post('/api/reviews', (req, res) => reviewController.createReview(req, res), [Router.requireAuth]);
  router.post('/api/reviews/upload-image', (req, res) => reviewController.uploadReviewImage(req, res), [Router.requireAuth]);
  router.put('/api/reviews/:id', (req, res, params) => reviewController.updateReview(req, res, params.id), [Router.requireAuth]);
  router.delete('/api/reviews/:id', (req, res, params) => reviewController.deleteReview(req, res, params.id), [Router.requireAuth]);
  router.post('/api/reviews/:id/helpful', (req, res, params) => reviewController.markHelpful(req, res, params.id));
  router.post('/api/reviews/:id/like', (req, res, params) => reviewController.toggleLike(req, res, params.id), [Router.requireAuth]);

  // Discount routes
  // CUSTOMER: Validate discount code for checkout
  router.post('/api/discounts/validate', (req, res) => discountController.validateDiscount(req, res), [Router.optionalAuth]);
  // ADMIN: Get all discounts
  router.get('/api/admin/discounts', (req, res) => discountController.getDiscounts(req, res), [Router.requireRole(['admin'])]);
  // ADMIN: Get discount by ID
  router.get('/api/admin/discounts/:id', (req, res, params) => discountController.getDiscountById(req, res, params), [Router.requireRole(['admin'])]);
  // ADMIN: Create discount
  router.post('/api/admin/discounts', (req, res) => discountController.createDiscount(req, res), [Router.requireRole(['admin'])]);
  // ADMIN: Update discount
  router.put('/api/admin/discounts/:id', (req, res, params) => discountController.updateDiscount(req, res, params), [Router.requireRole(['admin'])]);
  // ADMIN: Delete discount
  router.delete('/api/admin/discounts/:id', (req, res, params) => discountController.deleteDiscount(req, res, params), [Router.requireRole(['admin'])]);
  // ADMIN: Get discount stats
  router.get('/api/admin/discounts/:id/stats', (req, res, params) => discountController.getDiscountStats(req, res, params), [Router.requireRole(['admin'])]);
  // ADMIN: Get discount usage history
  router.get('/api/admin/discounts/:id/usage', (req, res, params) => discountController.getDiscountUsage(req, res, params), [Router.requireRole(['admin'])]);

  // User Management routes (Admin only)
  // ADMIN: Get all users with pagination and filters
  router.get('/api/admin/users', (req, res) => userManagementController.getAllUsers(req, res), [Router.requireRole(['admin'])]);
  // ADMIN: Get user statistics
  router.get('/api/admin/users/stats', (req, res) => userManagementController.getUserStats(req, res), [Router.requireRole(['admin'])]);
  // ADMIN: Get user by ID
  router.get('/api/admin/users/:id', (req, res, params) => userManagementController.getUserById(req, res, params.id), [Router.requireRole(['admin'])]);
  // ADMIN: Update user status
  router.put('/api/admin/users/:id/status', (req, res, params) => userManagementController.updateUserStatus(req, res, params.id), [Router.requireRole(['admin'])]);
  // ADMIN: Update user role
  router.put('/api/admin/users/:id/role', (req, res, params) => userManagementController.updateUserRole(req, res, params.id), [Router.requireRole(['admin'])]);
  // ADMIN: Update user profile
  router.put('/api/admin/users/:id', (req, res, params) => userManagementController.updateUserProfile(req, res, params.id), [Router.requireRole(['admin'])]);

  // Health check
  router.get('/api/health', async (_req, res) => {
    sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  });

  // Admin Dashboard route
  router.get("/api/admin/dashboard", async (_req, res) => {
    try {
      // Get orders data
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("subtotal, tax_amount, shipping_amount, discount_amount, total_amount");

      if (ordersError) throw ordersError;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce(
        (sum, o) => sum + (o.total_amount || 0),
        0
      );

      // 🗂️ Đếm số collections (bảng product_collections)
      const { count: totalCollections, error: collectionsError } = await supabase
        .from("product_collections")
        .select("*", { count: "exact", head: true });
      if (collectionsError) throw collectionsError;

      // 📦 Đếm số products
      const { count: totalProducts, error: productsError } = await supabase
        .from("products")
        .select("*", { count: "exact", head: true });
      if (productsError) throw productsError;

      // 🧠 Trả JSON
      const responseBody = JSON.stringify({
        totalRevenue,
        totalOrders,
        totalCollections: totalCollections ?? 0,
        totalProducts: totalProducts ?? 0,
      });

      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(responseBody);

    } catch (error) {
      console.error("Dashboard API Error:", error);
      sendError(res, 500, "Error loading admin dashboard");
    }
  });

  // Collection routes
  router.get("/api/admin/collections", CollectionController.getAll, [Router.requireRole(['admin'])]);
  router.post("/api/admin/collections", CollectionController.create, [Router.requireRole(['admin'])]);
  router.put("/api/admin/collections/:id", CollectionController.update, [Router.requireRole(['admin'])]);
  router.delete("/api/admin/collections/:id", CollectionController.remove, [Router.requireRole(['admin'])]);
  router.post("/api/admin/collections/upload-image", CollectionController.uploadImage, [Router.requireRole(['admin'])]);

  // Register Admin Product Routes
  registerAdminProductRoutes(router);

  // Register Admin Product Variant Routes
  registerAdminProductVariantRoutes(router);

  // Register Admin Product Images Routes
  registerAdminProductImagesRoutes(router);

  // Register Admin Image Browser Routes
  registerAdminImageBrowser(router);



  return router;
} 