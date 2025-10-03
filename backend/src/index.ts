import { createServer, IncomingMessage, ServerResponse } from 'http';
import dotenv from 'dotenv';
import { setupRoutes } from './router/routes';
import { CartService } from './services/CartService';
import { setCorsHeaders, sendError } from './utils/request-handler';

dotenv.config();

const router = setupRoutes();
const cartService = new CartService();

const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
  setCorsHeaders(res);

  // Handle OPTIONS requests
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    const handled = await router.handle(req, res);
    if (!handled) {
      sendError(res, 404, 'Route not found');
    }
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
  console.log('    POST   /api/auth/verify-otp');
  console.log('    POST   /api/auth/resend-verification');
  console.log('    GET    /api/auth/google');
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
  console.log('    POST   /api/cart/items');
  console.log('    PUT    /api/cart/items/:id');
  console.log('    DELETE /api/cart/items/:id');
  console.log('    POST   /api/cart/clear');
  console.log('    GET    /api/cart/summary');
  console.log('    POST   /api/cart/merge');
  console.log('  Health:');
  console.log('    GET    /api/health');
});