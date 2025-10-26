import { IncomingMessage, ServerResponse } from 'http';
import { AuthRequest, requireAuth, optionalAuth , requireRole } from '../middleware/auth';
import { parseUrl, matchRoute, sendError } from '../utils/request-handler';

export type RouteHandler = (req: IncomingMessage | AuthRequest, res: ServerResponse, params?: any) => Promise<void>;

export interface Route {
  method: string;
  pattern: string;
  handler: RouteHandler;
  middleware?: ((req: AuthRequest, res: ServerResponse) => Promise<boolean>)[];
}

export class Router {
  private routes: Route[] = [];

  add(method: string, pattern: string, handler: RouteHandler, middleware?: any[]) {
    this.routes.push({ method, pattern, handler, middleware });
  }

  get(pattern: string, handler: RouteHandler, middleware?: any[]) {
    this.add('GET', pattern, handler, middleware);
  }

  post(pattern: string, handler: RouteHandler, middleware?: any[]) {
    this.add('POST', pattern, handler, middleware);
  }

  put(pattern: string, handler: RouteHandler, middleware?: any[]) {
    this.add('PUT', pattern, handler, middleware);
  }

  delete(pattern: string, handler: RouteHandler, middleware?: any[]) {
    this.add('DELETE', pattern, handler, middleware);
  }

  async handle(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
    const { pathname } = parseUrl(req);
    const method = req.method || 'GET';

    for (const route of this.routes) {
      if (route.method !== method) continue;
      
      const params = matchRoute(pathname, route.pattern);
      if (params) {
        try {
          if (route.middleware && route.middleware.length > 0) {
            const authReq = req as AuthRequest;
            for (const mw of route.middleware) {
              const result = await mw(authReq, res);
              if (!result) return true;
            }
            await route.handler(authReq, res, params);
          } else {
            await route.handler(req, res, params);
          }
        } catch (error) {
          console.error(`Error handling route ${route.pattern}:`, error);
          sendError(res, 500, 'Internal server error');
        }
        return true;
      }
    }
    
    return false;
  }

  static requireAuth = requireAuth;
  static optionalAuth = optionalAuth;
  static requireRole = requireRole;
}