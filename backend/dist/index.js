"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const routes_1 = require("./router/routes");
const request_handler_1 = require("./utils/request-handler");
const storage_1 = require("./utils/storage");
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, "../../.env") });
const router = (0, routes_1.setupRoutes)();
const server = (0, http_1.createServer)(async (req, res) => {
    (0, request_handler_1.setCorsHeaders)(res);
    if (req.method === "OPTIONS") {
        res.writeHead(200);
        res.end();
        return;
    }
    try {
        const handled = await router.handle(req, res);
        if (!handled) {
            (0, request_handler_1.sendError)(res, 404, "Route not found");
        }
    }
    catch (error) {
        console.error("Server error:", error);
        (0, request_handler_1.sendError)(res, 500, "Internal server error");
    }
});
storage_1.StorageService.ensureBucketExists().catch((error) => {
    console.error("Failed to initialize review images bucket:", error);
});
const PORT = process.env.API_PORT || 3001;
server.listen(PORT, () => {
    console.log(`🚀 API server running at http://localhost:${PORT}`);
    console.log("Available endpoints:");
    console.log("  Auth:");
    console.log("    POST   /api/auth/register");
    console.log("    POST   /api/auth/login");
    console.log("    POST   /api/auth/logout");
    console.log("    POST   /api/auth/forgot-password");
    console.log("    POST   /api/auth/reset-password");
    console.log("    POST   /api/auth/verify-otp");
    console.log("    POST   /api/auth/resend-verification");
    console.log("    GET    /api/auth/google");
    console.log("    GET    /api/auth/me");
    console.log("    PUT    /api/auth/me");
    console.log("  Products:");
    console.log("    GET    /api/products");
    console.log("    GET    /api/products/:id");
    console.log("    GET    /api/products/slug/:slug");
    console.log("    GET    /api/categories");
    console.log("    GET    /api/collections");
    console.log("  Cart:");
    console.log("    GET    /api/cart");
    console.log("    POST   /api/cart/items");
    console.log("    PUT    /api/cart/items/:id");
    console.log("    DELETE /api/cart/items/:id");
    console.log("    POST   /api/cart/clear");
    console.log("    GET    /api/cart/summary");
    console.log("    POST   /api/cart/merge");
    console.log("  Health:");
    console.log("    GET    /api/health");
});
//# sourceMappingURL=index.js.map