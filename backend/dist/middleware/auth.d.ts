import { IncomingMessage, ServerResponse } from 'http';
export interface AuthRequest extends IncomingMessage {
    userId?: string;
    user?: any;
}
export declare function authenticateToken(req: AuthRequest): Promise<boolean>;
export declare function requireAuth(req: AuthRequest, res: ServerResponse): Promise<boolean>;
export declare function optionalAuth(req: AuthRequest): Promise<void>;
//# sourceMappingURL=auth.d.ts.map