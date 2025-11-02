import { IncomingMessage, ServerResponse } from 'http';
import { AuthService } from '../services/AuthService';

export interface AuthRequest extends IncomingMessage {
  userId?: string;
  user?: any;
  userRole?: 'customer' | 'admin' | 'staff';
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
    res.writeHead(401, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Unauthorized' }));
    return false;
  }
  
  return true;
}

export async function optionalAuth(req: AuthRequest): Promise<boolean> {
  return await authenticateToken(req);
}


// ================= Admin Role Require ================= //
export type Role = 'customer' | 'admin' | 'staff';

/**
 * Middleware kiểm tra người dùng đã đăng nhập VÀ có vai trò (Role) cụ thể.
 * @param allowedRoles Array các role được phép truy cập
 */
export function requireRole(allowedRoles: Role[]) {
  return async (req: AuthRequest, res: ServerResponse): Promise<boolean> => {
    const isAuthenticated = await authenticateToken(req);

    if (!isAuthenticated) {
      // 401 Unauthorized nếu không đăng nhập
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Unauthorized: Authentication required' }));
      return false;
    }

    const userRole = req.userRole;
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // 403 Forbidden nếu không có quyền
      res.writeHead(403, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: `Forbidden: Requires role(s): ${allowedRoles.join(', ')}` }));
      return false;
    }

    return true;
  };
}
