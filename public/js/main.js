// Import services
import { AuthService } from "/services/AuthService.js";
import { ProductService } from "/services/ProductService.js";
import { CartService } from "/services/CartService.js";
import { WishlistService } from "/services/WishlistService.js";

// Initialize services
const authService = new AuthService();
const productService = new ProductService();
const cartService = new CartService();
const wishlistService = new WishlistService();

// Initialize navigation
async function initializeNavigation() {
  // Check authentication status
  const user = authService.getUser();
  const authNav = document.getElementById("authNav");

  if (user && authNav) {
    authNav.innerHTML = `
            <div class="dropdown">
                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
                    <i class="bi bi-person-fill"></i> ${
                      user.first_name || user.email
                    }
                </a>
                <ul class="dropdown-menu">
                    <li><a class="dropdown-item" href="/account.html">My Account</a></li>
                    <li><a class="dropdown-item" href="/orders.html">My Orders</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn">Logout</a></li>
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

// Update cart count in navigation
async function updateCartCount() {
  try {
    const cart = await cartService.getCart();
    const count = cartService.getItemCount();
    const cartCountEl = document.getElementById("cartCount");

    if (cartCountEl) {
      if (count > 0) {
        cartCountEl.textContent = count.toString();
        cartCountEl.style.display = "inline";
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

  container.innerHTML =
    '<div class="spinner-container"><div class="spinner-border" role="status"></div></div>';

  try {
    const { products } = await productService.getProducts({
      is_featured: true,
      limit: 4,
    });

    container.innerHTML = products
      .map((product) => {
        const discount = productService.getDiscountPercentage(
          product.base_price,
          product.compare_price
        );
        const primaryImage =
          product.images?.find((img) => img.is_primary) || product.images?.[0];

        return `
                <div class="col-md-6 col-lg-3">
                    <div class="card product-card h-100">
                        ${
                          discount
                            ? `<span class="discount-badge">-${discount}%</span>`
                            : ""
                        }
                        <img src="${
                          primaryImage?.url ||
                          product.featured_image_url ||
                          "/images/placeholder-user.jpg"
                        }" 
                             class="card-img-top" alt="${product.name}">
                        <div class="card-body d-flex flex-column">
                            <h5 class="card-title text-truncate-2">${
                              product.name
                            }</h5>
                            <p class="card-text text-truncate-3 text-muted small">${
                              product.short_description || ""
                            }</p>
                            <div class="mt-auto">
                                <div class="d-flex justify-content-between align-items-center mb-3">
                                    <div>
                                        <span class="product-price">${productService.formatPrice(
                                          product.base_price
                                        )}</span>
                                        ${
                                          product.compare_price
                                            ? `<span class="product-compare-price ms-2">${productService.formatPrice(
                                                product.compare_price
                                              )}</span>`
                                            : ""
                                        }
                                    </div>
                                    ${
                                      product.rating
                                        ? `<div class="text-warning">
                                            ${"★".repeat(
                                              Math.round(product.rating)
                                            )}${"☆".repeat(
                                            5 - Math.round(product.rating)
                                          )}
                                            <small class="text-muted">(${
                                              product.review_count
                                            })</small>
                                        </div>`
                                        : ""
                                    }
                                </div>
                                <div class="d-flex gap-2">
                                    <a href="/product.html?id=${
                                      product.id
                                    }" class="btn btn-outline-dark btn-sm flex-fill">View Details</a>
                                    <button class="btn btn-outline-primary btn-sm" onclick="quickAddToCart('${
                                      product.id
                                    }')">
                                        <i class="bi bi-bag-plus"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load featured products:", error);
    container.innerHTML =
      '<div class="alert alert-danger">Failed to load products. Please try again later.</div>';
  }
}

// Load collections
async function loadCollections() {
  const container = document.getElementById("collections");
  if (!container) return;

  container.innerHTML =
    '<div class="spinner-container"><div class="spinner-border" role="status"></div></div>';

  try {
    const collections = await productService.getCollections();
    const featuredCollections = collections
      .filter((c) => c.is_featured)
      .slice(0, 3);

    container.innerHTML = featuredCollections
      .map(
        (collection) => `
            <div class="col-md-4">
                <div class="card h-100">
                    <img src="${
                      collection.hero_image_url ||
                      "/images/minimalist-fashion-model.png"
                    }" 
                         class="card-img-top" alt="${
                           collection.name
                         }" style="height: 300px; object-fit: cover;">
                    <div class="card-body">
                        <h5 class="card-title">${collection.name}</h5>
                        ${
                          collection.theme_name
                            ? `<p class="text-muted small">${collection.theme_name}</p>`
                            : ""
                        }
                        <p class="card-text">${collection.description || ""}</p>
                        <a href="/products.html?collection_id=${
                          collection.id
                        }" class="btn btn-dark btn-sm">Shop Collection</a>
                    </div>
                </div>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load collections:", error);
    container.innerHTML =
      '<div class="alert alert-danger">Failed to load collections. Please try again later.</div>';
  }
}

// Quick add to cart function
window.quickAddToCart = async function (productId) {
  try {
    const product = await productService.getProductById(productId);
    if (!product.variants || product.variants.length === 0) {
      alert("This product is currently unavailable");
      return;
    }

    // Get default variant or first available variant
    const variant =
      product.variants.find(
        (v) => v.is_default && productService.getAvailableStock(v) > 0
      ) ||
      product.variants.find((v) => productService.getAvailableStock(v) > 0);

    if (!variant) {
      alert("This product is out of stock");
      return;
    }

    await cartService.addItem(productId, variant.id, 1);
    await updateCartCount();

    // Show success message
    showToast("Product added to cart!", "success");
  } catch (error) {
    console.error("Failed to add to cart:", error);
    showToast("Failed to add product to cart", "danger");
  }
};

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer =
    document.getElementById("toastContainer") || createToastContainer();
  const toastId = "toast-" + Date.now();

  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
        <div class="d-flex">
            <div class="toast-body">${message}</div>
            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
        </div>
    `;

  toastContainer.appendChild(toast);

  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  // Remove toast element after it's hidden
  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

// Create toast container if it doesn't exist
function createToastContainer() {
  const container = document.createElement("div");
  container.id = "toastContainer";
  container.className = "toast-container position-fixed bottom-0 end-0 p-3";
  document.body.appendChild(container);
  return container;
}

// Removed newsletter functionality

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await initializeNavigation();

  // Load page-specific content
  const path = window.location.pathname;

  if (path === "/" || path === "/index.html") {
    await loadFeaturedProducts();
    await loadCollections();
  }
});

// Export for use in other pages
window.athena = {
  authService,
  productService,
  cartService,
  wishlistService,
  updateCartCount,
  updateWishlistCount,
  showToast,
};
