import { AuthService } from "/services/AuthService.js";
import { ProductService } from "/services/ProductService.js";
import { CartService } from "/services/CartService.js";

// Initialize services
const authService = new AuthService();
const productService = new ProductService();
const cartService = new CartService();

// Initialize navigation
async function initializeNavigation() {
  // Check authentication status
  const user = authService.getUser();
  const authNav = document.getElementById("authNav");

  if (user && authNav) {
    authNav.innerHTML = `
            <div class="dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-fill fs-5"></i>
                </a>
                <ul class="dropdown-menu dropdown-menu-end">
                    <li><h6 class="dropdown-header">${
                      user.first_name || user.email
                    }</h6></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="/account.html"><i class="bi bi-person me-2"></i>My Account</a></li>
                    <li><a class="dropdown-item" href="/orders.html"><i class="bi bi-bag me-2"></i>My Orders</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;

    // Add logout handler
    document
      .getElementById("logoutBtn")
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        await authService.logout();
      });
  }

  // Update cart count
  updateCartCount();
}

// Update cart count
async function updateCartCount() {
  try {
    await cartService.getCart();
    const count = cartService.getItemCount();
    const cartCountEl = document.getElementById("cartCount");

    if (cartCountEl) {
      if (count > 0) {
        cartCountEl.textContent = count.toString();
        cartCountEl.style.display = "inline-block";
      } else {
        cartCountEl.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Failed to update cart count:", error);
  }
}

// Load featured products
async function loadFeaturedProducts() {
  const container = document.getElementById("featuredProducts");
  if (!container) return;

  container.innerHTML = `
        <div class="col-12 text-center">
            <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">Đang tải...</span>
            </div>
        </div>
    `;

  try {
    const { products } = await productService.getProducts(
      { is_featured: true },
      1,
      4
    );

    if (products.length === 0) {
      // Show placeholder products if no featured products
      container.innerHTML = `
                <div class="col-lg-3 col-md-6">
                    <div class="product-card" onclick="window.location.href='/products.html'">
                        <div class="product-image mb-3">
                            <img src="/images/featured-blazer.png" alt="Architectural Blazer in White" class="img-fluid rounded" />
                        </div>
                        <h5 class="fw-semibold mb-2" style="color: #1f2937">Architectural Blazer</h5>
                        <p class="text-muted small mb-2">Structured silhouette in organic cotton</p>
                        <p class="fw-bold mb-0" style="color: #1f2937">$485</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="product-card" onclick="window.location.href='/products.html'">
                        <div class="product-image mb-3">
                            <img src="/images/featured-dress.png" alt="Essential Dress in Black" class="img-fluid rounded" />
                        </div>
                        <h5 class="fw-semibold mb-2" style="color: #1f2937">Essential Dress</h5>
                        <p class="text-muted small mb-2">Minimalist design in TENCEL Lyocell</p>
                        <p class="fw-bold mb-0" style="color: #1f2937">$325</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="product-card" onclick="window.location.href='/products.html'">
                        <div class="product-image mb-3">
                            <img src="/images/featured-trousers.png" alt="Precision Trousers in Neutral" class="img-fluid rounded" />
                        </div>
                        <h5 class="fw-semibold mb-2" style="color: #1f2937">Precision Trousers</h5>
                        <p class="text-muted small mb-2">High-waisted with architectural pleats</p>
                        <p class="fw-bold mb-0" style="color: #1f2937">$285</p>
                    </div>
                </div>
                <div class="col-lg-3 col-md-6">
                    <div class="product-card" onclick="window.location.href='/products.html'">
                        <div class="product-image mb-3">
                            <img src="/images/featured-coat.png" alt="Statement Coat in Camel" class="img-fluid rounded" />
                        </div>
                        <h5 class="fw-semibold mb-2" style="color: #1f2937">Statement Coat</h5>
                        <p class="text-muted small mb-2">Oversized silhouette in wool blend</p>
                        <p class="fw-bold mb-0" style="color: #1f2937">$685</p>
                    </div>
                </div>
            `;
      return;
    }

    container.innerHTML = products
      .map((product) => {
        const discount = productService.getDiscountPercentage(
          product.base_price,
          product.compare_price
        );
        const primaryImage =
          product.images?.find((img) => img.is_primary) || product.images?.[0];

        return `
                <div class="col-lg-3 col-md-6">
                    <div class="product-card" onclick="window.location.href='/product-detail.html?id=${
                      product.id
                    }'">
                        <div class="product-image mb-3 position-relative">
                            ${
                              discount
                                ? `<span class="position-absolute top-0 end-0 badge bg-danger m-2">-${discount}%</span>`
                                : ""
                            }
                            <img src="${
                              primaryImage?.url ||
                              product.featured_image_url ||
                              "/images/placeholder-user.jpg"
                            }"
                                 alt="${
                                   product.name
                                 }" class="img-fluid rounded" />
                        </div>
                        <h5 class="fw-semibold mb-2" style="color: #1f2937">${
                          product.name
                        }</h5>
                        <p class="text-muted small mb-1">${
                          product.short_description || ""
                        }</p>
                        <div class="d-flex justify-content-between align-items-center mt-2">
                            <div>
                                <span class="fw-bold" style="color: #1f2937">${productService.formatPrice(
                                  product.base_price
                                )}</span>
                                ${
                                  product.compare_price
                                    ? `<span class="text-muted text-decoration-line-through ms-2 small">${productService.formatPrice(
                                        product.compare_price
                                      )}</span>`
                                    : ""
                                }
                            </div>
                            ${
                              product.rating
                                ? `<div class="text-warning small">
                                    ${"★".repeat(
                                      Math.round(product.rating)
                                    )}${"☆".repeat(
                                    5 - Math.round(product.rating)
                                  )}
                                    ${
                                      product.review_count
                                        ? `<span class="text-muted ms-1">(${product.review_count})</span>`
                                        : ""
                                    }
                                </div>`
                                : ""
                            }
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load featured products:", error);
    // Show placeholder products on error
    container.innerHTML = `
            <div class="col-lg-3 col-md-6">
                <div class="product-card" onclick="window.location.href='/products.html'">
                    <div class="product-image mb-3">
                        <img src="/images/featured-blazer.png" alt="Architectural Blazer in White" class="img-fluid rounded" />
                    </div>
                    <h5 class="fw-semibold mb-2" style="color: #1f2937">Architectural Blazer</h5>
                    <p class="text-muted small mb-2">Structured silhouette in organic cotton</p>
                    <p class="fw-bold mb-0" style="color: #1f2937">$485</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="product-card" onclick="window.location.href='/products.html'">
                    <div class="product-image mb-3">
                        <img src="/images/featured-dress.png" alt="Essential Dress in Black" class="img-fluid rounded" />
                    </div>
                    <h5 class="fw-semibold mb-2" style="color: #1f2937">Essential Dress</h5>
                    <p class="text-muted small mb-2">Minimalist design in TENCEL Lyocell</p>
                    <p class="fw-bold mb-0" style="color: #1f2937">$325</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="product-card" onclick="window.location.href='/products.html'">
                    <div class="product-image mb-3">
                        <img src="/images/featured-trousers.png" alt="Precision Trousers in Neutral" class="img-fluid rounded" />
                    </div>
                    <h5 class="fw-semibold mb-2" style="color: #1f2937">Precision Trousers</h5>
                    <p class="text-muted small mb-2">High-waisted with architectural pleats</p>
                    <p class="fw-bold mb-0" style="color: #1f2937">$285</p>
                </div>
            </div>
            <div class="col-lg-3 col-md-6">
                <div class="product-card" onclick="window.location.href='/products.html'">
                    <div class="product-image mb-3">
                        <img src="/images/featured-coat.png" alt="Statement Coat in Camel" class="img-fluid rounded" />
                    </div>
                    <h5 class="fw-semibold mb-2" style="color: #1f2937">Statement Coat</h5>
                    <p class="text-muted small mb-2">Oversized silhouette in wool blend</p>
                    <p class="fw-bold mb-0" style="color: #1f2937">$685</p>
                </div>
            </div>
        `;
  }
}

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await initializeNavigation();
  await loadFeaturedProducts();
});
