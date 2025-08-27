interface Post {
  id: string;
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
}

export class PostRenderer {
  private postsContainer: HTMLElement;

  constructor() {
    this.postsContainer =
      document.getElementById("posts-container") || document.body;
  }

  renderPosts(posts: Post[]): void {
    if (posts.length === 0) {
      this.renderEmptyState();
      return;
    }

    const postsHtml = posts.map((post) => this.renderPost(post)).join("");
    this.postsContainer.innerHTML = postsHtml;
  }

  private renderPost(post: Post): string {
    const createdDate = new Date(post.createdAt).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `
      <div class="card mb-4 shadow-sm post-card" data-post-id="${post.id}">
        <div class="card-body">
          <h5 class="card-title text-primary">${this.escapeHtml(
            post.title
          )}</h5>
          <p class="card-text">${this.escapeHtml(post.content)}</p>
          <div class="d-flex justify-content-between align-items-center">
            <small class="text-muted">
              <i class="bi bi-person-fill"></i> By ${this.escapeHtml(
                post.author
              )}
            </small>
            <small class="text-muted">
              <i class="bi bi-clock-fill"></i> ${createdDate}
            </small>
          </div>
        </div>
      </div>
    `;
  }

  private renderEmptyState(): void {
    this.postsContainer.innerHTML = `
      <div class="text-center py-5">
        <div class="mb-4">
          <i class="bi bi-file-earmark-text display-1 text-muted"></i>
        </div>
        <h3 class="text-muted">No posts yet</h3>
        <p class="text-muted">Be the first to create a post!</p>
      </div>
    `;
  }

  private escapeHtml(text: string): string {
    const map: { [key: string]: string } = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }
}
