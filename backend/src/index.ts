import { createServer, IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const PORT = process.env.PORT || 3003;

// CORS headers
const setCorsHeaders = (res: ServerResponse) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
};

// JSON response helper
const sendJSON = (res: ServerResponse, statusCode: number, data: any) => {
  setCorsHeaders(res);
  res.writeHead(statusCode, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data));
};

// Request body parser
const parseBody = (req: IncomingMessage): Promise<any> => {
  return new Promise((resolve) => {
    let body = "";
    req.on("data", (chunk) => {
      body += chunk.toString();
    });
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (error) {
        resolve({});
      }
    });
  });
};

const server = createServer(
  async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || "", `http://localhost:${PORT}`);
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
        const formattedPosts =
          posts?.map((post) => ({
            id: post.id,
            title: post.title,
            content: post.content,
            author: post.author,
            createdAt: post.created_at,
            updatedAt: post.updated_at,
          })) || [];

        sendJSON(res, 200, { posts: formattedPosts });
      } else if (pathname === "/api/posts" && method === "POST") {
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
      } else if (pathname.startsWith("/api/posts/") && method === "GET") {
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
          } else {
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
      } else if (pathname === "/api/health" && method === "GET") {
        // Health check endpoint
        sendJSON(res, 200, {
          status: "OK",
          timestamp: new Date().toISOString(),
        });
      } else {
        // 404 Not Found
        sendJSON(res, 404, { error: "Not Found" });
      }
    } catch (error) {
      console.error("Server error:", error);
      sendJSON(res, 500, { error: "Internal Server Error" });
    }
  }
);

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
