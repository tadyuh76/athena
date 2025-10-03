"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Router = void 0;
const auth_1 = require("../middleware/auth");
const request_handler_1 = require("../utils/request-handler");
class Router {
    routes = [];
    add(method, pattern, handler, middleware) {
        this.routes.push({ method, pattern, handler, middleware });
    }
    get(pattern, handler, middleware) {
        this.add('GET', pattern, handler, middleware);
    }
    post(pattern, handler, middleware) {
        this.add('POST', pattern, handler, middleware);
    }
    put(pattern, handler, middleware) {
        this.add('PUT', pattern, handler, middleware);
    }
    delete(pattern, handler, middleware) {
        this.add('DELETE', pattern, handler, middleware);
    }
    async handle(req, res) {
        const { pathname } = (0, request_handler_1.parseUrl)(req);
        const method = req.method || 'GET';
        for (const route of this.routes) {
            if (route.method !== method)
                continue;
            const params = (0, request_handler_1.matchRoute)(pathname, route.pattern);
            if (params) {
                try {
                    if (route.middleware && route.middleware.length > 0) {
                        const authReq = req;
                        for (const mw of route.middleware) {
                            const result = await mw(authReq, res);
                            if (!result)
                                return true;
                        }
                        await route.handler(authReq, res, params);
                    }
                    else {
                        await route.handler(req, res, params);
                    }
                }
                catch (error) {
                    console.error(`Error handling route ${route.pattern}:`, error);
                    (0, request_handler_1.sendError)(res, 500, 'Internal server error');
                }
                return true;
            }
        }
        return false;
    }
    static requireAuth = auth_1.requireAuth;
    static optionalAuth = auth_1.optionalAuth;
}
exports.Router = Router;
//# sourceMappingURL=Router.js.map