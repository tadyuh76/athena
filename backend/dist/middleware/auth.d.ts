import { IncomingMessage, ServerResponse } from 'http';
export interface AuthRequest extends IncomingMessage {
    userId?: string;
    user?: any;
    userRole?: 'customer' | 'admin';
}
export declare function authenticateToken(req: AuthRequest): Promise<boolean>;
export declare function requireAuth(req: AuthRequest, res: ServerResponse): Promise<boolean>;
export declare function optionalAuth(req: AuthRequest): Promise<boolean>;
export type Role = 'customer' | 'admin';
export declare function requireRole(allowedRoles: Role[]): (req: AuthRequest, res: ServerResponse) => Promise<boolean>;
//# sourceMappingURL=auth.d.ts.map