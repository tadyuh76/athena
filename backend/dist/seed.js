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
const supabase_js_1 = require("@supabase/supabase-js");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey);
const samplePosts = [
    {
        title: "Welcome to Athena",
        content: "This is the first post in our new blog platform. Athena is built with TypeScript, Node.js, and Supabase for a modern, scalable architecture.",
        author: "Admin",
    },
    {
        title: "Getting Started with TypeScript",
        content: "TypeScript adds static typing to JavaScript, making your code more robust and maintainable. Here's how to get started with TypeScript in your projects.",
        author: "John Doe",
    },
    {
        title: "Building APIs with Node.js",
        content: "Learn how to build RESTful APIs using Node.js without Express. We'll cover HTTP servers, routing, and middleware patterns.",
        author: "Jane Smith",
    },
    {
        title: "Database Design with Supabase",
        content: "Supabase is a next-generation backend platform that provides PostgreSQL database, real-time subscriptions, and authentication. In this post, we explore database modeling and API development.",
        author: "Bob Johnson",
    },
    {
        title: "Frontend Development with Bootstrap",
        content: "Bootstrap 5 provides a comprehensive set of CSS utilities and components for building responsive web applications quickly and efficiently.",
        author: "Alice Brown",
    },
    {
        title: "Deploying to Supabase",
        content: "Supabase is an open-source Firebase alternative. Learn how to deploy your PostgreSQL database and leverage its real-time features.",
        author: "Charlie Wilson",
    },
];
async function main() {
    console.log("🌱 Starting database seed...");
    // Clear existing posts
    const { error: deleteError } = await supabase
        .from("posts")
        .delete()
        .neq("id", "00000000-0000-0000-0000-000000000000"); // Delete all posts
    if (deleteError) {
        console.log("🗑️  No existing posts to clear or clear failed:", deleteError.message);
    }
    else {
        console.log("🗑️  Cleared existing posts");
    }
    // Insert sample posts
    for (const post of samplePosts) {
        const { data: createdPost, error } = await supabase
            .from("posts")
            .insert(post)
            .select()
            .single();
        if (error) {
            console.error(`❌ Failed to create post: "${post.title}"`, error);
        }
        else {
            console.log(`✅ Created post: "${createdPost.title}"`);
        }
    }
    console.log(`🎉 Successfully seeded ${samplePosts.length} posts!`);
}
main().catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
});
//# sourceMappingURL=seed.js.map