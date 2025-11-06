import { Router } from './Router';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CartController } from '../controllers/CartController';
import { WishlistController } from '../controllers/WishlistController';
import { OrderController } from '../controllers/OrderController';
import { ReviewController } from '../controllers/ReviewController';
import { StripeWebhookController } from '../controllers/StripeWebhookController';
import { sendJSON } from '../utils/request-handler';
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
  const wishlistController = new WishlistController();
  const orderController = new OrderController();
  const reviewController = new ReviewController();
  const stripeWebhookController = new StripeWebhookController();

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
  router.put('/api/cart/items/:id', (req, res, params) => cartController.updateItemQuantity(req, res, params.id));
  router.delete('/api/cart/items/:id', (req, res, params) => cartController.removeItem(req, res, params.id));
  router.get('/api/cart/summary', (req, res) => cartController.getCartSummary(req, res), [Router.optionalAuth]);
  router.post('/api/cart/clear', (req, res) => cartController.clearCart(req, res), [Router.optionalAuth]);
  router.post('/api/cart/merge', (req, res) => cartController.mergeGuestCart(req, res), [Router.requireAuth]);

  // Wishlist routes
  router.get('/api/wishlist', (req, res) => wishlistController.getUserWishlist(req, res), [Router.requireAuth]);
  router.post('/api/wishlist', (req, res) => wishlistController.addToWishlist(req, res), [Router.requireAuth]);
  router.put('/api/wishlist/:id', (req, res, params) => wishlistController.updateWishlistItem(req, res, params.id), [Router.requireAuth]);
  router.delete('/api/wishlist/:id', (req, res, params) => wishlistController.removeFromWishlist(req, res, params.id), [Router.requireAuth]);
  router.get('/api/wishlist/count', (req, res) => wishlistController.getWishlistCount(req, res), [Router.requireAuth]);

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
    [Router.requireRole(['admin', 'staff'])]
  );
  // ADMIN: Confirm order
  router.post(
    '/api/admin/orders/:id/confirm',
    (req, res, params) => orderController.confirmOrder(req, res, params.id),
    [Router.requireRole(['admin', 'staff'])]
  );
  // ADMIN: Mark as shipped
  router.post(
    '/api/admin/orders/:id/ship',
    (req, res, params) => orderController.markAsShipped(req, res, params.id),
    [Router.requireRole(['admin', 'staff'])]
  );
  // ADMIN: Mark as delivered
  router.post(
    '/api/admin/orders/:id/deliver',
    (req, res, params) => orderController.markAsDelivered(req, res, params.id),
    [Router.requireRole(['admin', 'staff'])]
  );
  // ADMIN: Cancel order
  router.post(
    '/api/admin/orders/:id/cancel',
    (req, res, params) => orderController.cancelOrder(req, res, params.id),
    [Router.requireRole(['admin', 'staff'])]
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
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Error loading admin dashboard" }));
    }
  });

  // Collection routes
  router.get("/api/admin/collections", CollectionController.getAll, [Router.requireRole(['admin', 'staff'])]);
  router.post("/api/admin/collections", CollectionController.create, [Router.requireRole(['admin', 'staff'])]);
  router.put("/api/admin/collections/:id", CollectionController.update, [Router.requireRole(['admin', 'staff'])]);
  router.delete("/api/admin/collections/:id", CollectionController.remove, [Router.requireRole(['admin', 'staff'])]);
  router.post("/api/admin/collections/upload-image", CollectionController.uploadImage, [Router.requireRole(['admin', 'staff'])]);

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