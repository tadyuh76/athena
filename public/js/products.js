import { AuthService } from "/services/AuthService.js";
import { ProductService } from "/services/ProductService.js";
import { CartService } from "/services/CartService.js";

// Initialize services
const authService = new AuthService();
const productService = new ProductService();
const cartService = new CartService();

// State
let currentPage = 1;
let currentFilters = {};

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeNavigation();
  } catch (error) {
    console.error("Failed to initialize navigation:", error);
  }

  try {
    await loadCategories();
  } catch (error) {
    console.error("Failed to load categories:", error);
  }

  try {
    await loadCollections();
  } catch (error) {
    console.error("Failed to load collections:", error);
  }

  try {
    parseUrlParams();
    await loadProducts();
  } catch (error) {
    console.error("Failed to load products:", error);
  }

  try {
    setupEventListeners();
  } catch (error) {
    console.error("Failed to setup event listeners:", error);
  }
});

// Initialize navigation
async function initializeNavigation() {
  const user = authService.getCurrentUser();
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
                    <li><a class="dropdown-item" href="/wishlist.html"><i class="bi bi-heart me-2"></i>Wishlist</a></li>
                    <li><hr class="dropdown-divider"></li>
                    <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Logout</a></li>
                </ul>
            </div>
        `;

    document
      .getElementById("logoutBtn")
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        await authService.logout();
      });
  }

  updateCartCount();
}

// Update cart count
async function updateCartCount() {
  try {
    await cartService.getCart();
    const count = cartService.getItemCount();
    const cartCountEl = document.getElementById("cartCount");

    if (cartCountEl && count > 0) {
      cartCountEl.textContent = count.toString();
      cartCountEl.style.display = "inline-block";
    }
  } catch (error) {
    console.error("Failed to update cart count:", error);
  }
}

// Parse URL params
function parseUrlParams() {
  const params = new URLSearchParams(window.location.search);

  currentFilters = {
    category_id: params.get("category"),
    collection_id: params.get("collection"),
    min_price: params.get("min_price")
      ? parseFloat(params.get("min_price"))
      : undefined,
    max_price: params.get("max_price")
      ? parseFloat(params.get("max_price"))
      : undefined,
    in_stock: params.get("in_stock") === "true",
    featured: params.get("featured") === "true",
    search: params.get("search") || undefined,
  };

  currentPage = parseInt(params.get("page") || "1");

  // Update UI to reflect filters
  if (currentFilters.min_price)
    document.getElementById("minPrice").value = currentFilters.min_price;
  if (currentFilters.max_price)
    document.getElementById("maxPrice").value = currentFilters.max_price;
  if (currentFilters.in_stock)
    document.getElementById("inStockFilter").checked = true;
  if (currentFilters.featured)
    document.getElementById("featuredFilter").checked = true;
}

// Load categories
async function loadCategories() {
  try {
    const categories = await productService.getCategories();
    const container = document.getElementById("categoryFilters");

    container.innerHTML = categories
      .map(
        (category) => `
            <div class="form-check">
                <input class="form-check-input category-filter" type="radio" name="category" 
                       id="category-${category.id}" value="${category.id}">
                <label class="form-check-label" for="category-${category.id}">
                    ${category.name}
                </label>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load categories:", error);
  }
}

// Load collections
async function loadCollections() {
  try {
    const collections = await productService.getCollections();
    const container = document.getElementById("collectionFilters");

    container.innerHTML = collections
      .map(
        (collection) => `
            <div class="form-check">
                <input class="form-check-input collection-filter" type="radio" name="collection" 
                       id="collection-${collection.id}" value="${collection.id}">
                <label class="form-check-label" for="collection-${collection.id}">
                    ${collection.name}
                </label>
            </div>
        `
      )
      .join("");
  } catch (error) {
    console.error("Failed to load collections:", error);
  }
}

// Load products
async function loadProducts() {
  const container = document.getElementById("productsGrid");
  container.innerHTML = `
        <div class="col-12 loading-spinner">
            <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

  try {
    const filters = { ...currentFilters };
    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (filters[key] === undefined || filters[key] === false) {
        delete filters[key];
      }
    });

    const { products, total, totalPages } = await productService.getProducts({
      ...filters,
      page: currentPage,
      limit: 12,
    });

    // Update product count
    document.getElementById(
      "productCount"
    ).textContent = `Showing ${products.length} of ${total} products`;

    if (products.length === 0) {
      container.innerHTML = `
                <div class="col-12 empty-state">
                    <i class="bi bi-search"></i>
                    <h4>No products found</h4>
                    <p>Try adjusting your filters or search terms</p>
                    <button class="btn btn-dark" onclick="clearAllFilters()">Clear Filters</button>
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
        const isInStock = productService.isInStock(product);
        const isInWishlist = false;

        return `
                <div class="col-lg-4 col-md-6">
                    <div class="card product-card h-100">
                        <div class="position-relative overflow-hidden">
                            ${
                              discount
                                ? `<span class="discount-badge">-${discount}%</span>`
                                : ""
                            }
                            ${
                              authService.isAuthenticated()
                                ? `
                                <button class="wishlist-btn ${
                                  isInWishlist ? "active" : ""
                                }" 
                                        onclick="toggleWishlist(event, '${
                                          product.id
                                        }')">
                                    <i class="bi ${
                                      isInWishlist
                                        ? "bi-heart-fill"
                                        : "bi-heart"
                                    }"></i>
                                </button>
                            `
                                : ""
                            }
                            ${
                              !isInStock
                                ? `
                                <div class="out-of-stock-badge">Out of Stock</div>
                                <div class="product-overlay"></div>
                            `
                                : ""
                            }
                            <img src="${
                              primaryImage?.url ||
                              product.featured_image_url ||
                              "/images/placeholder-user.jpg"
                            }" 
                                 class="card-img-top" alt="${product.name}">
                            ${
                              isInStock
                                ? `
                                <button class="quick-add-btn" onclick="quickAddToCart(event, '${product.id}')">
                                    Quick Add to Cart
                                </button>
                            `
                                : ""
                            }
                        </div>
                        <div class="card-body d-flex flex-column">
                            <h5 class="product-title mb-2">${product.name}</h5>
                            <p class="product-description mb-auto">${
                              product.short_description || ""
                            }</p>
                            <div class="mt-3">
                                <div class="d-flex justify-content-between align-items-center mb-2">
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
                                        ? `<div class="text-warning small">
                                            ${"★".repeat(
                                              Math.round(product.rating)
                                            )}${"☆".repeat(
                                            5 - Math.round(product.rating)
                                          )}
                                        </div>`
                                        : ""
                                    }
                                </div>
                                <a href="/product-detail.html?id=${
                                  product.id
                                }" class="btn btn-outline-dark btn-sm w-100">
                                    View Details
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");

    // Update pagination
    updatePagination(totalPages);
  } catch (error) {
    console.error("Failed to load products:", error);
    container.innerHTML = `
            <div class="col-12 text-center">
                <p class="text-danger">Failed to load products. Please try again later.</p>
            </div>
        `;
  }
}

// Update pagination
function updatePagination(totalPages) {
  const container = document.getElementById("pagination");
  if (totalPages <= 1) {
    container.innerHTML = "";
    return;
  }

  let html = "";

  // Previous button
  html += `
        <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${
              currentPage - 1
            }">Previous</a>
        </li>
    `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      html += `
                <li class="page-item ${i === currentPage ? "active" : ""}">
                    <a class="page-link" href="#" data-page="${i}">${i}</a>
                </li>
            `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    }
  }

  // Next button
  html += `
        <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
            <a class="page-link" href="#" data-page="${
              currentPage + 1
            }">Next</a>
        </li>
    `;

  container.innerHTML = html;
}

// Setup event listeners
function setupEventListeners() {
  // Clear filters
  document
    .getElementById("clearFilters")
    ?.addEventListener("click", clearAllFilters);

  // Price filter
  document
    .getElementById("applyPriceFilter")
    ?.addEventListener("click", applyPriceFilter);

  // Category filters
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("category-filter")) {
      currentFilters.category_id = e.target.value;
      currentPage = 1;
      updateUrlAndReload();
    }
  });

  // Collection filters
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("collection-filter")) {
      currentFilters.collection_id = e.target.value;
      currentPage = 1;
      updateUrlAndReload();
    }
  });

  // Other filters
  document.getElementById("inStockFilter")?.addEventListener("change", (e) => {
    currentFilters.in_stock = e.target.checked;
    currentPage = 1;
    updateUrlAndReload();
  });

  document.getElementById("featuredFilter")?.addEventListener("change", (e) => {
    currentFilters.is_featured = e.target.checked;
    currentPage = 1;
    updateUrlAndReload();
  });

  // Sort
  document.getElementById("sortBy")?.addEventListener("change", (e) => {
    // Note: Sorting would be handled by backend, adding to filters
    currentPage = 1;
    updateUrlAndReload();
  });

  // Pagination
  document.addEventListener("click", (e) => {
    if (e.target.matches(".page-link")) {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (!isNaN(page)) {
        currentPage = page;
        updateUrlAndReload();
      }
    }
  });
}

// Clear all filters
function clearAllFilters() {
  currentFilters = {};
  currentPage = 1;
  window.location.href = "/products.html";
}
window.clearAllFilters = clearAllFilters;

// Apply price filter
function applyPriceFilter() {
  const minPrice = document.getElementById("minPrice").value;
  const maxPrice = document.getElementById("maxPrice").value;

  currentFilters.min_price = minPrice ? parseFloat(minPrice) : undefined;
  currentFilters.max_price = maxPrice ? parseFloat(maxPrice) : undefined;
  currentPage = 1;
  updateUrlAndReload();
}

// Update URL and reload products
function updateUrlAndReload() {
  const params = new URLSearchParams();

  Object.keys(currentFilters).forEach((key) => {
    if (currentFilters[key] !== undefined && currentFilters[key] !== false) {
      params.set(key, currentFilters[key]);
    }
  });

  if (currentPage > 1) {
    params.set("page", currentPage);
  }

  const newUrl =
    window.location.pathname +
    (params.toString() ? "?" + params.toString() : "");
  window.history.pushState({}, "", newUrl);
  loadProducts();
}

// Toggle wishlist

// Quick add to cart
async function quickAddToCart(event, productId) {
  event.stopPropagation();
  const button = event.currentTarget;
  button.disabled = true;
  button.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

  try {
    const product = await productService.getProductById(productId);
    if (!product.variants || product.variants.length === 0) {
      throw new Error("Product not available");
    }

    // Get default or first available variant
    const variant =
      product.variants.find(
        (v) => v.is_default && productService.getAvailableStock(v) > 0
      ) ||
      product.variants.find((v) => productService.getAvailableStock(v) > 0);

    if (!variant) {
      throw new Error("Product out of stock");
    }

    await cartService.addItem(productId, variant.id, 1);
    await updateCartCount();
    showToast("Added to cart!", "success");
  } catch (error) {
    console.error("Failed to add to cart:", error);
    showToast(error.message || "Failed to add to cart", "danger");
  } finally {
    button.disabled = false;
    button.innerHTML = "Quick Add to Cart";
  }
}
window.quickAddToCart = quickAddToCart;

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");
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

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}
