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
    <div class="product-detail-section">
      <div class="container">
        <div class="row g-4">
          <!-- Product Images -->
          <div class="col-lg-7">
            <div class="product-image-gallery fade-in-up">
              <div class="main-image-container">
                <img src="${primaryImage?.url || product.featured_image_url || '/images/placeholder-user.jpg'}" 
                     alt="${product.name}" 
                     class="product-main-image" 
                     id="mainProductImage">
                ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
              </div>
              ${renderThumbnailGallery(product.images)}
            </div>
          </div>
          
          <!-- Product Information -->
          <div class="col-lg-5">
            <div class="product-info slide-in-right">
              <div class="product-category">${product.category?.name || 'Product'}</div>
              <h1 class="product-title">${product.name}</h1>
              
              <!-- Rating Section -->
              <div class="product-rating-section">
                <div class="product-rating">
                  ${renderStarRating(product.rating || 0)}
                </div>
                <div class="rating-count">(${product.review_count || 0} reviews)</div>
              </div>
              
              <!-- Price Section -->
              <div class="product-price-section">
                <div class="d-flex align-items-baseline">
                  <span class="product-price">${formatPrice(product.base_price)}</span>
                  ${product.compare_price ? `<span class="product-compare-price">${formatPrice(product.compare_price)}</span>` : ''}
                </div>
                ${discount > 0 ? `<div class="discount-badge">Save ${discount}%</div>` : ''}
              </div>
              
              <!-- Description -->
              <div class="product-description">
                ${product.short_description || product.description || 'No description available.'}
              </div>
              
              <!-- Variants -->
              ${renderVariantSelectors(product.variants)}
              
              <!-- Stock Status -->
              <div class="stock-status ${stockStatus}">
                <i class="bi bi-${stockStatus === 'in-stock' ? 'check-circle' : stockStatus === 'low-stock' ? 'exclamation-triangle' : 'x-circle'}"></i>
                ${stockStatus === 'in-stock' ? 'In Stock' : stockStatus === 'low-stock' ? 'Low Stock' : 'Out of Stock'}
              </div>
              
              <!-- Quantity Selector -->
              <div class="quantity-section">
                <div class="quantity-selector">
                  <div class="quantity-label">Quantity:</div>
                  <div class="quantity-controls">
                    <button class="quantity-btn" onclick="changeQuantity(-1)" ${quantity <= 1 ? 'disabled' : ''}>-</button>
                    <input type="number" class="quantity-input" value="${quantity}" min="1" max="10" onchange="updateQuantity(this.value)">
                    <button class="quantity-btn" onclick="changeQuantity(1)" ${quantity >= 10 ? 'disabled' : ''}>+</button>
                  </div>
                </div>
              </div>
              
              <!-- Action Buttons -->
              <div class="action-buttons">
                <button class="btn btn-add-to-cart" onclick="addToCart()" ${stockStatus === 'out-of-stock' ? 'disabled' : ''}>
                  <i class="bi bi-bag-plus me-2"></i>
                  ${stockStatus === 'out-of-stock' ? 'Out of Stock' : 'Add to Cart'}
                </button>
                
                <div class="secondary-actions">
                  <button class="btn btn-wishlist ${isInWishlist ? 'active' : ''}" onclick="toggleWishlist()">
                    <i class="bi bi-heart${isInWishlist ? '-fill' : ''} me-2"></i>
                    ${isInWishlist ? 'In Wishlist' : 'Add to Wishlist'}
                  </button>
                  <button class="btn btn-share" onclick="shareProduct()">
                    <i class="bi bi-share me-2"></i>
                    Share
                  </button>
                </div>
              </div>
              
              <!-- Product Features -->
              <div class="product-features">
                <h5>Key Features</h5>
                <ul class="feature-list">
                  <li><i class="bi bi-shield-check"></i> Premium Quality Materials</li>
                  <li><i class="bi bi-truck"></i> Free Shipping Over $150</li>
                  <li><i class="bi bi-arrow-repeat"></i> 30-Day Return Policy</li>
                  <li><i class="bi bi-award"></i> Sustainable & Ethical Production</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Product Tabs -->
    <div class="product-tabs">
      <div class="container">
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button class="nav-link active" data-bs-toggle="tab" data-bs-target="#details" type="button">
              Details
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#materials" type="button">
              Materials & Care
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#sustainability" type="button">
              Sustainability
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button class="nav-link" data-bs-toggle="tab" data-bs-target="#shipping" type="button">
              Shipping
            </button>
          </li>
        </ul>
        
        <div class="tab-content">
          <div class="tab-pane fade show active" id="details">
            <h5>Product Details</h5>
            <p>${product.description || 'Detailed product information will be available soon.'}</p>
            <h6>Specifications</h6>
            <ul>
              <li><strong>SKU:</strong> ${product.sku}</li>
              <li><strong>Weight:</strong> ${product.weight_value || 'N/A'} ${product.weight_unit || ''}</li>
              <li><strong>Collection:</strong> ${product.collection?.name || 'N/A'}</li>
            </ul>
          </div>
          
          <div class="tab-pane fade" id="materials">
            <h5>Materials & Composition</h5>
            <p>${renderMaterialComposition(product.material_composition)}</p>
            <h6>Care Instructions</h6>
            <p>${product.care_instructions || 'Standard care instructions apply.'}</p>
          </div>
          
          <div class="tab-pane fade" id="sustainability">
            <h5>Our Commitment to Sustainability</h5>
            <p>${product.sustainability_notes || 'We are committed to sustainable and ethical fashion practices.'}</p>
            <h6>Production Method</h6>
            <p>${product.production_method || 'Crafted with care using traditional methods.'}</p>
            ${product.certification_labels ? `
              <h6>Certifications</h6>
              <ul>
                ${product.certification_labels.map(cert => `<li>${cert}</li>`).join('')}
              </ul>
            ` : ''}
          </div>
          
          <div class="tab-pane fade" id="shipping">
            <h5>Shipping Information</h5>
            <ul>
              <li><strong>Free shipping</strong> on orders over $150</li>
              <li><strong>Standard delivery:</strong> 3-5 business days</li>
              <li><strong>Express delivery:</strong> 1-2 business days (additional cost)</li>
              <li><strong>International shipping:</strong> Available to select countries</li>
            </ul>
            <h6>Returns & Exchanges</h6>
            <ul>
              <li>30-day return policy</li>
              <li>Free returns on all orders</li>
              <li>Items must be in original condition</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderThumbnailGallery(images) {
  if (!images || images.length <= 1) return '';
  
  return `
    <div class="product-thumbnail-gallery">
      ${images.map((image, index) => `
        <img src="${image.url}" 
             alt="${image.alt_text || 'Product image'}" 
             class="product-thumbnail ${index === 0 ? 'active' : ''}" 
             onclick="changeMainImage('${image.url}', ${index})">
      `).join('')}
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
    const breadcrumbEl = document.getElementById("breadcrumbProduct");
    if (breadcrumbEl) {
      breadcrumbEl.textContent = currentProduct.name;
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
  if (!selectedVariant) {
    showToast('Please select a variant', 'warning');
    return;
  }
  
  const button = document.querySelector('.btn-add-to-cart');
  const originalText = button.innerHTML;
  
  button.disabled = true;
  button.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';
  
  try {
    await cartService.addItem(currentProduct.id, selectedVariant.id, quantity);
    await updateCartCount();
    showToast('Added to cart!', 'success');
  } catch (error) {
    console.error('Failed to add to cart:', error);
    showToast('Failed to add to cart', 'danger');
  } finally {
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
  const toastContainer = document.getElementById('toastContainer');
  if (!toastContainer) return;

  const toastId = 'toast-' + Date.now();
  const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : type === 'danger' ? 'bg-danger' : 'bg-info';
  
  const toastHTML = `
    <div class="toast align-items-center text-white ${bgClass} border-0" 
         id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;
  
  toastContainer.insertAdjacentHTML('beforeend', toastHTML);
  
  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
  toast.show();
  
  toastElement.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}
