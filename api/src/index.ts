import { createServer, IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { AuthService } from './services/AuthService';
import { ProductService } from './services/ProductService';
import { WishlistService } from './services/WishlistService';
import { CartService } from './services/CartService';
import { AuthRequest, requireAuth, optionalAuth } from './middleware/auth';
import { 
  parseBody, 
  setCorsHeaders, 
  sendJSON, 
  sendError, 
  parseUrl, 
  matchRoute 
} from './utils/request-handler';

dotenv.config();

const authService = new AuthService();
const productService = new ProductService();
const wishlistService = new WishlistService();
const cartService = new CartService();

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  setCorsHeaders(res);

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const { pathname, query } = parseUrl(req);
  const method = req.method || 'GET';

  try {
    // Auth Routes
    if (pathname === '/api/auth/register' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.register(body);
      sendJSON(res, result.success ? 201 : 400, result);
      return;
    }

    if (pathname === '/api/auth/login' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.login(body);
      sendJSON(res, result.success ? 200 : 401, result);
      return;
    }

    if (pathname === '/api/auth/logout' && method === 'POST') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const result = await authService.logout();
      sendJSON(res, 200, result);
      return;
    }

    if (pathname === '/api/auth/forgot-password' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.forgotPassword(body.email);
      sendJSON(res, result.success ? 200 : 400, result);
      return;
    }

    if (pathname === '/api/auth/reset-password' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.resetPassword(body.password);
      sendJSON(res, result.success ? 200 : 400, result);
      return;
    }

    // Email verification is handled by Supabase automatically

    if (pathname === '/api/auth/verify-otp' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.verifyOTP(body.email, body.otp);
      sendJSON(res, result.success ? 200 : 400, result);
      return;
    }
    if (pathname === '/api/auth/resend-verification' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.resendVerificationEmail(body.email);
      sendJSON(res, result.success ? 200 : 400, result);
      return;
    }

    if (pathname === '/api/auth/google' && method === 'GET') {
      try {
        const { url } = await authService.googleAuth();
        res.writeHead(302, { Location: url });
        res.end();
      } catch (error) {
        sendError(res, 500, 'Google auth failed');
      }
      return;
    }

    if (pathname === '/api/auth/oauth-profile' && method === 'POST') {
      const body = await parseBody(req);
      const result = await authService.createOAuthProfile(
        body.user_id,
        body.email,
        body.metadata
      );
      sendJSON(res, result.success ? 200 : 400, result);
      return;
    }

    if (pathname === '/api/auth/me' && method === 'GET') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      sendJSON(res, 200, { user: authReq.user });
      return;
    }

    if (pathname === '/api/auth/me' && method === 'PUT') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const body = await parseBody(req);
      const result = await authService.updateUser(authReq.userId!, body);
      sendJSON(res, result.success ? 200 : 400, result);
      return;
    }

    // Product Routes
    if (pathname === '/api/products' && method === 'GET') {
      const page = parseInt(query.get('page') || '1');
      const limit = parseInt(query.get('limit') || '20');
      const filter = {
        category_id: query.get('category_id') || undefined,
        collection_id: query.get('collection_id') || undefined,
        min_price: query.get('min_price') ? parseFloat(query.get('min_price')!) : undefined,
        max_price: query.get('max_price') ? parseFloat(query.get('max_price')!) : undefined,
        in_stock: query.get('in_stock') === 'true',
        is_featured: query.get('featured') === 'true',
        search: query.get('search') || undefined,
        status: (query.get('status') || 'active') as any
      };
      const result = await productService.getProducts(filter, page, limit);
      sendJSON(res, 200, result);
      return;
    }

    const productByIdMatch = matchRoute(pathname, '/api/products/:id');
    if (productByIdMatch && method === 'GET') {
      const product = await productService.getProductById(productByIdMatch.id);
      if (!product) {
        sendError(res, 404, 'Product not found');
        return;
      }
      sendJSON(res, 200, product);
      return;
    }

    const productBySlugMatch = matchRoute(pathname, '/api/products/slug/:slug');
    if (productBySlugMatch && method === 'GET') {
      const product = await productService.getProductBySlug(productBySlugMatch.slug);
      if (!product) {
        sendError(res, 404, 'Product not found');
        return;
      }
      sendJSON(res, 200, product);
      return;
    }

    if (pathname === '/api/categories' && method === 'GET') {
      const categories = await productService.getCategories();
      sendJSON(res, 200, categories);
      return;
    }

    if (pathname === '/api/collections' && method === 'GET') {
      const collections = await productService.getCollections();
      sendJSON(res, 200, collections);
      return;
    }

    // Wishlist Routes
    if (pathname === '/api/wishlist' && method === 'GET') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const wishlist = await wishlistService.getUserWishlist(authReq.userId!);
      sendJSON(res, 200, wishlist);
      return;
    }

    if (pathname === '/api/wishlist' && method === 'POST') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const body = await parseBody(req);
      const result = await wishlistService.addToWishlist(
        authReq.userId!,
        body.product_id,
        body.variant_id,
        body.notes
      );
      sendJSON(res, 201, result);
      return;
    }

    const wishlistItemMatch = matchRoute(pathname, '/api/wishlist/:id');
    if (wishlistItemMatch && method === 'DELETE') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      await wishlistService.removeFromWishlist(authReq.userId!, wishlistItemMatch.id);
      sendJSON(res, 200, { success: true });
      return;
    }

    if (wishlistItemMatch && method === 'PUT') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const body = await parseBody(req);
      const result = await wishlistService.updateWishlistItem(
        authReq.userId!,
        wishlistItemMatch.id,
        body
      );
      sendJSON(res, 200, result);
      return;
    }

    if (pathname === '/api/wishlist/count' && method === 'GET') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const count = await wishlistService.getWishlistCount(authReq.userId!);
      sendJSON(res, 200, { count });
      return;
    }

    // Cart Routes
    if (pathname === '/api/cart' && method === 'GET') {
      const authReq = req as AuthRequest;
      await optionalAuth(authReq);
      const sessionId = query.get('session_id') || undefined;
      const cart = await cartService.getCart(authReq.userId, sessionId);
      sendJSON(res, 200, cart);
      return;
    }

    if (pathname === '/api/cart/items' && method === 'POST') {
      const authReq = req as AuthRequest;
      await optionalAuth(authReq);
      const body = await parseBody(req);
      const sessionId = body.session_id || query.get('session_id') || undefined;
      const result = await cartService.addItem(
        authReq.userId,
        sessionId,
        body.product_id,
        body.variant_id,
        body.quantity
      );
      sendJSON(res, 201, result);
      return;
    }

    if (pathname === '/api/cart/summary' && method === 'GET') {
      const authReq = req as AuthRequest;
      await optionalAuth(authReq);
      const sessionId = query.get('session_id') || undefined;
      const summary = await cartService.getCartSummary(authReq.userId, sessionId);
      sendJSON(res, 200, summary);
      return;
    }

    const cartItemMatch = matchRoute(pathname, '/api/cart/items/:id');
    if (cartItemMatch && method === 'PUT') {
      const body = await parseBody(req);
      const result = await cartService.updateItemQuantity(
        cartItemMatch.id,
        body.quantity
      );
      sendJSON(res, 200, result);
      return;
    }

    if (cartItemMatch && method === 'DELETE') {
      await cartService.removeItem(cartItemMatch.id);
      sendJSON(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/cart/clear' && method === 'POST') {
      const authReq = req as AuthRequest;
      await optionalAuth(authReq);
      const sessionId = query.get('session_id') || undefined;
      await cartService.clearCart(authReq.userId, sessionId);
      sendJSON(res, 200, { success: true });
      return;
    }

    if (pathname === '/api/cart/merge' && method === 'POST') {
      const authReq = req as AuthRequest;
      if (!await requireAuth(authReq, res)) return;
      const body = await parseBody(req);
      await cartService.mergeGuestCart(body.session_id, authReq.userId!);
      sendJSON(res, 200, { success: true });
      return;
    }

    // Health check
    if (pathname === '/api/health' && method === 'GET') {
      sendJSON(res, 200, { status: 'ok', timestamp: new Date().toISOString() });
      return;
    }

    // 404 for unmatched routes
    sendError(res, 404, 'Route not found');

  } catch (error) {
    console.error('Server error:', error);
    sendError(res, 500, 'Internal server error');
  }
});

// Release expired inventory reservations every 5 minutes
setInterval(async () => {
  try {
    await cartService.releaseExpiredReservations();
  } catch (error) {
    console.error('Failed to release expired reservations:', error);
  }
}, 5 * 60 * 1000);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`🚀 API server running at http://localhost:${PORT}`);
  console.log('Available endpoints:');
  console.log('  Auth:');
  console.log('    POST   /api/auth/register');
  console.log('    POST   /api/auth/login');
  console.log('    POST   /api/auth/logout');
  console.log('    POST   /api/auth/forgot-password');
  console.log('    POST   /api/auth/reset-password');
  console.log('    POST   /api/auth/verify-email');
  console.log('    POST   /api/auth/resend-verification');
  console.log('    GET    /api/auth/google');
  console.log('    GET    /api/auth/callback');
  console.log('    GET    /api/auth/me');
  console.log('    PUT    /api/auth/me');
  console.log('  Products:');
  console.log('    GET    /api/products');
  console.log('    GET    /api/products/:id');
  console.log('    GET    /api/products/slug/:slug');
  console.log('    GET    /api/categories');
  console.log('    GET    /api/collections');
  console.log('  Wishlist:');
  console.log('    GET    /api/wishlist');
  console.log('    POST   /api/wishlist');
  console.log('    PUT    /api/wishlist/:id');
  console.log('    DELETE /api/wishlist/:id');
  console.log('    GET    /api/wishlist/count');
  console.log('  Cart:');
  console.log('    GET    /api/cart');
  console.log('    POST   /api/cart');
  console.log('    POST   /api/cart/items');
  console.log('    PUT    /api/cart/items/:id');
  console.log('    DELETE /api/cart/items/:id');
  console.log('    POST   /api/cart/:id/clear');
  console.log('    GET    /api/cart/:id/summary');
  console.log('    POST   /api/cart/merge');
});