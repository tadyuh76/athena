console.log("product-detail.js: Starting to load...");

import { AuthService } from "/services/AuthService.js";
console.log("product-detail.js: AuthService imported");

import { ProductService } from "/services/ProductService.js";
console.log("product-detail.js: ProductService imported");

import { CartService } from "/services/CartService.js";
console.log("product-detail.js: CartService imported");

import { WishlistService } from "/services/WishlistService.js";
console.log("product-detail.js: WishlistService imported");

// Initialize services
console.log("product-detail.js: Initializing services...");
const authService = new AuthService();
console.log("product-detail.js: AuthService initialized");
const productService = new ProductService();
console.log("product-detail.js: ProductService initialized");
const cartService = new CartService();
console.log("product-detail.js: CartService initialized");
const wishlistService = new WishlistService();
console.log("product-detail.js: WishlistService initialized");

// State
let currentProduct = null;
let selectedVariant = null;
let quantity = 1;
let isInWishlist = false;
let wishlistItemId = null;

// Initialize page
console.log("product-detail.js: Setting up DOMContentLoaded listener");
document.addEventListener("DOMContentLoaded", async () => {
  console.log("product-detail.js: DOMContentLoaded fired");
  try {
    console.log("product-detail.js: Calling initializeNavigation");
    await initializeNavigation();
    console.log("product-detail.js: Navigation initialized");

    const productId = getProductIdFromUrl();
    console.log("product-detail.js: Product ID from URL:", productId);

    if (productId) {
      try {
        console.log(
          "product-detail.js: Calling loadProduct with ID:",
          productId
        );
        await loadProduct(productId);
        console.log("product-detail.js: Product loaded successfully");
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

// Load product
async function loadProduct(productId) {
  console.log("loadProduct: Function called with ID:", productId);
  const container = document.getElementById("productDetail");
  console.log("loadProduct: Container element found:", !!container);
  container.innerHTML = `
        <div class="col-12 loading-container">
            <div class="spinner-border text-secondary" role="status">
                <span class="visually-hidden">Loading...</span>
            </div>
        </div>
    `;

  try {
    console.log("loadProduct: Calling productService.getProductById");
    currentProduct = await productService.getProductById(productId);
    console.log("loadProduct: API response received:", !!currentProduct);

    if (!currentProduct) {
      console.log("loadProduct: Product is null or undefined");
      throw new Error("Product not found");
    }
    console.log("loadProduct: Product name:", currentProduct.name);

    // Update breadcrumb
    const breadcrumbEl = document.getElementById("breadcrumbProduct");
    if (breadcrumbEl) {
      breadcrumbEl.textContent = currentProduct.name;
    }

    // Select default variant
    if (currentProduct.variants && currentProduct.variants.length > 0) {
      selectedVariant =
        currentProduct.variants.find((v) => v.is_default) ||
        currentProduct.variants[0];
    }

    const discount = productService.getDiscountPercentage(
      currentProduct.base_price,
      currentProduct.compare_price
    );
    const images = currentProduct.images || [];
    const primaryImage = images.find((img) => img.is_primary) || images[0];

    container.innerHTML = `
            <!-- Product Images -->
            <div class="col-lg-7">
                <div class="product-images">
                    <div class="main-image-container">
                        ${
                          discount
                            ? `<span class="discount-badge">-${discount}% OFF</span>`
                            : ""
                        }
                        <img id="mainImage" src="${
                          primaryImage?.url ||
                          currentProduct.featured_image_url ||
                          "/images/placeholder-user.jpg"
                        }" 
                             alt="${currentProduct.name}" class="main-image">
                    </div>
                    ${
                      images.length > 1
                        ? `
                        <div class="thumbnail-container">
                            ${images
                              .map(
                                (img, index) => `
                                <img src="${img.url}" 
                                     alt="${currentProduct.name} ${index + 1}" 
                                     class="thumbnail ${
                                       index === 0 ? "active" : ""
                                     }"
                                     onclick="changeMainImage('${
                                       img.url
                                     }', this)">
                            `
                              )
                              .join("")}
                        </div>
                    `
                        : ""
                    }
                </div>
            </div>
            
            <!-- Product Info -->
            <div class="col-lg-5">
                <h1 class="product-title">${currentProduct.name}</h1>
                ${
                  currentProduct.short_description
                    ? `<p class="product-subtitle">${currentProduct.short_description}</p>`
                    : ""
                }
                
                ${
                  currentProduct.rating
                    ? `
                    <div class="product-rating">
                        <div class="stars">
                            ${"★".repeat(
                              Math.round(currentProduct.rating)
                            )}${"☆".repeat(
                        5 - Math.round(currentProduct.rating)
                      )}
                        </div>
                        <span class="review-count">(${
                          currentProduct.review_count
                        } reviews)</span>
                    </div>
                `
                    : ""
                }
                
                <div class="mb-4">
                    <span class="product-price">${productService.formatPrice(
                      selectedVariant?.price || currentProduct.base_price
                    )}</span>
                    ${
                      currentProduct.compare_price
                        ? `<span class="product-compare-price">${productService.formatPrice(
                            currentProduct.compare_price
                          )}</span>`
                        : ""
                    }
                </div>
                
                ${renderVariantSelectors()}
                
                <div class="mb-4">
                    ${renderStockStatus()}
                </div>
                
                <div class="variant-group">
                    <label>Quantity</label>
                    <div class="quantity-selector">
                        <button class="quantity-btn" onclick="decreaseQuantity()">−</button>
                        <input type="number" class="quantity-input" value="1" min="1" max="10" readonly>
                        <button class="quantity-btn" onclick="increaseQuantity()">+</button>
                    </div>
                </div>
                
                <div class="action-buttons">
                    <button class="btn-add-to-cart" onclick="addToCart()" ${
                      !productService.isInStock(currentProduct)
                        ? "disabled"
                        : ""
                    }>
                        <i class="bi bi-bag-plus me-2"></i>Add to Cart
                    </button>
                    <button class="btn-wishlist ${
                      isInWishlist ? "active" : ""
                    }" onclick="toggleWishlist()" 
                            ${
                              !authService.isAuthenticated()
                                ? 'title="Login to add to wishlist"'
                                : ""
                            }>
                        <i class="bi ${
                          isInWishlist ? "bi-heart-fill" : "bi-heart"
                        } fs-4"></i>
                    </button>
                </div>
                
                <ul class="product-features">
                    <li><i class="bi bi-truck"></i>Free shipping on orders over $150</li>
                    <li><i class="bi bi-shield-check"></i>Lifetime repair guarantee</li>
                    <li><i class="bi bi-arrow-counterclockwise"></i>30-day return policy</li>
                    ${
                      currentProduct.sustainability_notes
                        ? `<li><i class="bi bi-leaf"></i>${currentProduct.sustainability_notes}</li>`
                        : ""
                    }
                </ul>
            </div>
        `;

    // Update tabs content
    updateProductTabs();
  } catch (error) {
    console.error("Failed to load product:", error);
    container.innerHTML = `
            <div class="col-12 text-center py-5">
                <h3>Product not found</h3>
                <p class="text-muted">The product you're looking for doesn't exist.</p>
                <a href="/products.html" class="btn btn-dark">Continue Shopping</a>
            </div>
        `;
  }
}

// Render variant selectors
function renderVariantSelectors() {
  if (!currentProduct.variants || currentProduct.variants.length === 0) {
    return "";
  }

  let html = "";

  // Group variants by size and color
  const sizes = [
    ...new Set(currentProduct.variants.map((v) => v.size).filter(Boolean)),
  ];
  const colors = [
    ...new Set(currentProduct.variants.map((v) => v.color).filter(Boolean)),
  ];

  if (sizes.length > 0) {
    html += `
            <div class="variant-group">
                <label>Size</label>
                <div class="size-selector">
                    ${sizes
                      .map((size) => {
                        const variant = currentProduct.variants.find(
                          (v) => v.size === size
                        );
                        const isAvailable =
                          variant &&
                          productService.getAvailableStock(variant) > 0;
                        const isSelected = selectedVariant?.size === size;
                        return `
                            <button class="size-option ${
                              isSelected ? "active" : ""
                            } ${!isAvailable ? "disabled" : ""}"
                                    onclick="selectSize('${size}')" ${
                          !isAvailable ? "disabled" : ""
                        }>
                                ${size}
                            </button>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  }

  if (colors.length > 0) {
    html += `
            <div class="variant-group">
                <label>Color: ${selectedVariant?.color || ""}</label>
                <div class="color-selector">
                    ${colors
                      .map((color) => {
                        const variant = currentProduct.variants.find(
                          (v) => v.color === color
                        );
                        const isAvailable =
                          variant &&
                          productService.getAvailableStock(variant) > 0;
                        const isSelected = selectedVariant?.color === color;
                        const colorHex = variant?.color_hex || "#ccc";
                        return `
                            <button class="color-option ${
                              isSelected ? "active" : ""
                            } ${!isAvailable ? "disabled" : ""}"
                                    style="background-color: ${colorHex}"
                                    onclick="selectColor('${color}')" 
                                    title="${color}"
                                    ${!isAvailable ? "disabled" : ""}>
                            </button>
                        `;
                      })
                      .join("")}
                </div>
            </div>
        `;
  }

  return html;
}

// Render stock status
function renderStockStatus() {
  if (!selectedVariant) {
    return '<div class="stock-status out-of-stock"><i class="bi bi-x-circle me-2"></i>Out of Stock</div>';
  }

  const availableStock = productService.getAvailableStock(selectedVariant);

  if (availableStock === 0) {
    return '<div class="stock-status out-of-stock"><i class="bi bi-x-circle me-2"></i>Out of Stock</div>';
  } else if (availableStock <= 5) {
    return `<div class="stock-status low-stock"><i class="bi bi-exclamation-circle me-2"></i>Only ${availableStock} left in stock</div>`;
  } else {
    return '<div class="stock-status in-stock"><i class="bi bi-check-circle me-2"></i>In Stock</div>';
  }
}

// Update product tabs
function updateProductTabs() {
  const detailsTab = document.getElementById("details");
  const materialsTab = document.getElementById("materials");
  const sustainabilityTab = document.getElementById("sustainability");

  detailsTab.innerHTML = `
        <h5 class="mb-3">Product Details</h5>
        ${
          currentProduct.description ||
          "<p>No detailed description available.</p>"
        }
        ${
          currentProduct.production_method
            ? `<p class="mt-3"><strong>Production Method:</strong> ${currentProduct.production_method}</p>`
            : ""
        }
    `;

  materialsTab.innerHTML = `
        <h5 class="mb-3">Materials & Care</h5>
        ${
          currentProduct.material_composition
            ? `
            <h6>Material Composition:</h6>
            <ul>
                ${Object.entries(currentProduct.material_composition)
                  .map(
                    ([material, percentage]) =>
                      `<li>${material}: ${percentage}%</li>`
                  )
                  .join("")}
            </ul>
        `
            : ""
        }
        ${
          currentProduct.care_instructions
            ? `
            <h6 class="mt-4">Care Instructions:</h6>
            <p>${currentProduct.care_instructions}</p>
        `
            : "<p>Standard care instructions apply. Machine wash cold, tumble dry low.</p>"
        }
    `;

  sustainabilityTab.innerHTML = `
        <h5 class="mb-3">Sustainability</h5>
        ${
          currentProduct.sustainability_notes
            ? `<p>${currentProduct.sustainability_notes}</p>`
            : ""
        }
        ${
          currentProduct.certification_labels &&
          currentProduct.certification_labels.length > 0
            ? `
            <h6 class="mt-4">Certifications:</h6>
            <ul>
                ${currentProduct.certification_labels
                  .map((label) => `<li>${label}</li>`)
                  .join("")}
            </ul>
        `
            : ""
        }
        <p class="mt-4">All Athena products are made with sustainability in mind, using eco-friendly materials and ethical production methods.</p>
    `;
}

// Check wishlist status
async function checkWishlistStatus(productId) {
  if (!authService.isAuthenticated()) return;

  try {
    const wishlist = await wishlistService.getWishlist();
    const item = wishlist.find((w) => w.product_id === productId);
    if (item) {
      isInWishlist = true;
      wishlistItemId = item.id;
      // Update UI if already rendered
      const btn = document.querySelector(".btn-wishlist");
      if (btn) {
        btn.classList.add("active");
        btn.querySelector("i").classList.replace("bi-heart", "bi-heart-fill");
      }
    }
  } catch (error) {
    console.error("Failed to check wishlist status:", error);
  }
}

// Load related products
async function loadRelatedProducts() {
  const container = document.getElementById("relatedProducts");

  try {
    const { products } = await productService.getProducts({
      category_id: currentProduct?.category_id,
      limit: 4,
    });

    const relatedProducts = products
      .filter((p) => p.id !== currentProduct?.id)
      .slice(0, 4);

    if (relatedProducts.length === 0) {
      container.innerHTML =
        '<div class="col-12 text-center text-muted">No related products found</div>';
      return;
    }

    container.innerHTML = relatedProducts
      .map((product) => {
        const primaryImage =
          product.images?.find((img) => img.is_primary) || product.images?.[0];
        const discount = productService.getDiscountPercentage(
          product.base_price,
          product.compare_price
        );

        return `
                <div class="col-lg-3 col-md-6">
                    <div class="card related-product-card h-100" onclick="window.location.href='/product-detail.html?id=${
                      product.id
                    }'">
                        <div class="overflow-hidden position-relative">
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
                                 class="card-img-top related-product-image" alt="${
                                   product.name
                                 }">
                        </div>
                        <div class="card-body">
                            <h6 class="card-title">${product.name}</h6>
                            <p class="card-text">
                                <span class="fw-bold">${productService.formatPrice(
                                  product.base_price
                                )}</span>
                                ${
                                  product.compare_price
                                    ? `<span class="text-muted text-decoration-line-through ms-2">${productService.formatPrice(
                                        product.compare_price
                                      )}</span>`
                                    : ""
                                }
                            </p>
                        </div>
                    </div>
                </div>
            `;
      })
      .join("");
  } catch (error) {
    console.error("Failed to load related products:", error);
  }
}

// Change main image
window.changeMainImage = function (imageUrl, thumbnail) {
  document.getElementById("mainImage").src = imageUrl;
  document
    .querySelectorAll(".thumbnail")
    .forEach((t) => t.classList.remove("active"));
  thumbnail.classList.add("active");
};

// Select size
window.selectSize = function (size) {
  const variant = currentProduct.variants.find(
    (v) =>
      v.size === size &&
      (!selectedVariant?.color || v.color === selectedVariant.color)
  );

  if (variant) {
    selectedVariant = variant;
    updateProductDisplay();
  }
};

// Select color
window.selectColor = function (color) {
  const variant = currentProduct.variants.find(
    (v) =>
      v.color === color &&
      (!selectedVariant?.size || v.size === selectedVariant.size)
  );

  if (variant) {
    selectedVariant = variant;
    updateProductDisplay();
  }
};

// Update product display after variant change
function updateProductDisplay() {
  // Update price
  document.querySelector(".product-price").textContent =
    productService.formatPrice(
      selectedVariant?.price || currentProduct.base_price
    );

  // Update stock status
  const stockContainer = document.querySelector(".stock-status").parentElement;
  stockContainer.innerHTML = renderStockStatus();

  // Update variant image if available
  if (selectedVariant?.image_url) {
    document.getElementById("mainImage").src = selectedVariant.image_url;
  }

  // Update add to cart button
  const addToCartBtn = document.querySelector(".btn-add-to-cart");
  const isInStock = productService.getAvailableStock(selectedVariant) > 0;
  addToCartBtn.disabled = !isInStock;

  // Reset quantity
  quantity = 1;
  document.querySelector(".quantity-input").value = 1;
}

// Decrease quantity
window.decreaseQuantity = function () {
  if (quantity > 1) {
    quantity--;
    document.querySelector(".quantity-input").value = quantity;
  }
};

// Increase quantity
window.increaseQuantity = function () {
  const maxQuantity = selectedVariant
    ? productService.getAvailableStock(selectedVariant)
    : 0;
  if (quantity < Math.min(10, maxQuantity)) {
    quantity++;
    document.querySelector(".quantity-input").value = quantity;
  }
};

// Add to cart
window.addToCart = async function () {
  if (!selectedVariant) {
    showToast("Please select a variant", "warning");
    return;
  }

  const button = document.querySelector(".btn-add-to-cart");
  button.disabled = true;
  button.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Adding...';

  try {
    await cartService.addItem(currentProduct.id, selectedVariant.id, quantity);
    await updateCartCount();
    showToast("Added to cart!", "success");
  } catch (error) {
    console.error("Failed to add to cart:", error);
    showToast("Failed to add to cart", "danger");
  } finally {
    button.disabled = false;
    button.innerHTML = '<i class="bi bi-bag-plus me-2"></i>Add to Cart';
  }
};

// Toggle wishlist
window.toggleWishlist = async function () {
  if (!authService.isAuthenticated()) {
    window.location.href =
      "/login.html?redirect=" + encodeURIComponent(window.location.href);
    return;
  }

  const button = document.querySelector(".btn-wishlist");
  const icon = button.querySelector("i");

  try {
    if (isInWishlist) {
      await wishlistService.removeFromWishlist(wishlistItemId);
      isInWishlist = false;
      wishlistItemId = null;
      button.classList.remove("active");
      icon.classList.replace("bi-heart-fill", "bi-heart");
      showToast("Removed from wishlist");
    } else {
      const item = await wishlistService.addToWishlist(
        currentProduct.id,
        selectedVariant?.id
      );
      isInWishlist = true;
      wishlistItemId = item.id;
      button.classList.add("active");
      icon.classList.replace("bi-heart", "bi-heart-fill");
      showToast("Added to wishlist", "success");
    }
  } catch (error) {
    console.error("Failed to update wishlist:", error);
    showToast("Failed to update wishlist", "danger");
  }
};

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
