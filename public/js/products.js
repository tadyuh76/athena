import { AuthService } from "/services/AuthService.js";
import { ProductService } from "/services/ProductService.js";
import { CartService } from "/services/CartService.js";
import { WishlistService } from "/services/WishlistService.js";

// Initialize services
const authService = new AuthService();
const productService = new ProductService();
const cartService = new CartService();
const wishlistService = new WishlistService();

// State
let currentPage = 1;
let currentFilters = {};
let wishlistItems = [];

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await initializeNavigation();
  await loadCategories();
  await loadCollections();

  if (authService.isAuthenticated()) {
    await loadWishlist();
  }

  parseUrlParams();
  await loadProducts();
  setupEventListeners();
});

// Initialize navigation
async function initializeNavigation() {
  await updateCartCount();
}

// Update cart count
async function updateCartCount() {
  try {
    if (authService.isAuthenticated()) {
      await cartService.getCart();
      const count = cartService.getItemCount();
      const cartCountEl = document.getElementById("cartCount");

      if (cartCountEl && count > 0) {
        cartCountEl.textContent = count.toString();
        cartCountEl.style.display = "inline-block";
      }
    }
  } catch (error) {
    console.error("Failed to update cart count:", error);
  }
}

// Load wishlist
async function loadWishlist() {
  try {
    const result = await wishlistService.getWishlist();
    wishlistItems = Array.isArray(result) ? result : [];
  } catch (error) {
    console.error("Failed to load wishlist:", error);
    wishlistItems = [];
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
    is_featured: params.get("featured") === "true",
    search: params.get("search") || undefined,
    sort_by: params.get("sort_by") || "newest",
  };

  currentPage = parseInt(params.get("page") || "1");

  // Update UI to reflect filters
  if (currentFilters.search) {
    const searchInput = document.getElementById("searchInput");
    if (searchInput) searchInput.value = currentFilters.search;
  }
  if (currentFilters.min_price) {
    const minPrice = document.getElementById("minPrice");
    if (minPrice) minPrice.value = currentFilters.min_price;
  }
  if (currentFilters.max_price) {
    const maxPrice = document.getElementById("maxPrice");
    if (maxPrice) maxPrice.value = currentFilters.max_price;
  }
  if (currentFilters.in_stock) {
    const inStockFilter = document.getElementById("inStockFilter");
    if (inStockFilter) inStockFilter.checked = true;
  }
  if (currentFilters.is_featured) {
    const featuredFilter = document.getElementById("featuredFilter");
    if (featuredFilter) featuredFilter.checked = true;
  }
  if (currentFilters.sort_by) {
    const sortBy = document.getElementById("sortBy");
    if (sortBy) sortBy.value = currentFilters.sort_by;
  }
}

// Create skeleton for filters
function createFilterSkeleton(count = 4) {
  return `
    <div class="skeleton-loader">
      ${Array(count)
        .fill(0)
        .map(() => '<div class="skeleton skeleton-filter"></div>')
        .join("")}
    </div>
  `;
}

// Load categories
async function loadCategories() {
  const container = document.getElementById("categoryFilters");
  container.innerHTML = createFilterSkeleton(5);

  try {
    const categories = await productService.getCategories();

    if (categories.length === 0) {
      container.innerHTML =
        '<p class="text-muted small">Không có danh mục nào</p>';
      return;
    }

    container.innerHTML = `
      <div class="form-check mb-2">
        <input class="form-check-input category-filter" type="radio" name="category"
               id="category-all" value="" ${
                 !currentFilters.category_id ? "checked" : ""
               }>
        <label class="form-check-label" for="category-all">
          Tất Cả Danh Mục
        </label>
      </div>
      ${categories
        .map(
          (category) => `
        <div class="form-check mb-2">
          <input class="form-check-input category-filter" type="radio" name="category"
                 id="category-${category.id}" value="${category.id}"
                 ${currentFilters.category_id === category.id ? "checked" : ""}>
          <label class="form-check-label" for="category-${category.id}">
            ${category.name}
          </label>
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    console.error("Failed to load categories:", error);
    document.getElementById("categoryFilters").innerHTML =
      '<p class="text-danger small">Không thể tải danh mục</p>';
  }
}

// Load collections
async function loadCollections() {
  const container = document.getElementById("collectionFilters");
  container.innerHTML = createFilterSkeleton(4);

  try {
    const collections = await productService.getCollections();

    if (collections.length === 0) {
      container.innerHTML =
        '<p class="text-muted small">Không có bộ sưu tập nào</p>';
      return;
    }

    container.innerHTML = `
      <div class="form-check mb-2">
        <input class="form-check-input collection-filter" type="radio" name="collection"
               id="collection-all" value="" ${
                 !currentFilters.collection_id ? "checked" : ""
               }>
        <label class="form-check-label" for="collection-all">
          Tất Cả Bộ Sưu Tập
        </label>
      </div>
      ${collections
        .map(
          (collection) => `
        <div class="form-check mb-2">
          <input class="form-check-input collection-filter" type="radio" name="collection"
                 id="collection-${collection.id}" value="${collection.id}"
                 ${
                   currentFilters.collection_id === collection.id
                     ? "checked"
                     : ""
                 }>
          <label class="form-check-label" for="collection-${collection.id}">
            ${collection.name}
          </label>
        </div>
      `
        )
        .join("")}
    `;
  } catch (error) {
    console.error("Failed to load collections:", error);
    document.getElementById("collectionFilters").innerHTML =
      '<p class="text-danger small">Không thể tải bộ sưu tập</p>';
  }
}

// Create skeleton loader for products
function createProductSkeleton() {
  return `
    <div class="col-lg-4 col-md-6">
      <div class="skeleton-card">
        <div class="skeleton skeleton-image"></div>
        <div class="skeleton skeleton-text skeleton-text-short mb-2"></div>
        <div class="skeleton skeleton-text skeleton-text-long mb-2"></div>
        <div class="skeleton skeleton-text skeleton-text-short"></div>
      </div>
    </div>
  `;
}

// Load products
async function loadProducts() {
  const container = document.getElementById("productsGrid");
  // Show skeleton loaders
  container.innerHTML = Array(12)
    .fill(0)
    .map(() => createProductSkeleton())
    .join("");

  try {
    const filters = { ...currentFilters };
    // Remove undefined values
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] === undefined ||
        filters[key] === false ||
        filters[key] === ""
      ) {
        delete filters[key];
      }
    });

    const { products, total, totalPages } = await productService.getProducts(
      filters,
      currentPage,
      12
    );

    // Update product count
    document.getElementById(
      "productCount"
    ).textContent = `Hiển thị ${products.length} trong ${total} sản phẩm`;

    if (products.length === 0) {
      container.innerHTML = `
        <div class="col-12 text-center py-5">
          <i class="bi bi-search" style="font-size: 3rem; color: #ccc;"></i>
          <h4 class="mt-3">Không tìm thấy sản phẩm</h4>
          <p class="text-muted">Thử điều chỉnh bộ lọc hoặc từ khóa tìm kiếm</p>
          <button class="btn btn-dark" onclick="window.clearAllFilters()">Xóa Bộ Lọc</button>
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
        const isInWishlist =
          Array.isArray(wishlistItems) &&
          wishlistItems.some((w) => w.product_id === product.id);

        return `
        <div class="col-lg-4 col-md-6">
          <div class="card product-card h-100 border-0 shadow-sm">
            <div class="position-relative overflow-hidden">
              ${
                discount
                  ? `<span class="position-absolute top-0 start-0 m-2 badge bg-danger">-${discount}%</span>`
                  : ""
              }
              ${
                authService.isAuthenticated()
                  ? `
                <button class="position-absolute top-0 end-0 m-2 btn btn-sm btn-light rounded-circle wishlist-btn ${
                  isInWishlist ? "active" : ""
                }"
                        onclick="window.toggleWishlist(event, '${product.id}')"
                        title="${
                          isInWishlist
                            ? "Xóa khỏi danh sách yêu thích"
                            : "Thêm vào danh sách yêu thích"
                        }">
                  <i class="bi ${
                    isInWishlist ? "bi-heart-fill text-danger" : "bi-heart"
                  }"></i>
                </button>
              `
                  : ""
              }
              ${
                !isInStock
                  ? `<div class="position-absolute bottom-0 start-0 end-0 bg-secondary bg-opacity-75 text-white text-center py-2">Hết Hàng</div>`
                  : ""
              }
              <a href="/product-detail.html?id=${product.id}">
                <img src="${
                  primaryImage?.url ||
                  product.featured_image_url ||
                  "/images/placeholder-user.jpg"
                }"
                     class="card-img-top" alt="${
                       product.name
                     }" style="height: 350px; object-fit: cover;">
              </a>
            </div>
            <div class="card-body d-flex flex-column">
              <h5 class="card-title mb-2">
                <a href="/product-detail.html?id=${
                  product.id
                }" class="text-decoration-none text-dark">
                  ${product.name}
                </a>
              </h5>
              ${
                product.short_description
                  ? `<p class="card-text text-muted small">${product.short_description.substring(
                      0,
                      80
                    )}...</p>`
                  : ""
              }
              <div class="mt-auto">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                    <span class="fw-bold fs-5">${productService.formatPrice(
                      product.base_price
                    )}</span>
                    ${
                      product.compare_price
                        ? `<span class="text-muted text-decoration-line-through ms-2">${productService.formatPrice(
                            product.compare_price
                          )}</span>`
                        : ""
                    }
                  </div>
                  ${
                    product.rating
                      ? `
                    <div class="text-warning small">
                      ${"★".repeat(Math.round(product.rating))}${"☆".repeat(
                          5 - Math.round(product.rating)
                        )}
                      ${
                        product.review_count
                          ? `<span class="text-muted ms-1">(${product.review_count})</span>`
                          : ""
                      }
                    </div>
                  `
                      : ""
                  }
                </div>
                <div class="d-grid gap-2">
                  ${
                    isInStock
                      ? `
                    <button class="btn btn-dark btn-sm" onclick="window.quickAddToCart(event, '${product.id}')">
                      <i class="bi bi-cart-plus me-2"></i>Thêm Nhanh
                    </button>
                  `
                      : `
                    <button class="btn btn-secondary btn-sm" disabled>Hết Hàng</button>
                  `
                  }
                  <a href="/product-detail.html?id=${
                    product.id
                  }" class="btn btn-outline-dark btn-sm">
                    Xem Chi Tiết
                  </a>
                </div>
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
      <div class="col-12 text-center py-5">
        <p class="text-danger">Không thể tải sản phẩm. Vui lòng thử lại sau.</p>
        <small class="text-muted">${error.message}</small>
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
      <a class="page-link" href="#" data-page="${currentPage - 1}">
        <i class="bi bi-chevron-left"></i>
      </a>
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
      <a class="page-link" href="#" data-page="${currentPage + 1}">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  container.innerHTML = html;
}

// Setup event listeners
function setupEventListeners() {
  // Search
  const searchBtn = document.getElementById("searchBtn");
  const searchInput = document.getElementById("searchInput");

  if (searchBtn) {
    searchBtn.addEventListener("click", performSearch);
  }

  if (searchInput) {
    searchInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        performSearch();
      }
    });
  }

  // Clear filters
  const clearFilters = document.getElementById("clearFilters");
  if (clearFilters) {
    clearFilters.addEventListener("click", clearAllFilters);
  }

  // Price filter
  const applyPriceFilter = document.getElementById("applyPriceFilter");
  if (applyPriceFilter) {
    applyPriceFilter.addEventListener("click", applyPriceFilterHandler);
  }

  // Category filters
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("category-filter")) {
      currentFilters.category_id = e.target.value || undefined;
      currentPage = 1;
      updateUrlAndReload();
    }
  });

  // Collection filters
  document.addEventListener("change", (e) => {
    if (e.target.classList.contains("collection-filter")) {
      currentFilters.collection_id = e.target.value || undefined;
      currentPage = 1;
      updateUrlAndReload();
    }
  });

  // Other filters
  const inStockFilter = document.getElementById("inStockFilter");
  if (inStockFilter) {
    inStockFilter.addEventListener("change", (e) => {
      currentFilters.in_stock = e.target.checked || undefined;
      currentPage = 1;
      updateUrlAndReload();
    });
  }

  const featuredFilter = document.getElementById("featuredFilter");
  if (featuredFilter) {
    featuredFilter.addEventListener("change", (e) => {
      currentFilters.is_featured = e.target.checked || undefined;
      currentPage = 1;
      updateUrlAndReload();
    });
  }

  // Sort
  const sortBy = document.getElementById("sortBy");
  if (sortBy) {
    sortBy.addEventListener("change", (e) => {
      currentFilters.sort_by = e.target.value;
      currentPage = 1;
      updateUrlAndReload();
    });
  }

  // Pagination
  document.addEventListener("click", (e) => {
    if (e.target.matches(".page-link") || e.target.closest(".page-link")) {
      e.preventDefault();
      const link = e.target.matches(".page-link")
        ? e.target
        : e.target.closest(".page-link");
      const page = parseInt(link.dataset.page);
      if (!isNaN(page) && page !== currentPage) {
        currentPage = page;
        updateUrlAndReload();
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    }
  });
}

// Perform search
function performSearch() {
  const searchInput = document.getElementById("searchInput");
  currentFilters.search = searchInput.value.trim() || undefined;
  currentPage = 1;
  updateUrlAndReload();
}

// Clear all filters
function clearAllFilters() {
  currentFilters = { sort_by: "newest" };
  currentPage = 1;
  window.location.href = "/products.html";
}
window.clearAllFilters = clearAllFilters;

// Apply price filter
function applyPriceFilterHandler() {
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
    if (
      currentFilters[key] !== undefined &&
      currentFilters[key] !== false &&
      currentFilters[key] !== ""
    ) {
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
window.toggleWishlist = async function (event, productId) {
  event.preventDefault();
  event.stopPropagation();

  if (!authService.isAuthenticated()) {
    showToast("Vui lòng đăng nhập để sử dụng danh sách yêu thích", "warning");
    return;
  }

  const button = event.currentTarget;
  const icon = button.querySelector("i");

  try {
    const wishlistItem = wishlistItems.find((w) => w.product_id === productId);

    if (wishlistItem) {
      await wishlistService.removeItem(wishlistItem.id);
      wishlistItems = wishlistItems.filter((w) => w.id !== wishlistItem.id);
      button.classList.remove("active");
      icon.classList.remove("bi-heart-fill", "text-danger");
      icon.classList.add("bi-heart");
      showToast("Đã xóa khỏi danh sách yêu thích", "info");
    } else {
      const result = await wishlistService.addItem(productId);
      wishlistItems.push(result);
      button.classList.add("active");
      icon.classList.remove("bi-heart");
      icon.classList.add("bi-heart-fill", "text-danger");
      showToast("Đã thêm vào danh sách yêu thích!", "success");
    }
  } catch (error) {
    console.error("Failed to toggle wishlist:", error);
    showToast("Không thể cập nhật danh sách yêu thích", "danger");
  }
};

// Quick add to cart
window.quickAddToCart = async function (event, productId) {
  event.preventDefault();
  event.stopPropagation();

  if (!authService.isAuthenticated()) {
    showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", "warning");
    setTimeout(() => {
      window.location.href =
        "/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  const button = event.currentTarget;
  const originalHTML = button.innerHTML;
  const originalWidth = button.offsetWidth;
  button.disabled = true;
  button.style.width = `${originalWidth}px`;
  button.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang thêm...';

  try {
    const product = await productService.getProductById(productId);
    if (!product.variants || product.variants.length === 0) {
      throw new Error("Sản phẩm không có sẵn");
    }

    // Get default or first available variant
    const variant =
      product.variants.find(
        (v) => v.is_default && productService.getAvailableStock(v) > 0
      ) ||
      product.variants.find((v) => productService.getAvailableStock(v) > 0);

    if (!variant) {
      throw new Error("Sản phẩm đã hết hàng");
    }

    await cartService.addItem(productId, variant.id, 1);
    await updateCartCount();
    showToast("Đã thêm vào giỏ hàng!", "success");

    // Update button briefly to show success
    button.innerHTML = '<i class="bi bi-check2 me-2"></i>Đã thêm!';
    setTimeout(() => {
      button.innerHTML = originalHTML;
      button.disabled = false;
      button.style.width = "";
    }, 2000);
  } catch (error) {
    console.error("Failed to add to cart:", error);
    showToast(error.message || "Không thể thêm vào giỏ hàng", "danger");
    button.innerHTML = originalHTML;
    button.disabled = false;
    button.style.width = "";
  }
};

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");
  const toastId = "toast-" + Date.now();

  const bgClass =
    type === "success"
      ? "bg-success"
      : type === "warning"
      ? "bg-warning"
      : type === "danger"
      ? "bg-danger"
      : "bg-info";
  const icon =
    type === "success"
      ? "bi-check-circle"
      : type === "warning"
      ? "bi-exclamation-triangle"
      : type === "danger"
      ? "bi-x-circle"
      : "bi-info-circle";

  const toast = document.createElement("div");
  toast.id = toastId;
  toast.className = `toast align-items-center text-white ${bgClass} border-0`;
  toast.setAttribute("role", "alert");
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">
        <i class="bi ${icon} me-2"></i>${message}
      </div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  toastContainer.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast, { delay: 3000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}
