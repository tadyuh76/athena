"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const http_1 = require("http");
const url_1 = require("url");
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const PORT = process.env.PORT || 3003;
// CORS headers
const setCorsHeaders = (res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};
// JSON response helper
const sendJSON = (res, statusCode, data) => {
    setCorsHeaders(res);
    res.writeHead(statusCode, { "Content-Type": "application/json" });
    res.end(JSON.stringify(data));
};
// Request body parser
const parseBody = (req) => {
    return new Promise((resolve) => {
        let body = "";
        req.on("data", (chunk) => {
            body += chunk.toString();
        });
        req.on("end", () => {
            try {
                resolve(body ? JSON.parse(body) : {});
            }
            catch (error) {
                resolve({});
            }
        });
    });
};
const server = (0, http_1.createServer)(async (req, res) => {
    const url = new url_1.URL(req.url || "", `http://localhost:${PORT}`);
    const pathname = url.pathname;
    const method = req.method;
    console.log(`${method} ${pathname}`);
    // Handle CORS preflight requests
    if (method === "OPTIONS") {
        setCorsHeaders(res);
        res.writeHead(200);
        res.end();
        return;
    }
    try {
        // Routes
        if (pathname === "/api/posts" && method === "GET") {
            // Get all posts
            const { data: posts, error } = await supabase
                .from("posts")
                .select("*")
                .order("created_at", { ascending: false });
            if (error) {
                console.error("Supabase error:", error);
                sendJSON(res, 500, { error: "Failed to fetch posts" });
                return;
            }
            // Convert to expected format
            const formattedPosts = posts?.map((post) => ({
                id: post.id,
                title: post.title,
                content: post.content,
                author: post.author,
                createdAt: post.created_at,
                updatedAt: post.updated_at,
            })) || [];
            sendJSON(res, 200, { posts: formattedPosts });
        }
        else if (pathname === "/api/posts" && method === "POST") {
            // Create a new post
            const body = await parseBody(req);
            const { title, content, author } = body;
            if (!title || !content || !author) {
                sendJSON(res, 400, {
                    error: "Title, content, and author are required",
                });
                return;
            }
            const { data: post, error } = await supabase
                .from("posts")
                .insert({
                title,
                content,
                author,
            })
                .select()
                .single();
            if (error) {
                console.error("Supabase error:", error);
                sendJSON(res, 500, { error: "Failed to create post" });
                return;
            }
            // Convert to expected format
            const formattedPost = {
                id: post.id,
                title: post.title,
                content: post.content,
                author: post.author,
                createdAt: post.created_at,
                updatedAt: post.updated_at,
            };
            sendJSON(res, 201, { post: formattedPost });
        }
        else if (pathname.startsWith("/api/posts/") && method === "GET") {
            // Get a specific post by ID
            const id = pathname.split("/").pop();
            if (!id) {
                sendJSON(res, 400, { error: "Post ID is required" });
                return;
            }
            const { data: post, error } = await supabase
                .from("posts")
                .select("*")
                .eq("id", id)
                .single();
            if (error) {
                if (error.code === "PGRST116") {
                    sendJSON(res, 404, { error: "Post not found" });
                }
                else {
                    console.error("Supabase error:", error);
                    sendJSON(res, 500, { error: "Failed to fetch post" });
                }
                return;
            }
            // Convert to expected format
            const formattedPost = {
                id: post.id,
                title: post.title,
                content: post.content,
                author: post.author,
                createdAt: post.created_at,
                updatedAt: post.updated_at,
            };
            sendJSON(res, 200, { post: formattedPost });
        }
        else if (pathname === "/api/health" && method === "GET") {
            // Health check endpoint
            sendJSON(res, 200, {
                status: "OK",
                timestamp: new Date().toISOString(),
            });
        }
        else {
            // 404 Not Found
            sendJSON(res, 404, { error: "Not Found" });
        }
    }
    catch (error) {
        console.error("Server error:", error);
        sendJSON(res, 500, { error: "Internal Server Error" });
    }
});
server.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 API endpoints:`);
    console.log(`  GET    /api/posts       - Get all posts`);
    console.log(`  POST   /api/posts       - Create a new post`);
    console.log(`  GET    /api/posts/:id   - Get a specific post`);
    console.log(`  GET    /api/health      - Health check`);
});
// Graceful shutdown
process.on("SIGINT", async () => {
    console.log("\n🛑 Shutting down gracefully...");
    server.close(() => {
        console.log("✅ Server closed");
        process.exit(0);
    });
});
//# sourceMappingURL=index.js.map