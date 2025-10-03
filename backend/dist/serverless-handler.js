"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleRequest = handleRequest;
const routes_1 = require("./router/routes");
const request_handler_1 = require("./utils/request-handler");
const router = (0, routes_1.setupRoutes)();
async function handleRequest(req, res) {
    (0, request_handler_1.setCorsHeaders)(res);
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }
    try {
        const handled = await router.handle(req, res);
        if (!handled) {
            (0, request_handler_1.sendError)(res, 404, 'Route not found');
        }
    }
    catch (error) {
        console.error('Server error:', error);
        (0, request_handler_1.sendError)(res, 500, 'Internal server error');
    }
}
//# sourceMappingURL=serverless-handler.js.map