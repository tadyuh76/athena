import { createClient } from "@supabase/supabase-js";
import * as dotenv from "dotenv";

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const samplePosts = [
  {
    title: "Welcome to Athena",
    content:
      "This is the first post in our new blog platform. Athena is built with TypeScript, Node.js, and Supabase for a modern, scalable architecture.",
    author: "Admin",
  },
  {
    title: "Getting Started with TypeScript",
    content:
      "TypeScript adds static typing to JavaScript, making your code more robust and maintainable. Here's how to get started with TypeScript in your projects.",
    author: "John Doe",
  },
  {
    title: "Building APIs with Node.js",
    content:
      "Learn how to build RESTful APIs using Node.js without Express. We'll cover HTTP servers, routing, and middleware patterns.",
    author: "Jane Smith",
  },
  {
    title: "Database Design with Supabase",
    content:
      "Supabase is a next-generation backend platform that provides PostgreSQL database, real-time subscriptions, and authentication. In this post, we explore database modeling and API development.",
    author: "Bob Johnson",
  },
  {
    title: "Frontend Development with Bootstrap",
    content:
      "Bootstrap 5 provides a comprehensive set of CSS utilities and components for building responsive web applications quickly and efficiently.",
    author: "Alice Brown",
  },
  {
    title: "Deploying to Supabase",
    content:
      "Supabase is an open-source Firebase alternative. Learn how to deploy your PostgreSQL database and leverage its real-time features.",
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
    console.log(
      "🗑️  No existing posts to clear or clear failed:",
      deleteError.message
    );
  } else {
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
    } else {
      console.log(`✅ Created post: "${createdPost.title}"`);
    }
  }

  console.log(`🎉 Successfully seeded ${samplePosts.length} posts!`);
}

main().catch((e) => {
  console.error("❌ Seed failed:", e);
  process.exit(1);
});
