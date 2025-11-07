import { AuthService } from "/services/AuthService.js";
import { ProductService } from "/services/ProductService.js";
import { CartService } from "/services/CartService.js";
import { ReviewService } from "/services/ReviewService.js";
import { OrderService } from "/services/OrderService.js";
import { AddressService } from "/services/AddressService.js";
import { Dialog } from "/js/dialog.js";

// Initialize services
const authService = new AuthService();
const productService = new ProductService();
const cartService = new CartService();
const reviewService = new ReviewService();
const orderService = new OrderService();
const addressService = new AddressService();

// State
let currentProduct = null;
let selectedVariant = null;
let quantity = 1;
let isAddingToCart = false;
let currentReviews = null;
let selectedRating = 0;
let reviewModal = null;
let buyNowModal = null;
let reviewImageFiles = [];
let savedAddresses = [];

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  await initializeNavigation();

  const productId = getProductIdFromUrl();

  if (productId) {
    await loadProduct(productId);
    await loadReviews(productId);
    await loadRelatedProducts();
    initializeReviewModal();
    initializeBuyNowModal();
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
      selectedVariant =
        currentProduct.variants.find((v) => v.is_default) ||
        currentProduct.variants[0];
    }

    // Update breadcrumb
    const breadcrumbProduct = document.getElementById("breadcrumbProduct");
    const breadcrumbCollection = document.getElementById(
      "breadcrumbCollection"
    );

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
  // Prioritize featured_image_url as it's the uploaded image
  const primaryImageUrl =
    product.featured_image_url ||
    product.images?.find((img) => img.is_primary)?.url ||
    product.images?.[0]?.url;

  return `
    <!-- Image Gallery -->
    <div class="col-lg-6">
      ${renderImageGallery(product.images, primaryImageUrl)}
    </div>

    <!-- Product Info -->
    <div class="col-lg-6">
      <div class="product-info">
        <!-- Product Header -->
        <div class="mb-3">
          ${
            product.collection?.name
              ? `<p class="text-muted text-uppercase small mb-2">${product.collection.name}</p>`
              : ""
          }
          <h1 class="h2 mb-3">${product.name}</h1>
          <div class="d-flex align-items-center gap-3 mb-3">
            <div>
              <span class="h3 mb-0">${productService.formatPrice(
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
              discount > 0
                ? `<span class="badge bg-danger">-${discount}% OFF</span>`
                : ""
            }
          </div>
          ${
            product.rating
              ? `
            <div class="d-flex align-items-center gap-2 mb-3">
              <div class="text-warning fs-5">
                ${"★".repeat(Math.round(product.rating))}${"☆".repeat(
                  5 - Math.round(product.rating)
                )}
              </div>
              <span class="fw-semibold">${product.rating.toFixed(1)}</span>
              <span class="text-muted small">(${
                product.review_count || 0
              } review${product.review_count !== 1 ? "s" : ""})</span>
            </div>
          `
              : ""
          }
          ${
            product.short_description
              ? `<p class="text-muted mb-4">${product.short_description}</p>`
              : ""
          }
        </div>

        <!-- Variant Selection -->
        ${renderVariantSelectors(product.variants)}

        <!-- Quantity and Add to Cart -->
        <div class="mb-4">
          <div class="row g-3 mb-3">
            <div class="col-12">
              <label class="form-label small fw-semibold">Số Lượng</label>
              <div class="input-group" style="max-width: 150px;">
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
          </div>

          <div class="row g-3">
            <div class="col-6">
              <button class="btn btn-outline-dark btn-lg w-100 add-to-cart-btn" onclick="window.addToCart()"
                      ${
                        stockStatus === "out-of-stock" || !selectedVariant
                          ? "disabled"
                          : ""
                      }
                      style="height: 56px;">
                <i class="bi bi-cart-plus me-2"></i>
                ${stockStatus === "out-of-stock" ? "Hết Hàng" : "Thêm Vào Giỏ"}
              </button>
            </div>
            <div class="col-6">
              <button class="btn btn-dark btn-lg w-100" onclick="window.buyNow()"
                      ${
                        stockStatus === "out-of-stock" || !selectedVariant
                          ? "disabled"
                          : ""
                      }
                      style="height: 56px;">
                <i class="bi bi-lightning-charge-fill me-2"></i>
                Mua Ngay
              </button>
            </div>
          </div>

          <div class="mt-3">
            <p class="small text-muted mb-1">
              <i class="bi bi-truck me-2"></i>Miễn phí vận chuyển cho đơn hàng trên $200
            </p>
            <p class="small text-muted mb-1">
              <i class="bi bi-arrow-return-left me-2"></i>Đổi trả miễn phí trong 30 ngày
            </p>
            <p class="small text-muted mb-0">
              <i class="bi bi-shield-check me-2"></i>Thanh toán bảo mật
            </p>
          </div>
        </div>

        <!-- Product Details Accordion -->
        <div class="accordion" id="productAccordion">
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseDescription">
                Mô Tả
              </button>
            </h2>
            <div id="collapseDescription" class="accordion-collapse collapse show" data-bs-parent="#productAccordion">
              <div class="accordion-body">
                ${
                  product.description ||
                  product.short_description ||
                  "Không có mô tả."
                }
              </div>
            </div>
          </div>

          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseMaterial">
                Chất Liệu & Bảo Quản
              </button>
            </h2>
            <div id="collapseMaterial" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
              <div class="accordion-body">
                <p class="mb-2"><strong>Thành Phần Chất Liệu:</strong></p>
                <p>${renderMaterialComposition(
                  product.material_composition
                )}</p>
                ${
                  product.care_instructions
                    ? `
                  <p class="mb-2 mt-3"><strong>Hướng Dẫn Bảo Quản:</strong></p>
                  <p>${product.care_instructions}</p>
                `
                    : ""
                }
              </div>
            </div>
          </div>

          ${
            product.sustainability_notes
              ? `
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseSustainability">
                  Bền Vững
                </button>
              </h2>
              <div id="collapseSustainability" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                <div class="accordion-body">
                  ${product.sustainability_notes}
                  ${
                    product.certification_labels &&
                    product.certification_labels.length > 0
                      ? `
                    <div class="mt-3">
                      <p class="mb-2"><strong>Chứng Nhận:</strong></p>
                      <div class="d-flex gap-2 flex-wrap">
                        ${product.certification_labels
                          .map(
                            (cert) =>
                              `<span class="badge bg-success">${cert}</span>`
                          )
                          .join("")}
                      </div>
                    </div>
                  `
                      : ""
                  }
                </div>
              </div>
            </div>
          `
              : ""
          }

          ${
            product.production_method
              ? `
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseProduction">
                  Phương Thức Sản Xuất
                </button>
              </h2>
              <div id="collapseProduction" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                <div class="accordion-body">
                  <p class="mb-0">${product.production_method}</p>
                </div>
              </div>
            </div>
          `
              : ""
          }

          ${
            product.weight_value && product.weight_unit
              ? `
            <div class="accordion-item">
              <h2 class="accordion-header">
                <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseShipping">
                  Vận Chuyển & Trọng Lượng
                </button>
              </h2>
              <div id="collapseShipping" class="accordion-collapse collapse" data-bs-parent="#productAccordion">
                <div class="accordion-body">
                  <p class="mb-2"><strong>Trọng Lượng Sản Phẩm:</strong></p>
                  <p class="mb-0">${productService.formatWeight(
                    product.weight_value,
                    product.weight_unit
                  )}</p>
                  <p class="text-muted small mt-2 mb-0">
                    <i class="bi bi-info-circle me-1"></i>
                    Trọng lượng được sử dụng để tính phí vận chuyển khi thanh toán.
                  </p>
                </div>
              </div>
            </div>
          `
              : ""
          }
        </div>
      </div>
    </div>
  `;
}

// Render image gallery - filters images by selected variant
function renderImageGallery(images, primaryImageUrl) {
  // Filter images for current variant if one is selected
  let displayImages = images || [];

  if (selectedVariant && displayImages.length > 0) {
    // First try to get images for this specific variant
    const variantImages = displayImages.filter(
      (img) => img.variant_id === selectedVariant.id
    );

    if (variantImages.length > 0) {
      displayImages = variantImages;
    } else {
      // If no variant-specific images, use product-level images (variant_id is null)
      const productImages = displayImages.filter((img) => !img.variant_id);
      if (productImages.length > 0) {
        displayImages = productImages;
      }
    }
  }

  if (displayImages.length === 0) {
    // Fallback to variant image, then primary image URL, then placeholder
    const fallbackUrl =
      selectedVariant?.image_url ||
      primaryImageUrl ||
      "/images/placeholder-user.jpg";
    return `
      <div class="product-image-container">
        <img src="${fallbackUrl}"
             alt="Product" class="img-fluid rounded" id="mainProductImage">
      </div>
    `;
  }

  return `
    <div class="product-image-container mb-3">
      <img src="${displayImages[0]?.url}" alt="${
    displayImages[0]?.alt_text || "Product"
  }"
           class="img-fluid rounded" id="mainProductImage">
    </div>
    ${
      displayImages.length > 1
        ? `
      <div class="product-thumbnails" id="imageThumbnails">
        ${displayImages
          .map(
            (img, index) => `
          <img src="${img.url}" alt="${img.alt_text || "Product"}"
               class="product-thumbnail ${index === 0 ? "active" : ""}"
               onclick="window.changeMainImage('${img.url}', ${index})">
        `
          )
          .join("")}
      </div>
    `
        : ""
    }
  `;
}

// Render variant selectors
function renderVariantSelectors(variants) {
  if (!variants || variants.length === 0) {
    return "";
  }

  const sizes = productService.getAvailableSizes(variants);
  const colors = productService.getAvailableColors(variants);

  let html = "";

  // Size selector
  if (sizes.length > 0) {
    html += `
      <div class="mb-4">
        <label class="form-label fw-semibold mb-3">
          <i class="bi bi-rulers me-2"></i>
          Chọn Kích Thước: <span class="text-primary" id="selectedSize">${
            selectedVariant?.size || "Vui lòng chọn"
          }</span>
        </label>
        <div class="d-flex gap-2 flex-wrap">
          ${sizes
            .map((size) => {
              // Check if this size is available with current color selection
              const matchingVariants = variants.filter((v) => v.size === size);
              const hasStock = matchingVariants.some(
                (v) => productService.getAvailableStock(v) > 0
              );
              const isSelected = selectedVariant?.size === size;

              return `
              <button class="btn ${
                isSelected ? "btn-dark active" : "btn-outline-dark"
              } size-btn"
                      onclick="window.selectVariant('size', '${size}')"
                      ${!hasStock ? "disabled" : ""}
                      style="min-width: 60px;">
                ${size}
              </button>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // Color selector
  if (colors.length > 0) {
    html += `
      <div class="mb-4">
        <label class="form-label fw-semibold mb-3">
          <i class="bi bi-palette me-2"></i>
          Chọn Màu Sắc: <span class="text-primary" id="selectedColor">${
            selectedVariant?.color || "Vui lòng chọn"
          }</span>
        </label>
        <div class="d-flex gap-3 flex-wrap align-items-start">
          ${colors
            .map((colorObj) => {
              const { name: color, hex: colorHex } = colorObj;
              // Check if this color is available with current size selection
              const matchingVariants = variants.filter(
                (v) => v.color === color
              );
              const hasStock = matchingVariants.some(
                (v) => productService.getAvailableStock(v) > 0
              );
              const isSelected = selectedVariant?.color === color;

              return `
              <div class="text-center" style="width: 80px;">
                <button class="btn color-swatch ${isSelected ? "selected" : ""}"
                        onclick="window.selectVariant('color', '${color}')"
                        title="${color}"
                        ${!hasStock ? "disabled" : ""}
                        style="background-color: ${colorHex}; width: 50px; height: 50px; border-radius: 50%; border: 3px solid ${
                isSelected ? "#000" : "#ddd"
              }; padding: 0; display: flex; align-items: center; justify-content: center; ${
                !hasStock
                  ? "opacity: 0.4; cursor: not-allowed;"
                  : "cursor: pointer;"
              } box-shadow: ${
                isSelected ? "0 0 0 2px #fff, 0 0 0 4px #000" : "none"
              }; margin: 0 auto;">
                  ${
                    isSelected
                      ? '<i class="bi bi-check-lg text-white" style="font-size: 24px; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.5);"></i>'
                      : ""
                  }
                </button>
                <div class="small mt-2 ${
                  isSelected ? "fw-semibold" : ""
                }" style="word-wrap: break-word; overflow-wrap: break-word; hyphens: auto; line-height: 1.2;">${color}</div>
              </div>
            `;
            })
            .join("")}
        </div>
      </div>
    `;
  }

  // Stock status
  if (selectedVariant) {
    const stock = productService.getAvailableStock(selectedVariant);
    html += `
      <div class="alert ${
        stock > 0
          ? stock <= 5
            ? "alert-warning"
            : "alert-success"
          : "alert-danger"
      } py-2 small">
        <i class="bi ${stock > 0 ? "bi-check-circle" : "bi-x-circle"} me-2"></i>
        ${
          stock > 0
            ? stock <= 5
              ? `Chỉ còn ${stock} sản phẩm!`
              : "Còn Hàng"
            : "Hết Hàng"
        }
      </div>
    `;
  } else {
    html += `
      <div class="alert alert-info py-2 small">
        <i class="bi bi-info-circle me-2"></i>
        Vui lòng chọn kích thước và màu sắc để kiểm tra tình trạng hàng
      </div>
    `;
  }

  return html;
}

// Render material composition
function renderMaterialComposition(composition) {
  if (!composition) return "100% Chất Liệu Cao Cấp";

  if (typeof composition === "object") {
    return Object.entries(composition)
      .map(([material, percentage]) => {
        const formattedName = productService.formatMaterialName(material);
        return `${formattedName}: ${percentage}%`;
      })
      .join(", ");
  }

  return composition;
}

// Helper functions
function calculateDiscount(price, comparePrice) {
  if (!comparePrice || comparePrice <= price) return 0;
  return Math.round(((comparePrice - price) / comparePrice) * 100);
}

function getStockStatus(product) {
  if (!product.variants || product.variants.length === 0) return "in-stock";

  const totalStock = product.variants.reduce(
    (total, variant) => total + productService.getAvailableStock(variant),
    0
  );

  if (totalStock === 0) return "out-of-stock";
  if (totalStock <= 5) return "low-stock";
  return "in-stock";
}

// Interactive functions
window.changeMainImage = function (imageUrl, index) {
  const mainImage = document.getElementById("mainProductImage");
  if (mainImage) {
    mainImage.src = imageUrl;
  }

  // Update active thumbnail
  document.querySelectorAll(".product-thumbnail").forEach((thumb, i) => {
    thumb.classList.toggle("active", i === index);
  });
};

window.selectVariant = function (type, value) {
  if (!currentProduct || !currentProduct.variants) return;

  console.log("[selectVariant] Type:", type, "Value:", value);

  // Store current selections
  const currentSize = selectedVariant?.size;
  const currentColor = selectedVariant?.color;

  // Find variant that matches the selection
  let targetVariant;
  if (type === "size") {
    // Try to find variant with selected size and current color
    targetVariant = currentProduct.variants.find(
      (v) => v.size === value && v.color === currentColor
    );
    // If not found, find any variant with selected size
    if (!targetVariant) {
      targetVariant = currentProduct.variants.find((v) => v.size === value);
    }
  } else if (type === "color") {
    // Try to find variant with selected color and current size
    targetVariant = currentProduct.variants.find(
      (v) => v.color === value && v.size === currentSize
    );
    // If not found, find any variant with selected color
    if (!targetVariant) {
      targetVariant = currentProduct.variants.find((v) => v.color === value);
    }
  }

  if (targetVariant) {
    console.log("[selectVariant] Found variant:", targetVariant);
    selectedVariant = targetVariant;

    // Update UI elements without full re-render
    updateVariantUI();
  } else {
    console.warn("[selectVariant] No matching variant found");
  }
};

// Update UI elements when variant changes
function updateVariantUI() {
  if (!selectedVariant) return;

  console.log("[updateVariantUI] Updating UI for variant:", selectedVariant);

  // Update selected size display
  const selectedSizeEl = document.getElementById("selectedSize");
  if (selectedSizeEl) {
    selectedSizeEl.textContent = selectedVariant.size || "Chọn Kích Thước";
  }

  // Update selected color display
  const selectedColorEl = document.getElementById("selectedColor");
  if (selectedColorEl) {
    selectedColorEl.textContent = selectedVariant.color || "Chọn Màu Sắc";
  }

  // Update size buttons
  document.querySelectorAll(".size-btn").forEach((btn) => {
    const size = btn.textContent.trim();
    const isSelected = size === selectedVariant.size;
    btn.classList.toggle("btn-dark", isSelected);
    btn.classList.toggle("active", isSelected);
    btn.classList.toggle("btn-outline-dark", !isSelected);
  });

  // Update color swatches
  document.querySelectorAll(".color-swatch").forEach((btn) => {
    const color = btn.getAttribute("title");
    const isSelected = color === selectedVariant.color;
    btn.classList.toggle("selected", isSelected);

    // Update border and box-shadow to match initial render
    btn.style.border = `3px solid ${isSelected ? "#000" : "#ddd"}`;
    btn.style.boxShadow = isSelected ? "0 0 0 2px #fff, 0 0 0 4px #000" : "none";

    // Update checkmark
    if (isSelected && !btn.querySelector(".bi-check-lg")) {
      btn.innerHTML =
        '<i class="bi bi-check-lg text-white" style="font-size: 24px; font-weight: bold; text-shadow: 0 0 3px rgba(0,0,0,0.5);"></i>';
    } else if (!isSelected) {
      btn.innerHTML = "";
    }
  });

  // Update stock status
  const stock = productService.getAvailableStock(selectedVariant);
  const alertContainer = document.querySelector(".alert");
  if (alertContainer) {
    alertContainer.className = `alert py-2 small ${
      stock > 0
        ? stock <= 5
          ? "alert-warning"
          : "alert-success"
        : "alert-danger"
    }`;
    alertContainer.textContent =
      stock > 0
        ? stock <= 5
          ? `Chỉ còn ${stock} sản phẩm!`
          : "Còn Hàng"
        : "Hết Hàng";
  }

  // Update add to cart button
  const addToCartBtn = document.querySelector(".add-to-cart-btn");
  if (addToCartBtn) {
    const isOutOfStock = stock === 0;
    addToCartBtn.disabled = isOutOfStock;
    addToCartBtn.innerHTML = `
      <i class="bi bi-cart-plus me-2"></i>
      ${isOutOfStock ? "Hết Hàng" : "Thêm Vào Giỏ"}
    `;
  }

  // Update price if variant has specific price
  if (selectedVariant.price) {
    const priceEl = document.querySelector(".h3");
    if (priceEl) {
      priceEl.textContent = productService.formatPrice(selectedVariant.price);
    }
  }

  // Update SKU if displayed
  const skuEl = document.getElementById("productSku");
  if (skuEl) {
    skuEl.textContent = selectedVariant.sku;
  }

  // Update images - filter gallery by variant
  updateVariantImages();

  // Update Buy Now button state - find by onclick attribute since there are multiple .btn-dark buttons
  const buyNowBtn = Array.from(document.querySelectorAll("button")).find(
    (btn) => btn.getAttribute("onclick") === "window.buyNow()"
  );
  if (buyNowBtn) {
    const isOutOfStock = stock === 0;
    buyNowBtn.disabled = isOutOfStock;
  }

  console.log("[updateVariantUI] UI updated successfully");
}

// Update images when variant changes
function updateVariantImages() {
  if (!currentProduct || !selectedVariant) return;

  // Get images filtered by variant
  let displayImages = currentProduct.images || [];

  if (displayImages.length > 0) {
    // Try to get variant-specific images
    const variantImages = displayImages.filter(
      (img) => img.variant_id === selectedVariant.id
    );

    if (variantImages.length > 0) {
      displayImages = variantImages;
    } else {
      // Use product-level images
      const productImages = displayImages.filter((img) => !img.variant_id);
      if (productImages.length > 0) {
        displayImages = productImages;
      }
    }
  }

  // Update main image with smooth transition
  const mainImage = document.getElementById("mainProductImage");
  if (mainImage) {
    // Fade out
    mainImage.style.opacity = "0";

    setTimeout(() => {
      if (displayImages.length > 0) {
        mainImage.src = displayImages[0].url;
        mainImage.alt = displayImages[0].alt_text || currentProduct.name;
      } else if (selectedVariant.image_url) {
        mainImage.src = selectedVariant.image_url;
      }

      // Fade in
      setTimeout(() => {
        mainImage.style.opacity = "1";
      }, 50);
    }, 300);
  }

  // Update thumbnails
  const thumbnailContainer = document.getElementById("imageThumbnails");
  if (thumbnailContainer && displayImages.length > 1) {
    thumbnailContainer.innerHTML = displayImages
      .map(
        (img, index) => `
      <img src="${img.url}" alt="${img.alt_text || "Product"}"
           class="product-thumbnail ${index === 0 ? "active" : ""}"
           onclick="window.changeMainImage('${img.url}', ${index})">
    `
      )
      .join("");
  } else if (thumbnailContainer) {
    thumbnailContainer.innerHTML = "";
  }
}

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
  const quantityInput = document.querySelector(".quantity-input");
  if (quantityInput) quantityInput.value = quantity;
}

window.addToCart = async function () {
  console.log("[addToCart] Called");

  // Prevent duplicate submissions
  if (isAddingToCart) {
    console.log("[addToCart] Already adding to cart, ignoring duplicate call");
    return;
  }

  if (!authService.isAuthenticated()) {
    console.log("[addToCart] User not authenticated");
    showToast("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng", "warning");
    setTimeout(() => {
      window.location.href =
        "/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  if (!selectedVariant) {
    console.log("[addToCart] No variant selected");
    showToast("Vui lòng chọn tùy chọn sản phẩm trước", "warning");
    return;
  }

  isAddingToCart = true;

  console.log("[addToCart] Adding to cart:", {
    productId: currentProduct.id,
    productName: currentProduct.name,
    variantId: selectedVariant.id,
    variantSize: selectedVariant.size,
    variantColor: selectedVariant.color,
    quantity,
  });

  const button = document.querySelector(".add-to-cart-btn");
  const originalText = button.innerHTML;
  const originalWidth = button.offsetWidth;

  button.disabled = true;
  button.style.width = `${originalWidth}px`;
  button.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang thêm...';

  try {
    console.log("[addToCart] Calling cartService.addItem...");
    await cartService.addItem(currentProduct.id, selectedVariant.id, quantity);
    console.log("[addToCart] Item added successfully");

    console.log("[addToCart] Updating cart count...");
    await updateCartCount();
    showToast("Đã thêm vào giỏ hàng!", "success");

    // Update button with success state
    button.innerHTML = '<i class="bi bi-check2 me-2"></i>Đã Thêm!';

    // Reset button after delay
    setTimeout(() => {
      console.log("[addToCart] Resetting button");
      button.innerHTML = originalText;
      button.disabled = false;
      button.style.width = "";
      isAddingToCart = false;
    }, 2000);
  } catch (error) {
    console.error("[addToCart] Error:", error);
    showToast(
      error.message || "Không thể thêm vào giỏ hàng. Vui lòng thử lại.",
      "danger"
    );
    button.disabled = false;
    button.innerHTML = originalText;
    button.style.width = "";
    isAddingToCart = false;
  }
};

// Buy Now - Create order directly without using cart
window.buyNow = async function () {
  console.log("[buyNow] Called");

  if (!authService.isAuthenticated()) {
    console.log("[buyNow] User not authenticated");
    showToast("Vui lòng đăng nhập để mua hàng", "warning");
    setTimeout(() => {
      window.location.href =
        "/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  if (!selectedVariant) {
    console.log("[buyNow] No variant selected");
    showToast("Vui lòng chọn size và màu sắc trước", "warning");
    return;
  }

  const stock = productService.getAvailableStock(selectedVariant);
  if (stock === 0) {
    showToast("Sản phẩm đã hết hàng", "danger");
    return;
  }

  if (quantity < 1) {
    showToast("Số lượng không hợp lệ", "warning");
    return;
  }

  console.log("[buyNow] Opening buy now modal:", {
    productId: currentProduct.id,
    productName: currentProduct.name,
    variantId: selectedVariant.id,
    variantSize: selectedVariant.size,
    variantColor: selectedVariant.color,
    quantity,
  });

  // Load saved addresses for authenticated users
  await loadBuyNowSavedAddresses();

  // Pre-fill email from user profile if available
  if (authService.user) {
    const emailInput = document.getElementById("buyNowEmail");
    if (emailInput && authService.user.email) {
      emailInput.value = authService.user.email;
    }

    // Only pre-fill name and phone if no saved address was auto-selected
    const addressSelect = document.getElementById("buyNowSavedAddressSelect");
    const hasSelectedAddress = addressSelect && addressSelect.value;

    if (!hasSelectedAddress) {
      const firstNameInput = document.getElementById("buyNowFirstName");
      if (firstNameInput && authService.user.first_name) {
        firstNameInput.value = authService.user.first_name;
      }

      const lastNameInput = document.getElementById("buyNowLastName");
      if (lastNameInput && authService.user.last_name) {
        lastNameInput.value = authService.user.last_name;
      }

      const phoneInput = document.getElementById("buyNowPhone");
      if (phoneInput && authService.user.phone) {
        phoneInput.value = authService.user.phone;
      }
    }
  }

  // Show modal
  buyNowModal.show();
};

// Load related products
async function loadRelatedProducts() {
  if (!currentProduct || !currentProduct.category_id) return;

  try {
    const { products } = await productService.getProducts({
      category_id: currentProduct.category_id,
      limit: 4,
    });

    // Filter out current product
    const relatedProducts = products
      .filter((p) => p.id !== currentProduct.id)
      .slice(0, 4);

    if (relatedProducts.length === 0) return;

    const relatedSection = `
      <div class="row mt-5 pt-5 border-top">
        <div class="col-12">
          <h3 class="h4 mb-4">Có Thể Bạn Cũng Thích</h3>
        </div>
        ${relatedProducts
          .map((product) => {
            const discount = calculateDiscount(
              product.base_price,
              product.compare_price
            );
            // Prioritize featured_image_url as it's the uploaded image
            const imageUrl =
              product.featured_image_url ||
              product.images?.find((img) => img.is_primary)?.url ||
              product.images?.[0]?.url ||
              "/images/placeholder-user.jpg";
            const isInStock = productService.isInStock(product);

            return `
            <div class="col-md-6 col-lg-3">
              <div class="card border-0 shadow-sm h-100">
                <div class="position-relative">
                  ${
                    discount > 0
                      ? `<span class="position-absolute top-0 start-0 m-2 badge bg-danger">-${discount}%</span>`
                      : ""
                  }
                  ${
                    !isInStock
                      ? `<div class="position-absolute bottom-0 start-0 end-0 bg-secondary bg-opacity-75 text-white text-center py-1 small">Hết Hàng</div>`
                      : ""
                  }
                  <a href="/product-detail.html?id=${product.id}">
                    <img src="${imageUrl}"
                         class="card-img-top" alt="${
                           product.name
                         }" style="height: 250px; object-fit: cover;">
                  </a>
                </div>
                <div class="card-body">
                  <h6 class="card-title">
                    <a href="/product-detail.html?id=${
                      product.id
                    }" class="text-decoration-none text-dark">${
              product.name
            }</a>
                  </h6>
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <span class="fw-bold">${productService.formatPrice(
                        product.base_price
                      )}</span>
                      ${
                        product.compare_price
                          ? `<span class="text-muted text-decoration-line-through small ms-1">${productService.formatPrice(
                              product.compare_price
                            )}</span>`
                          : ""
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
          `;
          })
          .join("")}
      </div>
    `;

    const container = document.getElementById("productDetail").parentElement;
    container.insertAdjacentHTML("beforeend", relatedSection);
  } catch (error) {
    console.error("Failed to load related products:", error);
  }
}

function showToast(message, type = "info") {
  // Create toast container if it doesn't exist
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "1055";
    document.body.appendChild(toastContainer);
  }

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
  const container = document.getElementById("reviewsContainer");
  if (!container) return;

  try {
    const data = await reviewService.getProductReviews(productId, 1, 10);
    currentReviews = data;

    container.innerHTML = renderReviewsSection(data);
  } catch (error) {
    console.error("Failed to load reviews:", error);
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
        <div class="text-muted small">Dựa trên ${totalReviews} ${
    totalReviews === 1 ? "đánh giá" : "đánh giá"
  }</div>
      </div>

      <!-- Rating Distribution -->
      <div class="rating-distribution mb-4">
        ${[5, 4, 3, 2, 1]
          .map((rating) => {
            const count = ratingDistribution[rating] || 0;
            const percentage =
              totalReviews > 0 ? (count / totalReviews) * 100 : 0;
            return `
            <div class="d-flex align-items-center mb-2 small">
              <span class="me-2" style="min-width: 60px;">${rating} sao</span>
              <div class="progress flex-grow-1" style="height: 8px;">
                <div class="progress-bar bg-warning" role="progressbar"
                     style="width: ${percentage}%"
                     aria-valuenow="${percentage}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <span class="ms-2 text-muted" style="min-width: 35px;">${count}</span>
            </div>
          `;
          })
          .join("")}
      </div>

      <!-- Write Review Button -->
      ${
        authService.isAuthenticated()
          ? `
        <button class="btn btn-dark w-100" onclick="window.openReviewModal()">
          <i class="bi bi-pencil-square me-2"></i>Viết Đánh Giá
        </button>
      `
          : `
        <a href="/login.html?redirect=${encodeURIComponent(
          window.location.href
        )}"
           class="btn btn-dark w-100">
          <i class="bi bi-pencil-square me-2"></i>Đăng Nhập Để Viết Đánh Giá
        </a>
      `
      }
    </div>
  `;
}

// Render list of reviews
function renderReviewsList(reviews, stats) {
  if (!reviews || reviews.length === 0) {
    return `
      <div class="text-center py-5">
        <i class="bi bi-chat-quote display-1 text-muted mb-3"></i>
        <h5 class="text-muted">Chưa có đánh giá</h5>
        <p class="text-muted">Hãy là người đầu tiên chia sẻ trải nghiệm của bạn!</p>
      </div>
    `;
  }

  return `
    <div class="reviews-list">
      ${reviews.map((review) => renderReviewCard(review)).join("")}
    </div>
  `;
}

// Render a single review card
function renderReviewCard(review) {
  const userName = review.user
    ? `${review.user.first_name || ""} ${review.user.last_name || ""}`.trim() ||
      "Anonymous"
    : "Anonymous";
  const userInitials = review.user
    ? reviewService.getInitials(review.user.first_name, review.user.last_name)
    : "??";
  const avatarUrl = review.user?.avatar_url;
  const hasLiked = review.user_has_liked || false;
  const likeCount = review.helpful_count || 0;

  return `
    <div class="review-card card border-0 shadow-sm mb-3">
      <div class="card-body">
        <div class="d-flex align-items-start mb-3">
          <!-- Avatar -->
          <div class="review-avatar me-3">
            ${
              avatarUrl
                ? `
              <img src="${avatarUrl}" alt="${userName}" class="rounded-circle"
                   style="width: 48px; height: 48px; object-fit: cover;">
            `
                : `
              <div class="avatar-placeholder rounded-circle d-flex align-items-center justify-content-center"
                   style="width: 48px; height: 48px; background-color: var(--color-accent); color: white; font-weight: 500;">
                ${userInitials}
              </div>
            `
            }
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
              <span class="text-muted small">${reviewService.formatDate(
                review.created_at
              )}</span>
            </div>

            ${
              review.is_verified_purchase
                ? `
              <span class="badge bg-success-subtle text-success small mb-2">
                <i class="bi bi-patch-check-fill me-1"></i>Đã Mua Hàng
              </span>
            `
                : ""
            }

            <!-- Review Title -->
            ${
              review.title
                ? `
              <h6 class="fw-semibold mb-2">${review.title}</h6>
            `
                : ""
            }

            <!-- Review Text -->
            ${
              review.review
                ? `
              <p class="mb-3">${review.review}</p>
            `
                : ""
            }

            <!-- Review Images -->
            ${
              review.images && review.images.length > 0
                ? `
              <div class="review-images mb-3 d-flex gap-2 flex-wrap">
                ${review.images
                  .map(
                    (img, idx) => `
                  <img src="${img}" alt="Review image ${idx + 1}"
                       class="img-thumbnail" style="width: 100px; height: 100px; object-fit: cover; cursor: pointer;"
                       onclick="window.openImageModal('${img}')">
                `
                  )
                  .join("")}
              </div>
            `
                : ""
            }

            <!-- Review Actions -->
            <div class="d-flex gap-3 align-items-center">
              ${
                authService.isAuthenticated()
                  ? `
                <button class="btn btn-sm btn-link p-0 text-decoration-none ${
                  hasLiked ? "text-danger" : "text-muted"
                }"
                        id="like-btn-${review.id}"
                        onclick="window.toggleReviewLike('${review.id}')">
                  <i class="bi ${
                    hasLiked ? "bi-heart-fill" : "bi-heart"
                  } me-1"></i>
                  <span id="like-count-${review.id}">${
                      likeCount > 0 ? likeCount : ""
                    }</span>
                </button>
              `
                  : `
                <span class="text-muted small">
                  <i class="bi bi-heart me-1"></i>${
                    likeCount > 0 ? likeCount : ""
                  }
                </span>
              `
              }

              ${
                authService.isAuthenticated() &&
                authService.user?.id === review.user_id
                  ? `
                <button class="btn btn-sm btn-link text-danger p-0 text-decoration-none"
                        onclick="window.deleteReview('${review.id}')">
                  <i class="bi bi-trash me-1"></i>Xóa
                </button>
              `
                  : ""
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// Initialize review modal
function initializeReviewModal() {
  const modalEl = document.getElementById("reviewModal");
  if (!modalEl) return;

  reviewModal = new bootstrap.Modal(modalEl);

  // Setup rating input
  const ratingStars = document.querySelectorAll(".rating-star");
  ratingStars.forEach((star) => {
    star.addEventListener("click", () => {
      const rating = parseInt(star.dataset.rating);
      setRating(rating);
    });

    star.addEventListener("mouseenter", () => {
      const rating = parseInt(star.dataset.rating);
      highlightStars(rating);
    });
  });

  document.getElementById("ratingInput").addEventListener("mouseleave", () => {
    highlightStars(selectedRating);
  });

  // Setup image upload
  const imageInput = document.getElementById("reviewImages");
  if (imageInput) {
    imageInput.addEventListener("change", handleImageSelection);
  }

  // Setup form submission
  document
    .getElementById("submitReviewBtn")
    .addEventListener("click", submitReview);

  // Reset form when modal is closed
  modalEl.addEventListener("hidden.bs.modal", () => {
    resetReviewForm();
  });
}

// Initialize buy now modal
function initializeBuyNowModal() {
  const modalEl = document.getElementById("buyNowModal");
  if (!modalEl) return;

  buyNowModal = new bootstrap.Modal(modalEl);

  // Setup form submission
  document
    .getElementById("confirmBuyNowBtn")
    .addEventListener("click", confirmBuyNow);

  // Setup saved address selection handler
  const addressSelect = document.getElementById("buyNowSavedAddressSelect");
  if (addressSelect) {
    addressSelect.addEventListener("change", (e) => {
      const selectedAddressId = e.target.value;

      if (!selectedAddressId) {
        // User selected "Enter new address", clear the form
        document.getElementById("buyNowFirstName").value = "";
        document.getElementById("buyNowLastName").value = "";
        document.getElementById("buyNowPhone").value = "";
        document.getElementById("buyNowAddress").value = "";
        document.getElementById("buyNowCity").value = "";
        document.getElementById("buyNowState").value = "";
        document.getElementById("buyNowZip").value = "";

        // Keep email from user profile if available
        if (authService.user && authService.user.email) {
          document.getElementById("buyNowEmail").value = authService.user.email;
        }
        return;
      }

      // Find and fill the selected address
      const selectedAddress = savedAddresses.find(
        (addr) => addr.id === selectedAddressId
      );
      if (selectedAddress) {
        fillBuyNowAddressForm(selectedAddress);
      }
    });
  }

  // Reset form when modal is closed
  modalEl.addEventListener("hidden.bs.modal", () => {
    document.getElementById("buyNowForm").reset();
  });
}

// Load saved addresses for Buy Now modal
async function loadBuyNowSavedAddresses() {
  try {
    if (!authService.isAuthenticated()) {
      // User not logged in, hide saved addresses section
      document.getElementById("buyNowSavedAddressesSection").style.display =
        "none";
      return;
    }

    // Fetch saved addresses
    savedAddresses = await addressService.getAddresses();

    if (savedAddresses.length === 0) {
      // No saved addresses, hide the section
      document.getElementById("buyNowSavedAddressesSection").style.display =
        "none";
      return;
    }

    // Show saved addresses section
    document.getElementById("buyNowSavedAddressesSection").style.display =
      "block";

    // Populate address select dropdown
    const addressSelect = document.getElementById("buyNowSavedAddressSelect");
    addressSelect.innerHTML = '<option value="">Nhập địa chỉ mới...</option>';

    savedAddresses.forEach((address) => {
      const option = document.createElement("option");
      option.value = address.id;
      option.textContent = `${address.first_name} ${address.last_name} - ${
        address.address_line1
      }, ${address.city}${address.is_default ? " (Mặc định)" : ""}`;
      addressSelect.appendChild(option);
    });

    // Auto-select default address if exists
    const defaultAddress = savedAddresses.find((addr) => addr.is_default);
    if (defaultAddress) {
      addressSelect.value = defaultAddress.id;
      fillBuyNowAddressForm(defaultAddress);
    }
  } catch (error) {
    console.error("Failed to load saved addresses for Buy Now:", error);
    // Don't show error to user, just hide the section
    document.getElementById("buyNowSavedAddressesSection").style.display =
      "none";
  }
}

// Fill Buy Now address form with selected address data - Vietnamese format
function fillBuyNowAddressForm(address) {
  document.getElementById("buyNowFirstName").value = address.first_name || "";
  document.getElementById("buyNowLastName").value = address.last_name || "";
  if (authService.user && authService.user.email) {
    document.getElementById("buyNowEmail").value = authService.user.email;
  }
  document.getElementById("buyNowPhone").value = address.phone || "";
  document.getElementById("buyNowAddress").value = address.address_line1 || ""; // Số nhà + Tên đường
  document.getElementById("buyNowCity").value = address.city || ""; // Phường/Xã
  document.getElementById("buyNowState").value = address.state_province || ""; // Quận/Huyện
  document.getElementById("buyNowZip").value = address.country_code || ""; // Tỉnh/Thành phố
}

// Confirm buy now and create order
async function confirmBuyNow() {
  console.log("[confirmBuyNow] Called");

  // Validate form
  const form = document.getElementById("buyNowForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Get shipping info from form
  const shippingInfo = {
    firstName: document.getElementById("buyNowFirstName").value.trim(),
    lastName: document.getElementById("buyNowLastName").value.trim(),
    email: document.getElementById("buyNowEmail").value.trim(),
    phone: document.getElementById("buyNowPhone").value.trim(),
    address: document.getElementById("buyNowAddress").value.trim(),
    city: document.getElementById("buyNowCity").value.trim(),
    state: document.getElementById("buyNowState").value.trim(),
    zip: document.getElementById("buyNowZip").value.trim(),
  };

  console.log("[confirmBuyNow] Shipping info:", shippingInfo);

  const button = document.getElementById("confirmBuyNowBtn");
  const originalText = button.innerHTML;
  const originalWidth = button.offsetWidth;

  button.disabled = true;
  button.style.width = `${originalWidth}px`;
  button.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

  try {
    console.log("[confirmBuyNow] Creating buy now checkout session...");
    const result = await orderService.createBuyNowCheckout(
      currentProduct.id,
      selectedVariant.id,
      quantity,
      shippingInfo
    );

    console.log("[confirmBuyNow] Checkout session created:", result);

    if (result.checkoutUrl) {
      console.log(
        "[confirmBuyNow] Redirecting to Stripe checkout:",
        result.checkoutUrl
      );
      // Redirect to Stripe checkout
      window.location.href = result.checkoutUrl;
    } else {
      throw new Error("Không nhận được URL thanh toán");
    }
  } catch (error) {
    console.error("[confirmBuyNow] Error:", error);
    showToast(
      error.message || "Không thể tạo đơn hàng. Vui lòng thử lại.",
      "danger"
    );
    button.disabled = false;
    button.innerHTML = originalText;
    button.style.width = "";
  }
}

// Set rating value
function setRating(rating) {
  selectedRating = rating;
  document.getElementById("ratingValue").value = rating;
  highlightStars(rating);
}

// Highlight stars up to rating
function highlightStars(rating) {
  const stars = document.querySelectorAll(".rating-star");
  stars.forEach((star, index) => {
    if (index < rating) {
      star.classList.remove("bi-star");
      star.classList.add("bi-star-fill", "text-warning");
    } else {
      star.classList.remove("bi-star-fill", "text-warning");
      star.classList.add("bi-star");
    }
  });
}

// Open review modal
window.openReviewModal = async function () {
  if (!authService.isAuthenticated()) {
    showToast("Vui lòng đăng nhập để viết đánh giá", "warning");
    setTimeout(() => {
      window.location.href =
        "/login.html?redirect=" + encodeURIComponent(window.location.href);
    }, 1500);
    return;
  }

  // Check if user can review
  try {
    const eligibility = await reviewService.checkReviewEligibility(
      currentProduct.id
    );
    if (!eligibility.canReview) {
      showToast(
        eligibility.reason || "Bạn không thể đánh giá sản phẩm này",
        "warning"
      );
      return;
    }

    reviewModal.show();
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    showToast("Không thể kiểm tra điều kiện đánh giá", "danger");
  }
};

// Handle image selection
function handleImageSelection(event) {
  const files = Array.from(event.target.files);
  const maxFiles = 5;
  const maxSize = 5 * 1024 * 1024; // 5MB

  // Validate file count
  if (files.length > maxFiles) {
    showToast(`Chỉ được chọn tối đa ${maxFiles} hình ảnh`, "warning");
    event.target.value = "";
    return;
  }

  // Validate file sizes
  const oversizedFiles = files.filter((file) => file.size > maxSize);
  if (oversizedFiles.length > 0) {
    showToast("Mỗi hình ảnh không được vượt quá 5MB", "warning");
    event.target.value = "";
    return;
  }

  reviewImageFiles = files;
  displayImagePreviews(files);
}

// Display image previews
function displayImagePreviews(files) {
  const container = document.getElementById("reviewImagePreviews");
  container.innerHTML = "";

  files.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const preview = document.createElement("div");
      preview.className = "position-relative";
      preview.style.width = "80px";
      preview.style.height = "80px";
      preview.innerHTML = `
        <img src="${e.target.result}" class="img-thumbnail"
             style="width: 100%; height: 100%; object-fit: cover;">
        <button type="button" class="btn btn-sm btn-danger position-absolute top-0 end-0"
                style="padding: 0.125rem 0.25rem; font-size: 0.75rem;"
                onclick="window.removeReviewImage(${index})">
          <i class="bi bi-x"></i>
        </button>
      `;
      container.appendChild(preview);
    };
    reader.readAsDataURL(file);
  });
}

// Remove review image
window.removeReviewImage = function (index) {
  const dt = new DataTransfer();
  const input = document.getElementById("reviewImages");
  const files = Array.from(input.files);

  files.forEach((file, i) => {
    if (i !== index) {
      dt.items.add(file);
    }
  });

  input.files = dt.files;
  reviewImageFiles = Array.from(dt.files);
  displayImagePreviews(reviewImageFiles);
};

// Submit review
async function submitReview() {
  const rating = parseInt(document.getElementById("ratingValue").value);
  const title = document.getElementById("reviewTitle").value.trim();
  const reviewText = document.getElementById("reviewText").value.trim();

  if (!rating || rating < 1 || rating > 5) {
    showToast("Vui lòng chọn số sao đánh giá", "warning");
    return;
  }

  const submitBtn = document.getElementById("submitReviewBtn");
  const originalText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML =
    '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

  try {
    // Upload images if any
    let imageUrls = [];
    if (reviewImageFiles.length > 0) {
      submitBtn.innerHTML =
        '<span class="spinner-border spinner-border-sm me-2"></span>Đang tải ảnh...';

      for (const file of reviewImageFiles) {
        const url = await reviewService.uploadReviewImage(file);
        imageUrls.push(url);
      }
    }

    submitBtn.innerHTML =
      '<span class="spinner-border spinner-border-sm me-2"></span>Đang gửi...';

    await reviewService.createReview(
      currentProduct.id,
      rating,
      title,
      reviewText,
      null,
      imageUrls
    );

    showToast("Đã gửi đánh giá thành công!", "success");
    reviewModal.hide();
    resetReviewForm();

    // Reload reviews
    await loadReviews(currentProduct.id);
  } catch (error) {
    console.error("Error submitting review:", error);
    showToast(error.message || "Không thể gửi đánh giá", "danger");
  } finally {
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalText;
  }
}

// Reset review form
function resetReviewForm() {
  document.getElementById("reviewForm").reset();
  document.getElementById("ratingValue").value = "";
  selectedRating = 0;
  highlightStars(0);
  reviewImageFiles = [];
  document.getElementById("reviewImagePreviews").innerHTML = "";
}

// Toggle review like (heart functionality)
window.toggleReviewLike = async function (reviewId) {
  if (!authService.isAuthenticated()) {
    showToast("Vui lòng đăng nhập để thích đánh giá", "warning");
    return;
  }

  try {
    const result = await reviewService.toggleLike(reviewId);

    // Update UI immediately
    const likeBtn = document.getElementById(`like-btn-${reviewId}`);
    const likeCount = document.getElementById(`like-count-${reviewId}`);
    const icon = likeBtn.querySelector("i");

    if (result.liked) {
      likeBtn.classList.remove("text-muted");
      likeBtn.classList.add("text-danger");
      icon.classList.remove("bi-heart");
      icon.classList.add("bi-heart-fill");
    } else {
      likeBtn.classList.remove("text-danger");
      likeBtn.classList.add("text-muted");
      icon.classList.remove("bi-heart-fill");
      icon.classList.add("bi-heart");
    }

    likeCount.textContent =
      result.helpful_count > 0 ? result.helpful_count : "";
  } catch (error) {
    console.error("Error toggling review like:", error);
    showToast("Không thể cập nhật", "danger");
  }
};

// Open image modal (for review images)
window.openImageModal = function (imageUrl) {
  // Create a simple modal to display the full image
  const existingModal = document.getElementById("imageViewModal");
  if (existingModal) {
    existingModal.remove();
  }

  const modalHtml = `
    <div class="modal fade" id="imageViewModal" tabindex="-1">
      <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
          <div class="modal-header border-0">
            <button type="button" class="btn-close" data-bs-dismiss="modal"></button>
          </div>
          <div class="modal-body text-center">
            <img src="${imageUrl}" class="img-fluid" alt="Review image">
          </div>
        </div>
      </div>
    </div>
  `;

  document.body.insertAdjacentHTML("beforeend", modalHtml);
  const modal = new bootstrap.Modal(document.getElementById("imageViewModal"));
  modal.show();

  // Remove modal from DOM when hidden
  document
    .getElementById("imageViewModal")
    .addEventListener("hidden.bs.modal", function () {
      this.remove();
    });
};

// Delete review
window.deleteReview = async function (reviewId) {
  const confirmed = await Dialog.confirm(
    "Bạn có chắc chắn muốn xóa đánh giá này? Hành động này không thể hoàn tác.",
    {
      title: "Xóa Đánh Giá",
      confirmText: "Xóa",
      cancelText: "Hủy",
      confirmClass: "btn-danger",
    }
  );

  if (!confirmed) {
    return;
  }

  try {
    await reviewService.deleteReview(reviewId);
    showToast("Đã xóa đánh giá thành công", "success");

    // Reload reviews
    await loadReviews(currentProduct.id);
  } catch (error) {
    console.error("Error deleting review:", error);
    showToast("Không thể xóa đánh giá", "danger");
  }
};
