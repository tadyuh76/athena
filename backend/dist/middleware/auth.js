"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateToken = authenticateToken;
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
exports.requireRole = requireRole;
const AuthService_1 = require("../services/AuthService");
const authService = new AuthService_1.AuthService();
async function authenticateToken(req) {
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
    }
    catch {
        return false;
    }
}
async function requireAuth(req, res) {
    const isAuthenticated = await authenticateToken(req);
    if (!isAuthenticated) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized' }));
        return false;
    }
    return true;
}
async function optionalAuth(req) {
    return await authenticateToken(req);
}
function requireRole(allowedRoles) {
    return async (req, res) => {
        const isAuthenticated = await authenticateToken(req);
        if (!isAuthenticated) {
            res.writeHead(401, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Unauthorized: Authentication required' }));
            return false;
        }
        const userRole = req.userRole;
        if (!userRole || !allowedRoles.includes(userRole)) {
            res.writeHead(403, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: `Forbidden: Requires role(s): ${allowedRoles.join(', ')}` }));
            return false;
        }
        return true;
    };
}
//# sourceMappingURL=auth.js.map