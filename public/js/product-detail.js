import { AuthService } from "/services/AuthService.js";
import { ProductService } from "/services/ProductService.js";
import { CartService } from "/services/CartService.js";
import { WishlistService } from "/services/WishlistService.js";
import { ReviewService } from "/services/ReviewService.js";
import { Dialog } from "/js/dialog.js";

// Initialize services
const authService = new AuthService();
const productService = new ProductService();
const cartService = new CartService();
const wishlistService = new WishlistService();
const reviewService = new ReviewService();

// State
let currentProduct = null;
let selectedVariant = null;
let quantity = 1;
let isInWishlist = false;
let wishlistItemId = null;
let isAddingToCart = false;
let currentReviews = null;
let selectedRating = 0;
let reviewModal = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await initializeNavigation();

  const productId = getProductIdFromUrl();

  if (productId) {
    await loadProduct(productId);
    if (authService.isAuthenticated()) {
      await checkWishlistStatus(productId);
    }
    await loadReviews(productId);
    await loadRelatedProducts();
    initializeReviewModal();
  } else {
    window.location.href = "/products.html";
  }
});

// Get product ID from URL
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

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

      if (cartCountEl) {
        if (count > 0) {
          cartCountEl.textContent = count.toString();
          cartCountEl.style.display = "inline";
        } else {
          cartCountEl.style.display = "none";
        }
      }
    }
  } catch (error) {
    console.error("Failed to update cart count:", error);
  }
}

// Load product
async function loadProduct(productId) {
  const container = document.getElementById("productDetail");
  container.innerHTML = `
    <div class="col-12 text-center py-5">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">Đang tải...</span>
      </div>
      <div class="mt-3 text-muted">Đang tải thông tin sản phẩm...</div>
    </div>
  `;

  try {
    currentProduct = await productService.getProductById(productId);

    if (!currentProduct) {
      throw new Error("Không tìm thấy sản phẩm");
    }

    // Set default variant
    if (currentProduct.variants && currentProduct.variants.length > 0) {
      selectedVariant = currentProduct.variants.find(v => v.is_default) || currentProduct.variants[0];
    }

    // Update breadcrumb
    const breadcrumbProduct = document.getElementById("breadcrumbProduct");
    const breadcrumbCollection = document.getElementById("breadcrumbCollection");

    if (breadcrumbProduct) {
      breadcrumbProduct.textContent = currentProduct.name;
    }

    if (breadcrumbCollection && currentProduct.collection?.name) {
      breadcrumbCollection.textContent = currentProduct.collection.name;
    }

    // Render product detail
    container.innerHTML = renderProductDetail(currentProduct);

  } catch (error) {
    console.error("Failed to load product:", error);
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-danger">
          <h4>Không Tìm Thấy Sản Phẩm</h4>
          <p>Sản phẩm bạn đang tìm không tồn tại hoặc đã bị xóa.</p>
          <a href="/products.html" class="btn btn-dark">Xem Sản Phẩm</a>
        </div>
      </div>
    `;
  }
}

// Render product detail
function renderProductDetail(product) {
  const discount = calculateDiscount(product.base_price, product.compare_price);
  const stockStatus = getStockStatus(product);
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];

  return `
    <!-- Image Gallery -->
    <div class="col-lg-6">
      ${renderImageGallery(product.images, primaryImage)}
    </div>

    <!-- Product Info -->
    <div class="col-lg-6">
      <div class="product-info">
        <!-- Product Header -->
        <div class="mb-3">
          ${product.collection?.name ? `<p class="text-muted text-uppercase small mb-2">${product.collection.name}</p>` : ""}
          <h1 class="h2 mb-3">${product.name}</h1>
          <div class="d-flex align-items-center gap-3 mb-3">
            <div>
              <span class="h3 mb-0">${productService.formatPrice(product.base_price)}</span>
              ${product.compare_price ? `<span class="text-muted text-decoration-line-through ms-2">${productService.formatPrice(product.compare_price)}</span>` : ""}
            </div>
            ${discount > 0 ? `<span class="badge bg-danger">-${discount}% OFF</span>` : ""}
          </div>
          ${product.rating ? `
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="text-warning">
                ${"★".repeat(Math.round(product.rating))}${"☆".repeat(5 - Math.round(product.rating))}
              </div>
              <span class="text-muted small">(${product.review_count || 0} reviews)</span>
            </div>
          ` : ""}
          ${product.short_description ? `<p class="text-muted mb-4">${product.short_description}</p>` : ""}
        </div>

        <!-- Variant Selection -->
        ${renderVariantSelectors(product.variants)}

        <!-- Quantity and Add to Cart -->
        <div class="mb-4">
          <div class="row g-3">
            <div class="col-4">
              <label class="form-label small fw-semibold">Quantity</label>
              <div class="input-group">
                <button class="btn btn-outline-secondary" type="button" onclick="window.changeQuantity(-1)">
                  <i class="bi bi-dash"></i>
                </button>
                <input type="number" class="form-control text-center quantity-input" value="1" min="1" max="10"
                       onchange="window.updateQuantity(this.value)">
                <button class="btn btn-outline-secondary" type="button" onclick="window.changeQuantity(1)">
                  <i class="bi bi-plus"></i>
                </button>
              </div>
            </div>
            <div class="col-8">
              <label class="form-label small fw-semibold">&nbsp;</label>
              <button class="btn btn-dark btn-lg w-100 add-to-cart-btn" onclick="window.addToCart()"
                      ${stockStatus === 'out-of-stock' || !selectedVariant ? 'disabled' : ''}>
                <i class="bi bi-cart-plus me-2"></i>
                ${stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
              </button>
            </div>
          </div>

          ${authService.isAuthenticated() ? `
            <button class="btn btn-outline-dark w-100 mt-3 btn-wishlist ${isInWishlist ? 'active' : ''}" onclick="window.toggleWishlist()">
              <i class="bi ${isInWishlist ? 'bi-heart-fill' : 'bi-heart'} me-2"></i>
              ${isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
            </button>
          ` : ""}

          <div class="mt-3">
            <p class="small text-muted mb-1">
              <i class="bi bi-truck me-2"></i>Free shipping on orders over $200
            </p>
            <p class="small text-muted mb-1">
              <i class="bi bi-arrow-return-left me-2"></i>30-day free returns
            </p>
            <p class="small text-muted mb-0">
              <i class="bi bi-shield-check me-2"></i>Secure checkout
            </p>
          </div>
        </div>

        <!-- Product Details Accordion -->
        <div class="accordion" id="productAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDescription">
                Description
              </button>
            </h2>
            <div id="collapseDescription" class="accordion-collapse collapse show" data-bs-parent="#productAccordion">
              <div class="accordion-body">
                ${product.description || product.short_description || 'No description available.'}
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMaterial">
                Material & Care
              </button>
            </h2>
            <div id="collapseMaterial" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Material Composition:</strong></p>
                <p>${renderMaterialComposition(product.material_composition)}</p>
                ${product.care_instructions ? `
                  <p class="mb-2 mt-3"><strong>Care Instructions:</strong></p>
                  <p>${product.care_instructions}</p>
                ` : ""}
              </div>
            </div>
          </div>

          ${product.sustainability_notes ? `
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSustainability">
                  Sustainability
                </button>
              </h2>
              <div id="collapseSustainability" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                <div class="accordion-body">
                  ${product.sustainability_notes}
                  ${product.certification_labels && product.certification_labels.length > 0 ? `
                    <div class="mt-3">
                      <p class="mb-2"><strong>Certifications:</strong></p>
                      <div class="d-flex gap-2 flex-wrap">
                        ${product.certification_labels.map(cert => `<span class="badge bg-success">${cert}</span>`).join('')}
                      </div>
                    </div>
                  ` : ""}
                </div>
              </div>
            </div>
          ` : ""}
        </div>
      </div>
    </div>
  `;
}

// Render image gallery
function renderImageGallery(images, primaryImage) {
  if (!images || images.length === 0) {
    return `
      <div class="product-image-container">
        <img src="${primaryImage?.url || '/images/placeholder-user.jpg'}"
             alt="Product" class="img-fluid rounded" id="mainProductImage">
      </div>
    `;
  }

  return `
    <div class="product-image-container mb-3">
      <img src="${images[0]?.url}" alt="${images[0]?.alt_text || 'Product'}"
           class="img-fluid rounded" id="mainProductImage">
    </div>
    ${images.length > 1 ? `
      <div class="product-thumbnails">
        ${images.map((img, index) => `
          <img src="${img.url}" alt="${img.alt_text || 'Product'}"
               class="product-thumbnail ${index === 0 ? 'active' : ''}"
               onclick="window.changeMainImage('${img.url}', ${index})">
        `).join('')}
      </div>
    ` : ""}
  `;
}

// Render variant selectors
function renderVariantSelectors(variants) {
  if (!variants || variants.length === 0) {
    return '';
  }

  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];

  let html = '';

  // Size selector
  if (sizes.length > 0) {
    html += `
      <div class="mb-4">
        <label class="form-label small fw-semibold">
          Size: <span id="selectedSize">${selectedVariant?.size || 'Select Size'}</span>
        </label>
        <div class="d-flex gap-2 flex-wrap">
          ${sizes.map(size => {
            const variant = variants.find(v => v.size === size && (!selectedVariant?.color || v.color === selectedVariant.color));
            const isSelected = selectedVariant?.size === size;
            const isAvailable = variant && productService.getAvailableStock(variant) > 0;
            return `
              <button class="btn ${isSelected ? 'btn-dark active' : 'btn-outline-dark'} size-btn"
                      onclick="window.selectVariant('size', '${size}')"
                      ${!isAvailable ? 'disabled' : ''}>
                ${size}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Color selector
  if (colors.length > 0) {
    html += `
      <div class="mb-4">
        <label class="form-label small fw-semibold">
          Color: <span id="selectedColor">${selectedVariant?.color || 'Select Color'}</span>
        </label>
        <div class="d-flex gap-2 flex-wrap">
          ${colors.map(color => {
            const variant = variants.find(v => v.color === color && (!selectedVariant?.size || v.size === selectedVariant.size));
            const isSelected = selectedVariant?.color === color;
            const isAvailable = variant && productService.getAvailableStock(variant) > 0;
            const colorHex = variant?.color_hex || '#ccc';
            return `
              <button class="btn color-swatch ${isSelected ? 'selected' : ''}"
                      onclick="window.selectVariant('color', '${color}')"
                      title="${color}"
                      ${!isAvailable ? 'disabled' : ''}
                      style="background-color: ${colorHex}; width: 40px; height: 40px; border-radius: 50%; border: 2px solid ${isSelected ? '#000' : '#ddd'}; padding: 0; display: flex; align-items: center; justify-content: center;">
                ${isSelected ? '<i class="bi bi-check text-white" style="font-size: 20px; font-weight: bold;"></i>' : ''}
              </button>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }

  // Stock status
  if (selectedVariant) {
    const stock = productService.getAvailableStock(selectedVariant);
    html += `
      <div class="alert ${stock > 0 ? (stock <= 5 ? 'alert-warning' : 'alert-success') : 'alert-danger'} py-2 small">
        ${stock > 0 ? (stock <= 5 ? `Only ${stock} left in stock!` : 'In Stock') : 'Out of Stock'}
      </div>
    `;
  }

  return html;
}

// Render material composition
function renderMaterialComposition(composition) {
  if (!composition) return '100% Quality Materials';

  if (typeof composition === 'object') {
    return Object.entries(composition)
      .map(([material, percentage]) => `${material}: ${percentage}%`)
      .join(', ');
  }

  return composition;
}

// Helper functions
function calculateDiscount(price, comparePrice) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function getStockStatus(product) {
  if (!product.variants || product.variants.length === 0) return 'in-stock';

  const totalStock = product.variants.reduce((total, variant) =>
    total + productService.getAvailableStock(variant), 0
  );

  if (totalStock === 0) return 'out-of-stock';
  if (totalStock <= 5) return 'low-stock';
  return 'in-stock';
}

// Interactive functions
window.changeMainImage = function (imageUrl, index) {
  const mainImage = document.getElementById('mainProductImage');
  if (mainImage) {
    mainImage.src = imageUrl;
  }

  // Update active thumbnail
  document.querySelectorAll('.product-thumbnail').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
};

window.selectVariant = function (type, value) {
  if (!currentProduct || !currentProduct.variants) return;

  // Find variant that matches the selection
  let targetVariant;
  if (type === 'size') {
    targetVariant = currentProduct.variants.find(v => v.size === value && (!selectedVariant?.color || v.color === selectedVariant.color)) ||
      currentProduct.variants.find(v => v.size === value);
  } else if (type === 'color') {
    targetVariant = currentProduct.variants.find(v => v.color === value && (!selectedVariant?.size || v.size === selectedVariant.size)) ||
      currentProduct.variants.find(v => v.color === value);
  }

  if (targetVariant) {
    selectedVariant = targetVariant;
    // Re-render the product to update the UI
    const container = document.getElementById("productDetail");
    container.innerHTML = renderProductDetail(currentProduct);
  }
};

window.changeQuantity = function (delta) {
  const newQuantity = quantity + delta;
  if (newQuantity >= 1 && newQuantity <= 10) {
    quantity = newQuantity;
    updateQuantityUI();
  }
};

window.updateQuantity = function (value) {
  const newQuantity = parseInt(value);
  if (newQuantity >= 1 && newQuantity <= 10) {
    quantity = newQuantity;
    updateQuantityUI();
  }
};

function updateQuantityUI() {
  const quantityInput = document.querySelector('.quantity-input');
  if (quantityInput) quantityInput.value = quantity;
}

window.addToCart = async function () {
  console.log('[addToCart] Called');

  // Prevent duplicate submissions
  if (isAddingToCart) {
    console.log('[addToCart] Already adding to cart, ignoring duplicate call');
    return;
  }

  if (!authService.isAuthenticated()) {
    console.log('[addToCart] User not authenticated');
    showToast('Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng', 'warning');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  if (!selectedVariant) {
    console.log('[addToCart] No variant selected');
    showToast('Vui lòng chọn tùy chọn sản phẩm trước', 'warning');
    return;
  }

  isAddingToCart = true;

  console.log('[addToCart] Adding to cart:', {
    productId: currentProduct.id,
    productName: currentProduct.name,
    variantId: selectedVariant.id,
    variantSize: selectedVariant.size,
    variantColor: selectedVariant.color,
    quantity
  });

  const button = document.querySelector('.add-to-cart-btn');
  const originalText = button.innerHTML;
  const originalWidth = button.offsetWidth;

  button.disabled = true;
  button.style.width = `${originalWidth}px`;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

  try {
    console.log('[addToCart] Calling cartService.addItem...');
    await cartService.addItem(currentProduct.id, selectedVariant.id, quantity);
    console.log('[addToCart] Item added successfully');

    console.log('[addToCart] Updating cart count...');
    await updateCartCount();
    showToast('Đã thêm vào giỏ hàng!', 'success');

    // Update button with success state
    button.innerHTML = '<i class="bi bi-check2 me-2"></i>Đã Thêm!';

    // Reset button after delay
    setTimeout(() => {
      console.log('[addToCart] Resetting button');
      button.innerHTML = originalText;
      button.disabled = false;
      button.style.width = '';
      isAddingToCart = false;
    }, 2000);

  } catch (error) {
    console.error('[addToCart] Error:', error);
    showToast(error.message || 'Không thể thêm vào giỏ hàng. Vui lòng thử lại.', 'danger');
    button.disabled = false;
    button.innerHTML = originalText;
    button.style.width = '';
    isAddingToCart = false;
  }
};

window.toggleWishlist = async function () {
  if (!authService.isAuthenticated()) {
    showToast('Vui lòng đăng nhập để sử dụng danh sách yêu thích', 'warning');
    return;
  }

  const button = document.querySelector('.btn-wishlist');
  const icon = button.querySelector('i');

  try {
    if (isInWishlist) {
      await wishlistService.removeItem(wishlistItemId);
      isInWishlist = false;
      wishlistItemId = null;
      button.classList.remove('active');
      icon.classList.replace('bi-heart-fill', 'bi-heart');
      button.innerHTML = '<i class="bi bi-heart me-2"></i>Thêm Vào Yêu Thích';
      showToast('Đã xóa khỏi danh sách yêu thích', 'info');
    } else {
      const result = await wishlistService.addItem(currentProduct.id);
      isInWishlist = true;
      wishlistItemId = result.id;
      button.classList.add('active');
      icon.classList.replace('bi-heart', 'bi-heart-fill');
      button.innerHTML = '<i class="bi bi-heart-fill me-2"></i>Trong Danh Sách';
      showToast('Đã thêm vào danh sách yêu thích!', 'success');
    }
  } catch (error) {
    console.error('Failed to toggle wishlist:', error);
    showToast('Không thể cập nhật danh sách yêu thích', 'danger');
  }
};

// Check wishlist status
async function checkWishlistStatus(productId) {
  if (!authService.isAuthenticated()) return;

  try {
    const wishlist = await wishlistService.getWishlist();
    const item = wishlist.find((w) => w.product_id === productId);
    if (item) {
      isInWishlist = true;
      wishlistItemId = item.id;
    }
  } catch (error) {
    console.error("Failed to check wishlist status:", error);
  }
}

// Load related products
async function loadRelatedProducts() {
  if (!currentProduct || !currentProduct.category_id) return;

  try {
    const { products } = await productService.getProducts({
      category_id: currentProduct.category_id,
      limit: 4,
    });

    // Filter out current product
    const relatedProducts = products.filter(p => p.id !== currentProduct.id).slice(0, 4);

    if (relatedProducts.length === 0) return;

    const relatedSection = `
      <div class="row mt-5 pt-5 border-top">
        <div class="col-12">
          <h3 class="h4 mb-4">You Might Also Like</h3>
        </div>
        ${relatedProducts.map(product => {
          const discount = calculateDiscount(product.base_price, product.compare_price);
          const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
          const isInStock = productService.isInStock(product);

          return `
            <div class="col-md-6 col-lg-3">
              <div class="card border-0 shadow-sm h-100">
                <div class="position-relative">
                  ${discount > 0 ? `<span class="position-absolute top-0 start-0 m-2 badge bg-danger">-${discount}%</span>` : ""}
                  ${!isInStock ? `<div class="position-absolute bottom-0 start-0 end-0 bg-secondary bg-opacity-75 text-white text-center py-1 small">Out of Stock</div>` : ""}
                  <a href="/product-detail.html?id=${product.id}">
                    <img src="${primaryImage?.url || product.featured_image_url || '/images/placeholder-user.jpg'}"
                         class="card-img-top" alt="${product.name}" style="height: 250px; object-fit: cover;">
                  </a>
                </div>
                <div class="card-body">
                  <h6 class="card-title">
                    <a href="/product-detail.html?id=${product.id}" class="text-decoration-none text-dark">${product.name}</a>
                  </h6>
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="fw-bold">${productService.formatPrice(product.base_price)}</span>
                      ${product.compare_price ? `<span class="text-muted text-decoration-line-through small ms-1">${productService.formatPrice(product.compare_price)}</span>` : ""}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    const container = document.getElementById('productDetail').parentElement;
    container.insertAdjacentHTML('beforeend', relatedSection);
  } catch (error) {
    console.error("Failed to load related products:", error);
  }
}

function showToast(message, type = 'info') {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.id = 'toastContainer';
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    toastContainer.style.zIndex = '1055';
    document.body.appendChild(toastContainer);
  }

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : type === 'danger' ? 'bg-danger' : 'bg-info';
  const icon = type === 'success' ? 'bi-check-circle' : type === 'warning' ? 'bi-exclamation-triangle' : type === 'danger' ? 'bi-x-circle' : 'bi-info-circle';

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
  const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
  bsToast.show();

  toast.addEventListener("hidden.bs.toast", () => {
    toast.remove();
  });
}

// =============================================
// REVIEWS FUNCTIONALITY
// =============================================

// Load reviews for the current product
async function loadReviews(productId) {
  const container = document.getElementById('reviewsContainer');
  if (!container) return;

  try {
    const data = await reviewService.getProductReviews(productId, 1, 10);
    currentReviews = data;

    container.innerHTML = renderReviewsSection(data);
  } catch (error) {
    console.error('Failed to load reviews:', error);
    container.innerHTML = `
      <div class="alert alert-danger">
        Failed to load reviews. Please try again later.
      </div>
    `;
  }
}

// Render the entire reviews section
function renderReviewsSection(data) {
  const { reviews, stats } = data;
  const hasReviews = reviews && reviews.length > 0;

  return `
    <div class="row">
      <!-- Reviews Summary -->
      <div class="col-lg-4 mb-4 mb-lg-0">
        ${renderReviewsSummary(stats)}
      </div>

      <!-- Reviews List -->
      <div class="col-lg-8">
        ${renderReviewsList(reviews, stats)}
      </div>
    </div>
  `;
}

// Render reviews summary sidebar
function renderReviewsSummary(stats) {
  const { averageRating, totalReviews, ratingDistribution } = stats;

  return `
    <div class="reviews-summary card border-0 shadow-sm p-4">
      <div class="text-center mb-4">
        <div class="display-4 fw-light mb-2">${averageRating.toFixed(1)}</div>
        <div class="mb-2">
          ${reviewService.renderStars(averageRating)}
        </div>
        <div class="text-muted small">Based on ${totalReviews} ${totalReviews === 1 ? 'review' : 'reviews'}</div>
      </div>

      <!-- Rating Distribution -->
      <div class="rating-distribution mb-4">
        ${[5, 4, 3, 2, 1].map(rating => {
          const count = ratingDistribution[rating] || 0;
          const percentage = totalReviews > 0 ? (count / totalReviews * 100) : 0;
          return `
            <div class="d-flex align-items-center mb-2 small">
              <span class="me-2" style="min-width: 60px;">${rating} stars</span>
              <div class="progress flex-grow-1" style="height: 8px;">
                <div class="progress-bar bg-warning" role="progressbar"
                     style="width: ${percentage}%"
                     aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <span class="ms-2 text-muted" style="min-width: 35px;">${count}</span>
            </div>
          `;
        }).join('')}
      </div>

      <!-- Write Review Button -->
      ${authService.isAuthenticated() ? `
        <button class="btn btn-dark w-100" onclick="window.openReviewModal()">
          <i class="bi bi-pencil-square me-2"></i>Write a Review
        </button>
      ` : `
        <a href="/login.html?redirect=${encodeURIComponent(window.location.href)}"
           class="btn btn-dark w-100">
          <i class="bi bi-pencil-square me-2"></i>Sign in to Write a Review
        </a>
      `}
    </div>
  `;
}

// Render list of reviews
function renderReviewsList(reviews, stats) {
  if (!reviews || reviews.length === 0) {
    return `
      <div class="text-center py-5">
        <i class="bi bi-chat-quote display-1 text-muted mb-3"></i>
        <h5 class="text-muted">No reviews yet</h5>
        <p class="text-muted">Be the first to share your experience!</p>
      </div>
    `;
  }

  return `
    <div class="reviews-list">
      ${reviews.map(review => renderReviewCard(review)).join('')}
    </div>
  `;
}

// Render a single review card
function renderReviewCard(review) {
  const userName = review.user
    ? `${review.user.first_name || ''} ${review.user.last_name || ''}`.trim() || 'Anonymous'
    : 'Anonymous';
  const userInitials = review.user
    ? reviewService.getInitials(review.user.first_name, review.user.last_name)
    : '??';
  const avatarUrl = review.user?.avatar_url;

  return `
    <div class="review-card card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="d-flex align-items-start mb-3">
          <!-- Avatar -->
          <div class="review-avatar me-3">
            ${avatarUrl ? `
              <img src="${avatarUrl}" alt="${userName}" class="rounded-circle"
                   style="width: 48px; height: 48px; object-fit: cover;">
            ` : `
              <div class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                   style="width: 48px; height: 48px; background-color: var(--color-accent); color: white; font-weight: 500;">
                ${userInitials}
              </div>
            `}
          </div>

          <!-- Review Header -->
          <div class="flex-grow-1">
            <div class="d-flex justify-content-between align-items-start mb-2">
              <div>
                <h6 class="mb-1">${userName}</h6>
                <div class="mb-1">
                  ${reviewService.renderStars(review.rating)}
                </div>
              </div>
              <span class="text-muted small">${reviewService.formatDate(review.created_at)}</span>
            </div>

            ${review.is_verified_purchase ? `
              <span class="badge bg-success-subtle text-success small mb-2">
                <i class="bi bi-patch-check-fill me-1"></i>Verified Purchase
              </span>
            ` : ''}

            <!-- Review Title -->
            ${review.title ? `
              <h6 class="fw-semibold mb-2">${review.title}</h6>
            ` : ''}

            <!-- Review Text -->
            ${review.review ? `
              <p class="mb-3">${review.review}</p>
            ` : ''}

            <!-- Review Actions -->
            <div class="d-flex gap-3 align-items-center">
              <button class="btn btn-sm btn-link text-muted p-0 text-decoration-none"
                      onclick="window.markReviewHelpful('${review.id}')">
                <i class="bi bi-hand-thumbs-up me-1"></i>
                Helpful ${review.helpful_count > 0 ? `(${review.helpful_count})` : ''}
              </button>

              ${authService.isAuthenticated() && authService.user?.id === review.user_id ? `
                <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                        onclick="window.deleteReview('${review.id}')">
                  <i class="bi bi-trash me-1"></i>Delete
                </button>
              ` : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialize review modal
function initializeReviewModal() {
  const modalEl = document.getElementById('reviewModal');
  if (!modalEl) return;

  reviewModal = new bootstrap.Modal(modalEl);

  // Setup rating input
  const ratingStars = document.querySelectorAll('.rating-star');
  ratingStars.forEach(star => {
    star.addEventListener('click', () => {
      const rating = parseInt(star.dataset.rating);
      setRating(rating);
    });

    star.addEventListener('mouseenter', () => {
      const rating = parseInt(star.dataset.rating);
      highlightStars(rating);
    });
  });

  document.getElementById('ratingInput').addEventListener('mouseleave', () => {
    highlightStars(selectedRating);
  });

  // Setup form submission
  document.getElementById('submitReviewBtn').addEventListener('click', submitReview);

  // Reset form when modal is closed
  modalEl.addEventListener('hidden.bs.modal', () => {
    resetReviewForm();
  });
}

// Set rating value
function setRating(rating) {
  selectedRating = rating;
  document.getElementById('ratingValue').value = rating;
  highlightStars(rating);
}

// Highlight stars up to rating
function highlightStars(rating) {
  const stars = document.querySelectorAll('.rating-star');
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.remove('bi-star');
      star.classList.add('bi-star-fill', 'text-warning');
    } else {
      star.classList.remove('bi-star-fill', 'text-warning');
      star.classList.add('bi-star');
    }
  });
}

// Open review modal
window.openReviewModal = async function() {
  if (!authService.isAuthenticated()) {
    showToast('Vui lòng đăng nhập để viết đánh giá', 'warning');
    setTimeout(() => {
      window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  // Check if user can review
  try {
    const eligibility = await reviewService.checkReviewEligibility(currentProduct.id);
    if (!eligibility.canReview) {
      showToast(eligibility.reason || 'Bạn không thể đánh giá sản phẩm này', 'warning');
      return;
    }

    reviewModal.show();
  } catch (error) {
    console.error('Error checking review eligibility:', error);
    showToast('Không thể kiểm tra điều kiện đánh giá', 'danger');
  }
};

// Submit review
async function submitReview() {
  const rating = parseInt(document.getElementById('ratingValue').value);
  const title = document.getElementById('reviewTitle').value.trim();
  const reviewText = document.getElementById('reviewText').value.trim();

  if (!rating || rating < 1 || rating > 5) {
    showToast('Vui lòng chọn số sao đánh giá', 'warning');
    return;
  }

  const submitBtn = document.getElementById('submitReviewBtn');
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

  try {
    await reviewService.createReview(currentProduct.id, rating, title, reviewText);

    showToast('Đã gửi đánh giá thành công!', 'success');
    reviewModal.hide();
    resetReviewForm();

    // Reload reviews
    await loadReviews(currentProduct.id);
  } catch (error) {
    console.error('Error submitting review:', error);
    showToast(error.message || 'Không thể gửi đánh giá', 'danger');
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Reset review form
function resetReviewForm() {
  document.getElementById('reviewForm').reset();
  document.getElementById('ratingValue').value = '';
  selectedRating = 0;
  highlightStars(0);
}

// Mark review as helpful
window.markReviewHelpful = async function(reviewId) {
  try {
    await reviewService.markHelpful(reviewId);
    showToast('Cảm ơn phản hồi của bạn!', 'success');

    // Reload reviews to show updated count
    await loadReviews(currentProduct.id);
  } catch (error) {
    console.error('Error marking review as helpful:', error);
    showToast('Không thể đánh dấu đánh giá hữu ích', 'danger');
  }
};

// Delete review
window.deleteReview = async function(reviewId) {
  const confirmed = await Dialog.confirm(
    'Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.',
    {
      title: 'Xóa Đánh Giá',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      confirmClass: 'btn-danger'
    }
  );

  if (!confirmed) {
    return;
  }

  try {
    await reviewService.deleteReview(reviewId);
    showToast('Đã xóa đánh giá thành công', 'success');

    // Reload reviews
    await loadReviews(currentProduct.id);
  } catch (error) {
    console.error('Error deleting review:', error);
    showToast('Không thể xóa đánh giá', 'danger');
  }
};
