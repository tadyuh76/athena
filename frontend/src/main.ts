import "bootstrap/dist/css/bootstrap.min.css";
import "./style.css";
import { PostService } from "./services/PostService";
import { PostRenderer } from "./components/PostRenderer";

class App {
  private postService: PostService;
  private postRenderer: PostRenderer;

  constructor() {
    this.postService = new PostService();
    this.postRenderer = new PostRenderer();
    this.init();
  }

  private async init(): Promise<void> {
    console.log("🚀 Athena App starting...");
    await this.loadPosts();
    this.setupEventListeners();
  }

  private async loadPosts(): Promise<void> {
    try {
      const posts = await this.postService.getAllPosts();
      this.postRenderer.renderPosts(posts);
    } catch (error) {
      console.error("Failed to load posts:", error);
      this.showError("Failed to load posts. Please try again later.");
    }
  }

  private setupEventListeners(): void {
    // Refresh button
    const refreshBtn = document.getElementById("refresh-btn");
    if (refreshBtn) {
      refreshBtn.addEventListener("click", () => this.loadPosts());
    }

    // Create post form
    const createForm = document.getElementById(
      "create-post-form"
    ) as HTMLFormElement;
    if (createForm) {
      createForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        await this.handleCreatePost(createForm);
      });
    }
  }

  private async handleCreatePost(form: HTMLFormElement): Promise<void> {
    const formData = new FormData(form);
    const postData = {
      title: formData.get("title") as string,
      content: formData.get("content") as string,
      author: formData.get("author") as string,
    };

    if (!postData.title || !postData.content || !postData.author) {
      this.showError("Please fill in all fields");
      return;
    }

    try {
      await this.postService.createPost(postData);
      form.reset();
      await this.loadPosts();
      this.showSuccess("Post created successfully!");
    } catch (error) {
      console.error("Failed to create post:", error);
      this.showError("Failed to create post. Please try again.");
    }
  }

  private showError(message: string): void {
    this.showAlert(message, "danger");
  }

  private showSuccess(message: string): void {
    this.showAlert(message, "success");
  }

  private showAlert(message: string, type: "success" | "danger"): void {
    const alertContainer = document.getElementById("alert-container");
    if (!alertContainer) return;

    const alert = document.createElement("div");
    alert.className = `alert alert-${type} alert-dismissible fade show`;
    alert.innerHTML = `
      ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    alertContainer.appendChild(alert);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (alert.parentNode) {
        alert.parentNode.removeChild(alert);
      }
    }, 5000);
  }
}

// Initialize the app when DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  new App();
});
