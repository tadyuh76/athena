import { Router } from './Router';
import { AuthController } from '../controllers/AuthController';
import { ProductController } from '../controllers/ProductController';
import { CartController } from '../controllers/CartController';
import { WishlistController } from '../controllers/WishlistController';
import { sendJSON } from '../utils/request-handler';

export function setupRoutes(): Router {
  const router = new Router();
  
  const authController = new AuthController();
  const productController = new ProductController();
  const cartController = new CartController();
  const wishlistController = new WishlistController();

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

  // Health check
  router.get('/api/health', async (_req, res) => {
    sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
  });

  return router;
}