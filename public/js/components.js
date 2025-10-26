// Site Header Component
class SiteHeader extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    z-index: 1000;
                    font-family: 'Inter', sans-serif;
                }

                .athena-header {
                    background: rgba(255, 255, 255, 0.9);
                    backdrop-filter: blur(10px);
                    -webkit-backdrop-filter: blur(10px);
                    border-bottom: 1px solid #e5e5e5;
                    height: 80px;
                }
                .switch-btn { /* Style cho nút chuyển đổi giao diện */
                background: #0f4c2f; /* success-green */
                color: white !important;
                padding: 5px 10px;
                border-radius: 4px;
                font-size: 0.75rem;
                font-weight: 500;
                text-decoration: none;
                transition: background 0.3s ease;
                }

                .switch-btn:hover {
                background: #1a1a1a; /* primary-dark */
                color: white !important;
                }    

                .container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 20px;
                    height: 100%;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }

                .navbar-brand {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.75rem;
                    font-weight: 300;
                    letter-spacing: -0.02em;
                    color: #1a1a1a;
                    text-decoration: none;
                    
                    /* Cấu hình FLEXBOX MỚI */
                    display: inline-flex;
                    flex-direction: column;
                    line-height: 1;
                }

                /* CSS cho nhãn Admin/Staff */
                .admin-label { 
                    display: block;
                    font-family: 'Inter', sans-serif;
                    font-size: 0.65rem;
                    font-weight: 500;
                    letter-spacing: 0.2em;
                    color: #0f4c2f; /* success-green */
                    line-height: 1;
                    margin-top: 3px; 
                    text-transform: uppercase;
                }
                
                nav {
                    display: flex;
                    gap: 3rem;
                }

                nav a {
                    font-size: 0.875rem;
                    font-weight: 400;
                    letter-spacing: 0.05em;
                    color: #1a1a1a;
                    text-decoration: none;
                    transition: color 0.3s ease;
                }

                nav a:hover {
                    color: #666;
                }

                .nav-icons {
                    display: flex;
                    gap: 1.5rem;
                    align-items: center;
                }

                .nav-icons a {
                    color: #1a1a1a;
                    transition: color 0.3s ease;
                    display: flex;
                    align-items: center;
                }

                .nav-icons a:hover {
                    color: #666;
                }

                .mobile-toggle {
                    display: none;
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 0;
                    width: 24px;
                    height: 24px;
                    position: relative;
                }

                .mobile-toggle span {
                    display: block;
                    width: 24px;
                    height: 2px;
                    background: #1a1a1a;
                    margin: 5px 0;
                    transition: 0.3s;
                }

                @media (max-width: 768px) {
                    .mobile-toggle {
                        display: block;
                    }

                    nav {
                        display: none;
                        position: absolute;
                        top: 80px;
                        left: 0;
                        right: 0;
                        background: white;
                        flex-direction: column;
                        padding: 2rem;
                        box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                    }

                    nav.active {
                        display: flex;
                    }

                    .nav-icons {
                        gap: 1rem;
                    }
                }
            </style>

            <header class="athena-header">
                <div class="container">
                    <a class="navbar-brand navbar-brand-wrapper" href="/" id="athena-brand">
                        </a>
                    
                    <nav id="main-nav">
                        <a href="/products.html">Shop</a>
                        <a href="/collections.html">Collections</a>
                        <a href="/craft.html">Our Craft</a>
                        <a href="/sustainability.html">Sustainability</a>
                    </nav>

                    <div class="nav-icons">
                        <div id="switch-container">
                            </div> 
                        
                        <a href="/cart" id="cart-link">
                        </a>
                        <a href="#" id="auth-link">
                        </a>
                    </div>

                    <button class="mobile-toggle" id="mobile-toggle">
                        <span></span>
                        <span></span>
                        <span></span>
                    </button>
                </div>
            </header>
        `;

    this.updateNavbarBrand = function() {
        const brandLink = this.shadowRoot.getElementById('athena-brand');
        // Lấy thông tin người dùng từ Local Storage
        const user = JSON.parse(localStorage.getItem('user') || 'null');
        const role = user?.role; // 'admin', 'staff', hoặc 'customer'
        
        // HTML mặc định cho tên ATHENA (dùng style inline để giữ nguyên font)
        const athenaNameHTML = `<span style="font-family: 'Cormorant Garamond', serif; font-size: 1.75rem; font-weight: 300; letter-spacing: -0.02em; color: #1a1a1a;">ATHENA</span>`;
        
        if (brandLink) {
            if (role && (role === 'admin' || role === 'staff')) {
                const roleText = (role === 'admin' ? 'ADMIN' : 'STAFF');
                
                // Hiển thị 2 dòng
                brandLink.innerHTML = `
                    ${athenaNameHTML}
                    <small class="admin-label">${roleText}</small>
                `;
            } else {
                // Chỉ hiển thị 1 dòng
                brandLink.innerHTML = athenaNameHTML;
            }
        }
    }

    // 1. Chạy hàm cập nhật Brand ngay lập tức khi component được tải
    this.updateNavbarBrand(); 
    
    // 2. Lắng nghe sự kiện thay đổi Local Storage (khi đăng nhập/đăng xuất)
    window.addEventListener("storage", (e) => {
        if (e.key === "user" || e.key === "authToken") {
            this.updateNavbarBrand();
            this.updateAuthIcon(); // Gọi cả cập nhật icon
        }
    });

    // Add event listeners
    this.shadowRoot
      .getElementById("mobile-toggle")
      ?.addEventListener("click", () => {
        const nav = this.shadowRoot.getElementById("main-nav");
        nav?.classList.toggle("active");
      });

    // Auth link handler
    const authLink = this.shadowRoot.getElementById("auth-link");
    if (authLink) {
      authLink.addEventListener("click", (e) => {
        e.preventDefault();
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user) {
          window.location.href = "/account.html";
        } else {
          window.location.href = "/login.html";
        }
      });

      // Update auth icon based on login status
      const updateAuthIcon = () => {
        const user = JSON.parse(localStorage.getItem("user") || "null");
        if (user) {
          // Check if user has profile image - check multiple possible locations
          const avatarUrl =
            user.metadata?.avatar_url ||
            user.metadata?.picture ||
            user.profile_image_url;

          if (avatarUrl) {
            authLink.innerHTML = `
                            <img src="${avatarUrl}" alt="Profile" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;">
                        `;
          } else {
            // Use initials as fallback
            const firstName = user.first_name || "";
            const lastName = user.last_name || "";
            let initials = "";

            if (firstName && lastName) {
              initials = (firstName[0] + lastName[0]).toUpperCase();
            } else if (firstName) {
              initials = firstName[0].toUpperCase();
            } else if (user.name) {
              initials = user.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase();
            } else if (user.email) {
              initials = user.email[0].toUpperCase();
            } else {
              initials = "U";
            }

            authLink.innerHTML = `
                            <div style="width: 22px; height: 22px; border-radius: 50%; background: #1a1a1a; color: white; display: flex; align-items: center; justify-content: center; font-size: 10px; font-weight: 500;">
                                ${initials}
                            </div>
                        `;
          }
        }
      };
      updateAuthIcon();

      // Thêm hàm mới: Update nút chuyển đổi
        const updateSwitchButton = () => {
            const user = JSON.parse(localStorage.getItem("user") || "null");
            const role = user?.role;
            const switchContainer = this.shadowRoot.getElementById('switch-container');
            const isCurrentlyAdmin = window.location.pathname.includes('/admin.html');

            if (switchContainer) {
                switchContainer.innerHTML = ''; // Xóa nội dung cũ
            }
            
            // Chỉ hiển thị nút nếu user là Admin/Staff
            if (role === 'admin' || role === 'staff') {
                const targetUrl = isCurrentlyAdmin ? '/' : '/admin.html';
                const buttonText = isCurrentlyAdmin ? 'Đổi sang giao diện Khách hàng' : 'Đổi sang giao diện Admin';

                if (switchContainer) {
                    // Chèn nút chuyển đổi
                    switchContainer.innerHTML = `
                        <a href="${targetUrl}" class="switch-btn">
                            <i class="bi bi-arrow-repeat"></i> ${buttonText}
                        </a>
                    `;
                }
            }
        };
        updateSwitchButton();

      // Listen for user data updates
      window.addEventListener("storage", (e) => {
        if (e.key === "user" || e.key === "authToken") {
          updateAuthIcon();
          this.updateAuthIcon();
          updateSwitchButton();
        }
      });

      if (window.location.pathname.includes('/admin.html')) {
        updateSwitchButton();
        }

      // Add method to manually refresh auth icon
      this.updateAuthIcon = updateAuthIcon;
    }

    // Update cart count if available
    const updateCartCount = () => {
      const cartLink = this.shadowRoot.getElementById("cart-link");
      if (cartLink) {
        const cartItems = JSON.parse(localStorage.getItem("cart") || "[]");
        const count = cartItems.reduce(
          (sum, item) => sum + (item.quantity || 1),
          0
        );

        if (count > 0) {
          // Add badge to cart icon
          const existingBadge = cartLink.querySelector(".cart-badge");
          if (existingBadge) {
            existingBadge.textContent = count;
          } else {
            const badge = document.createElement("span");
            badge.className = "cart-badge";
            badge.style.cssText =
              "position: absolute; top: -5px; right: -5px; background: #dc2626; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center;";
            badge.textContent = count;
            cartLink.style.position = "relative";
            cartLink.appendChild(badge);
          }
        }
      }
    };
    updateCartCount();
  }
}

// Site Footer Component
class SiteFooter extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  connectedCallback() {
    this.shadowRoot.innerHTML = `
            <style>
                :host {
                    display: block;
                    font-family: 'Inter', sans-serif;
                }

                footer {
                    background: white;
                    border-top: 1px solid #f0f0f0;
                    padding: 4rem 0 2rem;
                    margin-top: 5rem;
                }

                .container {
                    max-width: 1280px;
                    margin: 0 auto;
                    padding: 0 20px;
                }

                .footer-grid {
                    display: grid;
                    grid-template-columns: repeat(4, 1fr);
                    gap: 3rem;
                    margin-bottom: 3rem;
                }

                .footer-brand {
                    font-family: 'Cormorant Garamond', serif;
                    font-size: 1.5rem;
                    font-weight: 300;
                    letter-spacing: -0.02em;
                    color: #1a1a1a;
                    margin-bottom: 1rem;
                }

                .footer-tagline {
                    font-size: 0.875rem;
                    color: #666;
                    line-height: 1.8;
                }

                .footer-section h6 {
                    font-size: 0.875rem;
                    font-weight: 500;
                    letter-spacing: 0.05em;
                    color: #1a1a1a;
                    margin-bottom: 1.25rem;
                }

                .footer-section ul {
                    list-style: none;
                    padding: 0;
                    margin: 0;
                }

                .footer-section li {
                    margin-bottom: 0.75rem;
                }

                .footer-section a {
                    font-size: 0.875rem;
                    color: #666;
                    text-decoration: none;
                    transition: color 0.3s ease;
                }

                .footer-section a:hover {
                    color: #1a1a1a;
                }

                .footer-bottom {
                    border-top: 1px solid #f0f0f0;
                    padding-top: 2rem;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    flex-wrap: wrap;
                    gap: 1rem;
                }

                .footer-copyright {
                    font-size: 0.875rem;
                    color: #666;
                    margin: 0;
                }

                .footer-links {
                    display: flex;
                    gap: 2rem;
                }

                .footer-links a {
                    font-size: 0.875rem;
                    color: #666;
                    text-decoration: none;
                    transition: color 0.3s ease;
                }

                .footer-links a:hover {
                    color: #1a1a1a;
                }

                @media (max-width: 992px) {
                    .footer-grid {
                        grid-template-columns: repeat(2, 1fr);
                    }
                }

                @media (max-width: 576px) {
                    .footer-grid {
                        grid-template-columns: 1fr;
                        gap: 2rem;
                    }

                    .footer-bottom {
                        flex-direction: column;
                        text-align: center;
                    }
                }
            </style>

            <footer>
                <div class="container">
                    <div class="footer-grid">
                        <div>
                            <h5 class="footer-brand">ATHENA</h5>
                            <p class="footer-tagline">Premium eco fashion for modern minimalists. Designed to endure.</p>
                        </div>
                        <div class="footer-section">
                            <h6>Shop</h6>
                            <ul>
                                <li><a href="/products.html">All Products</a></li>
                                <li><a href="/collections.html">Collections</a></li>
                                <li><a href="/new.html">New Arrivals</a></li>
                            </ul>
                        </div>
                        <div class="footer-section">
                            <h6>About</h6>
                            <ul>
                                <li><a href="/story.html">Our Story</a></li>
                                <li><a href="/craft.html">Craft Standards</a></li>
                                <li><a href="/sustainability.html">Sustainability</a></li>
                                <li><a href="/traceability.html">Traceability</a></li>
                            </ul>
                        </div>
                        <div class="footer-section">
                            <h6>Support</h6>
                            <ul>
                                <li><a href="/care.html">Care & Repair</a></li>
                                <li><a href="/shipping.html">Shipping</a></li>
                                <li><a href="/returns.html">Returns</a></li>
                                <li><a href="/contact.html">Contact</a></li>
                            </ul>
                        </div>
                    </div>
                    <div class="footer-bottom">
                        <p class="footer-copyright">© 2025 Athena. Quietly Powerful.</p>
                        <div class="footer-links">
                            <a href="/privacy.html">Privacy</a>
                            <a href="/terms.html">Terms</a>
                        </div>
                    </div>
                </div>
            </footer>
        `;
  }
}

// Register custom elements
customElements.define("site-header", SiteHeader);
customElements.define("site-footer", SiteFooter);

// Export for module usage
if (typeof module !== "undefined" && module.exports) {
  module.exports = { SiteHeader, SiteFooter };
}
