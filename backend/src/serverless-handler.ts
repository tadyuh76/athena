import type { IncomingMessage, ServerResponse } from 'http';
import { setupRoutes } from './router/routes';
import { setCorsHeaders, sendError } from './utils/request-handler';

const router = setupRoutes();

export async function handleRequest(req: IncomingMessage, res: ServerResponse) {
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
}