import { IncomingMessage, ServerResponse } from 'http';
import { AuthRequest, requireAuth, optionalAuth } from '../middleware/auth';
export type RouteHandler = (req: IncomingMessage | AuthRequest, res: ServerResponse, params?: any) => Promise<void>;
export interface Route {
    method: string;
    pattern: string;
    handler: RouteHandler;
    middleware?: ((req: AuthRequest, res: ServerResponse) => Promise<boolean>)[];
}
export declare class Router {
    private routes;
    add(method: string, pattern: string, handler: RouteHandler, middleware?: any[]): void;
    get(pattern: string, handler: RouteHandler, middleware?: any[]): void;
    post(pattern: string, handler: RouteHandler, middleware?: any[]): void;
    put(pattern: string, handler: RouteHandler, middleware?: any[]): void;
    delete(pattern: string, handler: RouteHandler, middleware?: any[]): void;
    handle(req: IncomingMessage, res: ServerResponse): Promise<boolean>;
    static requireAuth: typeof requireAuth;
    static optionalAuth: typeof optionalAuth;
}
//# sourceMappingURL=Router.d.ts.map