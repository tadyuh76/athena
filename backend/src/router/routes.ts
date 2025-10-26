import { Router } from './Router';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CartController } from '../controllers/CartController';
import { WishlistController } from '../controllers/WishlistController';
import { OrderController } from '../controllers/OrderController';
import { AdminController } from '../controllers/AdminController';
import { ReviewController } from '../controllers/ReviewController';
import { sendJSON } from '../utils/request-handler';

export function setupRoutes(): Router {
  const router = new Router();

  const authController = new AuthController();
  const productController = new ProductController();
  const cartController = new CartController();
  const wishlistController = new WishlistController();
  const orderController = new OrderController();
  const adminController = new AdminController();
  const reviewController = new ReviewController();

  // Auth routes
  router.post('/api/auth/register', (req, res) => authController.register(req, res));
  router.post('/api/auth/login', (req, res) => authController.login(req, res));
  router.post('/api/auth/logout', (req, res) => authController.logout(req, res), [Router.requireAuth]);
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
  // CUSTOMER: Tạo order
  router.post('/api/orders', (req, res) => orderController.createOrder(req, res), [Router.requireAuth]);
  // ADMIN API - CHỈ ADMIN MỚI CÓ QUYỀN TRUY CẬP
   router.get(
    '/api/admin/orders', 
    (req, res) => orderController.getAllOrders(req, res), 
    [Router.requireRole(['admin', 'staff'])] // <--- CHỈ ADMIN hoặc STAFF MỚI ĐƯỢC TRUY CẬP
  );
  router.get(
    '/api/admin/summary', // ROUTE Dashboard Summary
    (req, res) => adminController.getDashboardSummary(req, res), 
    [Router.requireRole(['admin', 'staff'])]
  );
  // Review routes
  router.get('/api/products/:productId/reviews', (req, res, params) => reviewController.getProductReviews(req, res, params.productId));
  router.get('/api/products/:productId/reviews/eligibility', (req, res, params) => reviewController.checkReviewEligibility(req, res, params.productId), [Router.requireAuth]);
  router.get('/api/reviews/user', (req, res) => reviewController.getUserReviews(req, res), [Router.requireAuth]);
  router.get('/api/reviews/:id', (req, res, params) => reviewController.getReviewById(req, res, params.id));
  router.post('/api/reviews', (req, res) => reviewController.createReview(req, res), [Router.requireAuth]);
  router.put('/api/reviews/:id', (req, res, params) => reviewController.updateReview(req, res, params.id), [Router.requireAuth]);
  router.delete('/api/reviews/:id', (req, res, params) => reviewController.deleteReview(req, res, params.id), [Router.requireAuth]);
  router.post('/api/reviews/:id/helpful', (req, res, params) => reviewController.markHelpful(req, res, params.id));

  // Health check
  router.get('/api/health', async (_req, res) => {
    sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}

