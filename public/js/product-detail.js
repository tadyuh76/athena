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
let currentProduct = null;
let selectedVariant = null;
let quantity = 1;
let isInWishlist = false;
let wishlistItemId = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeNavigation();
    
    const productId = getProductIdFromUrl();
    
    if (productId) {
      try {
        await loadProduct(productId);
      } catch (error) {
        console.error("Failed to load product:", error);
      }
      
      try {
        await checkWishlistStatus(productId);
      } catch (error) {
        console.error("Failed to check wishlist status:", error);
      }
      
      try {
        await loadRelatedProducts();
      } catch (error) {
        console.error("Failed to load related products:", error);
      }
    } else {
      window.location.href = "/products.html";
    }
  } catch (error) {
    console.error("Failed to initialize product detail page:", error);
  }
});

// Get product ID from URL
function getProductIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("id");
}

// Initialize navigation
async function initializeNavigation() {
  const authSection = document.querySelector(".navbar .auth-section");
  if (!authSection) return;

  if (authService.isAuthenticated()) {
    const user = authService.getCurrentUser();
    authSection.innerHTML = `
      <div class="dropdown">
        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" role="button" data-bs-toggle="dropdown">
          <img src="/images/placeholder-user.jpg" alt="Profile" class="profile-avatar me-2">
          <span class="d-none d-md-inline">${user.first_name || user.email}</span>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><h6 class="dropdown-header">${user.first_name || user.email}</h6></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="/account.html"><i class="bi bi-person me-2"></i>My Account</a></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-bag me-2"></i>My Orders</a></li>
          <li><a class="dropdown-item" href="#"><i class="bi bi-heart me-2"></i>Wishlist</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Sign Out</a></li>
        </ul>
      </div>
    `;

    document.getElementById("logoutBtn")?.addEventListener("click", async (e) => {
      e.preventDefault();
      await authService.logout();
    });
  } else if (authSection) {
    authSection.innerHTML = `
      <div class="nav-item">
        <a class="nav-link" href="/login.html">Sign In</a>
      </div>
      <div class="nav-item">
        <a class="nav-link btn btn-outline-dark ms-2" href="/register.html">Sign Up</a>
      </div>
    `;
  }

  await updateCartCount();
}

// Update cart count
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

// Helper functions
function formatPrice(price) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(price);
}

function calculateDiscount(price, comparePrice) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function getAvailableStock(variant) {
  return Math.max(0, (variant.inventory_quantity || 0) - (variant.reserved_quantity || 0));
}

function getStockStatus(product) {
  if (!product.variants || product.variants.length === 0) return 'in-stock';
  
  const totalStock = product.variants.reduce((total, variant) => 
    total + getAvailableStock(variant), 0
  );
  
  if (totalStock === 0) return 'out-of-stock';
  if (totalStock <= 5) return 'low-stock';
  return 'in-stock';
}

function renderProductDetail(product) {
  currentProduct = product;
  
  // Set default variant
  if (product.variants && product.variants.length > 0) {
    selectedVariant = product.variants.find(v => v.is_default) || product.variants[0];
  }
  
  const discount = calculateDiscount(product.base_price, product.compare_price);
  const stockStatus = getStockStatus(product);
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  
  return `
    <!-- Image Gallery -->
    <div class="col-lg-6">
      <div class="product-gallery">
        ${renderImageGallery(product.images, primaryImage)}
      </div>
    </div>

    <!-- Product Info -->
    <div class="col-lg-6">
      <div class="product-info">
        <!-- Product Header -->
        <div class="product-header">
          <p class="collection-name">${product.collection?.name ? product.collection.name.toUpperCase() : 'THE WHITE SPACE EDIT'}</p>
          <h1 class="product-title">${product.name}</h1>
          <p class="product-price">$${product.base_price}</p>
          <p class="product-description">
            ${product.short_description || product.description || 'A precision-cut silhouette that skims the body with effortless structure. Crafted in certified organic sateen with a soft, weightless drape.'}
          </p>
        </div>

        <!-- Size Selection -->
        ${renderSizeSelection(product.variants)}

        <!-- Add to Cart -->
        <div class="add-to-cart-section">
          <button class="btn btn-dark btn-lg w-100 add-to-cart-btn" onclick="addToCart()" ${stockStatus === 'out-of-stock' ? 'disabled' : ''}>
            ${stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
          </button>
          <p class="shipping-note">Free shipping on orders over $200</p>
        </div>

        <!-- The Craft -->
        <div class="product-section">
          <h3 class="section-label">The Craft</h3>
          <ul class="detail-list">
            <li><span class="dash">—</span> Architectural lines with fluid movement</li>
            <li><span class="dash">—</span> Hand-finished seams</li>
            <li><span class="dash">—</span> Reinforced hems</li>
            <li><span class="dash">—</span> Precision drape</li>
            <li><span class="dash">—</span> Seasonless design</li>
          </ul>
        </div>

        <!-- Material -->
        <div class="product-section">
          <h3 class="section-label">Material</h3>
          <div class="material-info">
            <p>${product.material || '100% Organic Cotton'}</p>
            <div class="certification-badges">
              <span class="badge-cert">GOTS Certified</span>
              <span class="badge-cert">OEKO-TEX Standard 100</span>
            </div>
          </div>
        </div>

        <!-- Care Instructions -->
        <div class="product-section">
          <h3 class="section-label">Care Instructions</h3>
          <p class="care-text">
            ${product.care_instructions || 'Machine wash cold with like colors. Hang dry. Low iron if needed. Do not bleach.'}
          </p>
        </div>

        <!-- Sustainability -->
        <div class="product-section sustainability-section">
          <h3 class="section-label">Sustainability</h3>
          <div class="sustainability-grid">
            <div class="sustainability-item">
              <i class="bi bi-droplet sustainability-icon"></i>
              <div>
                <p class="sustainability-title">Water Conservation</p>
                <p class="sustainability-desc">
                  Closed-loop water system reduces consumption by 90%
                </p>
              </div>
            </div>
            <div class="sustainability-item">
              <i class="bi bi-flower1 sustainability-icon"></i>
              <div>
                <p class="sustainability-title">Natural Dyes</p>
                <p class="sustainability-desc">Low-impact natural dyes</p>
              </div>
            </div>
            <div class="sustainability-item">
              <i class="bi bi-recycle sustainability-icon"></i>
              <div>
                <p class="sustainability-title">Ethical Production</p>
                <p class="sustainability-desc">
                  Small-batch production in ethical factories
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderImageGallery(images, primaryImage) {
  if (!images || images.length === 0) {
    return `
      <div class="gallery-item">
        <img
          src="${primaryImage?.url || '/images/minimal-white-column-dress-front-view-architectura.jpg'}"
          alt="Product view"
          class="img-fluid"
        />
      </div>
    `;
  }
  
  return images.map((image, index) => `
    <div class="gallery-item">
      <img
        src="${image.url}"
        alt="${image.alt_text || `Product view ${index + 1}`}"
        class="img-fluid"
      />
    </div>
  `).join('');
}

function renderSizeSelection(variants) {
  if (!variants || variants.length === 0) {
    return `
      <div class="size-selection">
        <label class="section-label">Select Size</label>
        <div class="size-grid">
          <button class="size-btn" onclick="selectSize('XS')">XS</button>
          <button class="size-btn" onclick="selectSize('S')">S</button>
          <button class="size-btn" onclick="selectSize('M')">M</button>
          <button class="size-btn" onclick="selectSize('L')">L</button>
          <button class="size-btn" onclick="selectSize('XL')">XL</button>
        </div>
      </div>
    `;
  }
  
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  
  if (sizes.length === 0) {
    return '';
  }
  
  return `
    <div class="size-selection">
      <label class="section-label">Select Size</label>
      <div class="size-grid">
        ${sizes.map(size => {
          const variant = variants.find(v => v.size === size);
          const isSelected = selectedVariant?.size === size;
          const isAvailable = getAvailableStock(variant) > 0;
          return `
            <button class="size-btn ${isSelected ? 'active' : ''}" 
                    onclick="selectSize('${size}')" 
                    ${!isAvailable ? 'disabled' : ''}>
              ${size}
            </button>
          `;
        }).join('')}
      </div>
    </div>
  `;
}

function renderStarRating(rating) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  return `
    ${'<i class="bi bi-star-fill"></i>'.repeat(fullStars)}
    ${hasHalfStar ? '<i class="bi bi-star-half"></i>' : ''}
    ${'<i class="bi bi-star"></i>'.repeat(emptyStars)}
  `;
}

function renderVariantSelectors(variants) {
  if (!variants || variants.length === 0) return '';
  
  const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];
  const colors = [...new Set(variants.map(v => v.color).filter(Boolean))];
  
  let html = '';
  
  if (sizes.length > 0) {
    html += `
      <div class="variant-section">
        <div class="variant-label">
          <i class="bi bi-rulers"></i>
          Size: ${selectedVariant?.size || 'Select Size'}
        </div>
        <div class="variant-options">
          ${sizes.map(size => {
            const variant = variants.find(v => v.size === size);
            const isSelected = selectedVariant?.size === size;
            const isAvailable = getAvailableStock(variant) > 0;
            return `
              <div class="variant-option ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}" 
                   onclick="${isAvailable ? `selectVariant('size', '${size}')` : ''}">
                ${size}
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  if (colors.length > 0) {
    html += `
      <div class="variant-section">
        <div class="variant-label">
          <i class="bi bi-palette"></i>
          Color: ${selectedVariant?.color || 'Select Color'}
        </div>
        <div class="variant-options">
          ${colors.map(color => {
            const variant = variants.find(v => v.color === color);
            const isSelected = selectedVariant?.color === color;
            const isAvailable = getAvailableStock(variant) > 0;
            return `
              <div class="variant-option color-variant ${isSelected ? 'selected' : ''} ${!isAvailable ? 'disabled' : ''}" 
                   style="background-color: ${variant?.color_hex || '#ccc'}"
                   onclick="${isAvailable ? `selectVariant('color', '${color}')` : ''}"
                   title="${color}">
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;
  }
  
  return html;
}

function renderMaterialComposition(composition) {
  if (!composition) return 'Material composition information not available.';
  
  if (typeof composition === 'object') {
    return Object.entries(composition)
      .map(([material, percentage]) => `${material}: ${percentage}%`)
      .join(', ');
  }
  
  return composition;
}

// Load product
async function loadProduct(productId) {
  const container = document.getElementById("productDetail");
  container.innerHTML = `
    <div class="loading-container">
      <div class="spinner-border text-secondary" role="status">
        <span class="visually-hidden">Loading...</span>
      </div>
      <div class="loading-text">Loading product details...</div>
    </div>
  `;

  try {
    currentProduct = await productService.getProductById(productId);
    
    if (!currentProduct) {
      throw new Error("Product not found");
    }

    // Update breadcrumb
    const breadcrumbProduct = document.getElementById("breadcrumbProduct");
    const breadcrumbCollection = document.getElementById("breadcrumbCollection");
    
    if (breadcrumbProduct) {
      breadcrumbProduct.textContent = currentProduct.name;
    }
    
    if (breadcrumbCollection && currentProduct.collection?.name) {
      breadcrumbCollection.textContent = currentProduct.collection.name.toUpperCase();
    }

    // Render beautiful product detail
    container.innerHTML = renderProductDetail(currentProduct);

  } catch (error) {
    console.error("Failed to load product:", error);
    container.innerHTML = `
      <div class="col-12 text-center py-5">
        <div class="alert alert-danger">
          <h4>Product Not Found</h4>
          <p>The product you're looking for doesn't exist or has been removed.</p>
          <a href="/products.html" class="btn btn-primary">Browse Products</a>
        </div>
      </div>
    `;
  }
}

// Interactive functions
window.changeMainImage = function(imageUrl, index) {
  const mainImage = document.getElementById('mainProductImage');
  if (mainImage) {
    mainImage.src = imageUrl;
  }
  
  // Update active thumbnail
  document.querySelectorAll('.product-thumbnail').forEach((thumb, i) => {
    thumb.classList.toggle('active', i === index);
  });
};

window.selectSize = function(size) {
  if (!currentProduct || !currentProduct.variants) return;
  
  // Find variant that matches the size
  const targetVariant = currentProduct.variants.find(v => v.size === size);
  
  if (targetVariant) {
    selectedVariant = targetVariant;
    // Re-render the product to update the UI
    const container = document.getElementById("productDetail");
    container.innerHTML = renderProductDetail(currentProduct);
  }
  
  // Also update size button states
  document.querySelectorAll('.size-btn').forEach(btn => {
    btn.classList.remove('active');
    if (btn.textContent === size) {
      btn.classList.add('active');
    }
  });
};

window.selectVariant = function(type, value) {
  if (!currentProduct || !currentProduct.variants) return;
  
  // Find variant that matches the selection
  let targetVariant;
  if (type === 'size') {
    targetVariant = currentProduct.variants.find(v => v.size === value && v.color === selectedVariant?.color) ||
                   currentProduct.variants.find(v => v.size === value);
  } else if (type === 'color') {
    targetVariant = currentProduct.variants.find(v => v.color === value && v.size === selectedVariant?.size) ||
                   currentProduct.variants.find(v => v.color === value);
  }
  
  if (targetVariant) {
    selectedVariant = targetVariant;
    // Re-render the product to update the UI
    const container = document.getElementById("productDetail");
    container.innerHTML = renderProductDetail(currentProduct);
  }
};

window.changeQuantity = function(delta) {
  const newQuantity = quantity + delta;
  if (newQuantity >= 1 && newQuantity <= 10) {
    quantity = newQuantity;
    updateQuantityUI();
  }
};

window.updateQuantity = function(value) {
  const newQuantity = parseInt(value);
  if (newQuantity >= 1 && newQuantity <= 10) {
    quantity = newQuantity;
    updateQuantityUI();
  }
};

function updateQuantityUI() {
  const quantityInput = document.querySelector('.quantity-input');
  const decreaseBtn = document.querySelector('.quantity-btn:first-child');
  const increaseBtn = document.querySelector('.quantity-btn:last-child');
  
  if (quantityInput) quantityInput.value = quantity;
  if (decreaseBtn) decreaseBtn.disabled = quantity <= 1;
  if (increaseBtn) increaseBtn.disabled = quantity >= 10;
}

window.addToCart = async function() {
  // Check if user is authenticated
  if (!authService.isAuthenticated()) {
    showToast('Please sign in to add items to cart', 'warning');
    // Redirect to login after a short delay
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 1500);
    return;
  }

  if (!selectedVariant) {
    showToast('Please select a size first', 'warning');
    return;
  }
  
  const button = document.querySelector('.add-to-cart-btn');
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';
  
  try {
    await cartService.addItem(currentProduct.id, selectedVariant.id, quantity);
    await updateCartCount();
    showToast('Added to cart!', 'success');
    
    // Update button with success state
    button.classList.add('success');
    button.innerHTML = '<i class="bi bi-check me-2"></i>Added to Cart';
    
    // Reset button after delay
    setTimeout(() => {
      button.classList.remove('success');
      button.innerHTML = originalText;
      button.disabled = false;
    }, 2000);
    
  } catch (error) {
    console.error('Failed to add to cart:', error);
    showToast('Failed to add to cart. Please try again.', 'danger');
    button.disabled = false;
    button.innerHTML = originalText;
  }
};

window.toggleWishlist = async function() {
  if (!authService.isAuthenticated()) {
    showToast('Please sign in to use wishlist', 'warning');
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
      button.innerHTML = '<i class="bi bi-heart me-2"></i>Add to Wishlist';
      showToast('Removed from wishlist', 'info');
    } else {
      const result = await wishlistService.addItem(currentProduct.id);
      isInWishlist = true;
      wishlistItemId = result.id;
      button.classList.add('active');
      icon.classList.replace('bi-heart', 'bi-heart-fill');
      button.innerHTML = '<i class="bi bi-heart-fill me-2"></i>In Wishlist';
      showToast('Added to wishlist!', 'success');
    }
  } catch (error) {
    console.error('Failed to toggle wishlist:', error);
    showToast('Failed to update wishlist', 'danger');
  }
};

window.shareProduct = function() {
  if (navigator.share && currentProduct) {
    navigator.share({
      title: currentProduct.name,
      text: currentProduct.short_description,
      url: window.location.href
    }).catch(console.error);
  } else {
    // Fallback: copy URL to clipboard
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Product URL copied to clipboard!', 'info');
    }).catch(() => {
      showToast('Unable to share product', 'warning');
    });
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
      <div class="related-products">
        <div class="container">
          <h3>You Might Also Like</h3>
          <div class="row g-4">
            ${relatedProducts.map(product => {
              const discount = calculateDiscount(product.base_price, product.compare_price);
              const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
              
              return `
                <div class="col-md-6 col-lg-3">
                  <div class="card related-product-card h-100">
                    ${discount > 0 ? `<span class="discount-badge">-${discount}%</span>` : ''}
                    <img src="${primaryImage?.url || product.featured_image_url || '/images/placeholder-user.jpg'}" 
                         class="card-img-top" alt="${product.name}">
                    <div class="card-body d-flex flex-column">
                      <h6 class="card-title">${product.name}</h6>
                      <div class="mt-auto">
                        <div class="d-flex justify-content-between align-items-center mb-2">
                          <div>
                            <span class="product-price">${formatPrice(product.base_price)}</span>
                            ${product.compare_price ? `<span class="product-compare-price">${formatPrice(product.compare_price)}</span>` : ''}
                          </div>
                        </div>
                        <a href="/product-detail.html?id=${product.id}" class="btn btn-outline-dark btn-sm w-100">
                          View Details
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;

    document.querySelector('.product-tabs').insertAdjacentHTML('afterend', relatedSection);
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
  
  const toastHTML = `
    <div class="toast align-items-center text-white ${bgClass} border-0 shadow-lg" 
         id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center">
          <i class="bi ${icon} me-2"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  if (window.bootstrap) {
    const toast = new bootstrap.Toast(toastElement, { delay: 4000 });
    toast.show();
    
    toastElement.addEventListener('hidden.bs.toast', () => {
      toastElement.remove();
    });
  } else {
    // Fallback without Bootstrap
    toastElement.style.display = 'block';
    setTimeout(() => {
      toastElement.style.opacity = '0';
      setTimeout(() => toastElement.remove(), 300);
    }, 4000);
  }
}
