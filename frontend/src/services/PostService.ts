interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

interface CreatePostData {
  title: string;
  content: string;
  author: string;
}

export class PostService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = "http://localhost:3003/api";
  }

  async getAllPosts(): Promise<Post[]> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.posts || [];
    } catch (error) {
      console.error("Error fetching posts:", error);
      throw error;
    }
  }

  async getPostById(id: string): Promise<Post> {
    try {
      const response = await fetch(`${this.baseUrl}/posts/${id}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.post;
    } catch (error) {
      console.error("Error fetching post:", error);
      throw error;
    }
  }

  async createPost(postData: CreatePostData): Promise<Post> {
    try {
      const response = await fetch(`${this.baseUrl}/posts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(postData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.post;
    } catch (error) {
      console.error("Error creating post:", error);
      throw error;
    }
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch (error) {
      console.error("Health check failed:", error);
      return false;
    }
  }
}
