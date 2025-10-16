import { IncomingMessage, ServerResponse } from 'http';
import { AuthService } from '../services/AuthService';

export interface AuthRequest extends IncomingMessage {
  userId?: string;
  user?: any;
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
  await authenticateToken(req);
  return true;
}