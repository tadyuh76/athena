// Navbar component with authentication state
class NavbarManager {
  constructor() {
    this.user = null;
    this.authToken = localStorage.getItem("authToken");
    this.init();
  }

  async init() {
    // Load user from localStorage first for immediate display
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
        this.user = JSON.parse(storedUser);
        this.updateNavbar();
      } catch (e) {
        console.error("Failed to parse stored user:", e);
      }
    }

    // Verify token and get fresh user data if authenticated
    if (this.authToken) {
      await this.fetchUserData();
    } else {
      this.updateNavbar();
    }
  }

  async fetchUserData() {
    try {
      const response = await fetch("/api/auth/me", {
        headers: {
          Authorization: `Bearer ${this.authToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        localStorage.setItem("user", JSON.stringify(this.user));
        this.updateNavbar();
      } else if (response.status === 401) {
        // Token expired or invalid
        this.logout();
      }
    } catch (error) {
      console.error("Failed to fetch user data:", error);
    }
  }

  updateNavbar() {
    const authSection = document.querySelector(".navbar-auth-section");

    if (!authSection) {
      // Create auth section if it doesn't exist
      const navbar =
        document.querySelector(".navbar .container") ||
        document.querySelector(".navbar");
      if (navbar) {
        const authDiv = document.createElement("div");
        authDiv.className = "navbar-auth-section ms-auto";
        navbar.appendChild(authDiv);
        this.renderAuthSection(authDiv);
      }
    } else {
      this.renderAuthSection(authSection);
    }

    // Show/hide cart based on authentication
    const cartNav = document.querySelector(
      'a[href="/cart.html"]'
    )?.parentElement;
    if (cartNav) {
      cartNav.style.display = this.user ? "" : "none";
    }
  }

  renderAuthSection(container) {
    if (this.user) {
      // User is logged in - show profile dropdown
      const avatarUrl =
        this.user.avatar_url ||
        this.user.metadata?.avatar_url ||
        "/images/placeholder-user.jpg";
      const displayName =
        this.user.first_name || this.user.email?.split("@")[0] || "User";

      container.innerHTML = `
        <div class="dropdown">
          <button class="btn btn-link nav-link dropdown-toggle d-flex align-items-center" 
                  type="button" 
                  id="userDropdown" 
                  data-bs-toggle="dropdown" 
                  aria-expanded="false"
                  style="text-decoration: none;">
            <img src="${avatarUrl}" 
                 alt="${displayName}" 
                 class="rounded-circle me-2" 
                 style="width: 32px; height: 32px; object-fit: cover;">
            <span class="d-none d-md-inline">${displayName}</span>
          </button>
          <ul class="dropdown-menu dropdown-menu-end" aria-labelledby="userDropdown">
            <li><h6 class="dropdown-header">${this.user.email}</h6></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="/account.html">
              <i class="bi bi-person me-2"></i>My Account
            </a></li>
            <li><a class="dropdown-item" href="/orders.html">
              <i class="bi bi-bag me-2"></i>My Orders
            </a></li>
            <li><hr class="dropdown-divider"></li>
            <li><button class="dropdown-item" onclick="navbar.logout()">
              <i class="bi bi-box-arrow-right me-2"></i>Logout
            </button></li>
          </ul>
        </div>
      `;
    } else {
      // User is not logged in - show sign in/up buttons
      container.innerHTML = `
        <div class="d-flex align-items-center">
          <a href="/login.html" class="btn btn-link nav-link">Sign In</a>
          <a href="/register.html" class="btn btn-dark ms-2">Sign Up</a>
        </div>
      `;
    }
  }

  async logout() {
    try {
      // Call logout API
      if (this.authToken) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${this.authToken}`,
          },
        });
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local storage
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
      localStorage.removeItem("sessionId");

      // Redirect to home
      window.location.href = "/";
    }
  }

  isAuthenticated() {
    return !!this.user && !!this.authToken;
  }

  requireAuth(redirectUrl = "/login.html") {
    if (!this.isAuthenticated()) {
      const currentPath = window.location.pathname;
      window.location.href = `${redirectUrl}?redirect=${encodeURIComponent(
        currentPath
      )}`;
      return false;
    }
    return true;
  }
}

// Initialize navbar on page load
const navbar = new NavbarManager();

// Export for use in other modules
window.NavbarManager = NavbarManager;
window.navbar = navbar;
