import { IncomingMessage, ServerResponse } from 'http';
import { AuthService } from '../services/AuthService';
import { sendError } from '../utils/request-handler';

export interface AuthRequest extends IncomingMessage {
  userId?: string;
  user?: any;
  userRole?: 'customer' | 'admin';
}

const authService = new AuthService();

export async function authenticateToken(req: AuthRequest): Promise<boolean> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return false;
    }

    const { valid, userId } = await authService.verifyToken(token);
    
    if (!valid || !userId) {
      return false;
    }

    const user = await authService.getUser(userId);
    if (!user) {
      return false;
    }

    req.userId = userId;
    req.user = user;
    req.userRole = user.role;
    return true;
  } catch {
    return false;
  }
}

export async function requireAuth(req: AuthRequest, res: ServerResponse): Promise<boolean> {
  const isAuthenticated = await authenticateToken(req);

  if (!isAuthenticated) {
    sendError(res, 401, 'Unauthorized');
    return false;
  }

  return true;
}

export async function optionalAuth(req: AuthRequest): Promise<boolean> {
  await authenticateToken(req);
  return true; // Always allow request to proceed, auth is optional
}


// ================= Admin Role Require ================= //
export type Role = 'customer' | 'admin';

/**
 * Middleware kiểm tra người dùng đã đăng nhập VÀ có vai trò (Role) cụ thể.
 * @param allowedRoles Array các role được phép truy cập
 */
export function requireRole(allowedRoles: Role[]) {
  return async (req: AuthRequest, res: ServerResponse): Promise<boolean> => {
    const isAuthenticated = await authenticateToken(req);

    if (!isAuthenticated) {
      sendError(res, 401, 'Unauthorized: Authentication required');
      return false;
    }

    const userRole = req.userRole;

    if (!userRole || !allowedRoles.includes(userRole)) {
      sendError(res, 403, `Forbidden: Requires role(s): ${allowedRoles.join(', ')}`);
      return false;
    }

    return true;
  };
}
