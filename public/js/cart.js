import { AuthService } from "/services/AuthService.js";
import { CartService } from "/services/CartService.js";
import { ProductService } from "/services/ProductService.js";
import { Dialog } from "/js/dialog.js";

// Initialize services
const authService = new AuthService();
const cartService = new CartService();
const productService = new ProductService();

// State
let cart = null;
let cartSummary = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await initializeNavigation();
  } catch (error) {
    console.error("Failed to initialize navigation:", error);
  }

  try {
    await loadCart();
  } catch (error) {
    console.error("Failed to load cart:", error);
    showError("Không thể tải giỏ hàng. Vui lòng làm mới trang.");
  }
});

// Initialize navigation
async function initializeNavigation() {
  const user = authService.getUser();
  const authSection = document.querySelector(".navbar-auth-section");

  if (user && authSection) {
    authSection.innerHTML = `
      <div class="dropdown">
        <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown">
          <i class="bi bi-person-fill fs-5"></i>
        </a>
        <ul class="dropdown-menu dropdown-menu-end">
          <li><h6 class="dropdown-header">${
            user.first_name || user.email
          }</h6></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="/account.html"><i class="bi bi-person me-2"></i>Tài Khoản</a></li>
          <li><a class="dropdown-item" href="/orders.html"><i class="bi bi-bag me-2"></i>Đơn Hàng</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#" id="logoutBtn"><i class="bi bi-box-arrow-right me-2"></i>Đăng Xuất</a></li>
        </ul>
      </div>
    `;

    document
      .getElementById("logoutBtn")
      ?.addEventListener("click", async (e) => {
        e.preventDefault();
        await authService.logout();
      });
  } else if (authSection) {
    authSection.innerHTML = `
      <a href="/login.html" class="btn btn-outline-dark">Đăng Nhập</a>
    `;
  }

  await updateCartCount();
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

// Load cart
async function loadCart() {
  const loadingSpinner = document.getElementById("loadingSpinner");
  const cartContent = document.getElementById("cartContent");

  try {
    // Get cart and summary with a timeout fallback to avoid infinite spinner
    const timeoutMs = 4000;
    const withTimeout = (p, ms) =>
      Promise.race([
        p,
        new Promise((_, rej) =>
          setTimeout(() => rej(new Error("timeout")), ms)
        ),
      ]);

    let usedLocalFallback = false;
    try {
      cart = await withTimeout(cartService.getCart(), timeoutMs);
    } catch (err) {
      console.warn(
        "getCart timed out or failed, using local cart fallback",
        err
      );
      cart = cartService.getLocalCart
        ? { id: null, items: cartService.getLocalCart() }
        : { id: null, items: [] };
      usedLocalFallback = true;
    }

    try {
      cartSummary = await withTimeout(cartService.getCartSummary(), timeoutMs);
    } catch (err) {
      console.warn(
        "getCartSummary timed out or failed, computing local summary",
        err
      );
      cartSummary = await cartService.getCartSummary();
      usedLocalFallback = true;
    }

    // Hide spinner if it exists
    if (loadingSpinner) {
      loadingSpinner.style.display = "none";
    }

    // Show offline/demo banner if we used local fallback
    if (usedLocalFallback) {
      renderOfflineBanner();
    } else {
      removeOfflineBanner();
    }

    if (!cart || !cart.items || cart.items.length === 0) {
      renderEmptyCart();
    } else {
      renderCart();
    }
  } catch (error) {
    // Hide spinner if it exists
    if (loadingSpinner) {
      loadingSpinner.style.display = "none";
    }
    showError("Không thể tải giỏ hàng. Vui lòng làm mới trang.");
    console.error("Failed to load cart:", error);
  }
}

// Render empty cart
function renderEmptyCart() {
  const cartContent = document.getElementById("cartContent");
  cartContent.innerHTML = `
    <div class="empty-cart">
      <i class="bi bi-bag"></i>
      <h3>Giỏ hàng trống</h3>
      <p class="text-muted mb-4">Bạn chưa thêm sản phẩm nào vào giỏ hàng.</p>
      <a href="/products.html" class="btn btn-dark">Tiếp Tục Mua Sắm</a>
    </div>
  `;
}

// Render cart with items
function renderCart() {
  const cartContent = document.getElementById("cartContent");

  cartContent.innerHTML = `
    <div class="row">
      <!-- Cart Items -->
      <div class="col-lg-8">
        <div class="cart-items">
          ${cart.items.map((item) => renderCartItem(item)).join("")}
        </div>
      </div>

      <!-- Cart Summary -->
      <div class="col-lg-4">
        <div class="cart-summary">
          <h5 class="mb-3">Tóm Tắt Đơn Hàng</h5>

          <div class="d-flex justify-content-between mb-2">
            <span>Tạm tính (${cartSummary.itemCount} sản phẩm)</span>
            <span>$${cartSummary.subtotal.toFixed(2)}</span>
          </div>

          <div class="d-flex justify-content-between mb-2">
            <span>Phí vận chuyển</span>
            <span>${
              cartSummary.shipping === 0
                ? "Miễn phí"
                : "$" + cartSummary.shipping.toFixed(2)
            }</span>
          </div>

          <div class="d-flex justify-content-between mb-2">
            <span>Thuế</span>
            <span>$${cartSummary.tax.toFixed(2)}</span>
          </div>

          ${
            cartSummary.discount > 0
              ? `
            <div class="d-flex justify-content-between mb-2 text-success">
              <span>Giảm giá</span>
              <span>-$${cartSummary.discount.toFixed(2)}</span>
            </div>
          `
              : ""
          }

          <hr>

          <div class="d-flex justify-content-between mb-3">
            <strong>Tổng cộng</strong>
            <strong>$${cartSummary.total.toFixed(2)}</strong>
          </div>

          ${
            cartSummary.shipping === 0 && cartSummary.subtotal < 150
              ? `
            <div class="alert alert-info small">
              <i class="bi bi-info-circle me-1"></i>
              Thêm $${(150 - cartSummary.subtotal).toFixed(
                2
              )} để được miễn phí vận chuyển
            </div>
          `
              : ""
          }

          <button class="btn btn-dark w-100 mb-3" onclick="proceedToCheckout()">
            Thanh Toán
          </button>

          <a href="/products.html" class="btn btn-outline-secondary w-100">
            Tiếp Tục Mua Sắm
          </a>
        </div>
      </div>
    </div>
  `;
}

// Render individual cart item
function renderCartItem(item) {
  const product = item.product;
  const variant = item.variant;
  const isInStock = productService.getAvailableStock(variant) > 0;

  // Get primary image or first image from images array
  const primaryImage =
    product.images?.find((img) => img.is_primary) || product.images?.[0];
  const imageUrl =
    primaryImage?.url ||
    product.featured_image_url ||
    "/images/placeholder-user.jpg";

  return `
    <div class="cart-item" data-item-id="${item.id}">
      <div class="row align-items-center">
        <div class="col-md-2">
          <img src="${imageUrl}"
               alt="${product.name}" class="cart-item-image">
        </div>
        
        <div class="col-md-4">
          <h6 class="mb-1">
            <a href="/product-detail.html?id=${
              product.id
            }" class="text-decoration-none text-dark">
              ${product.name}
            </a>
          </h6>
          <p class="text-muted small mb-1">
            ${variant.size ? `Kích cỡ: ${variant.size}` : ""}
            ${variant.size && variant.color ? " • " : ""}
            ${variant.color ? `Màu: ${variant.color}` : ""}
          </p>
          <p class="text-muted small mb-0">SKU: ${variant.sku}</p>
          ${
            !isInStock
              ? '<p class="text-danger small mb-0">Hết hàng</p>'
              : ""
          }
        </div>
        
        <div class="col-md-2">
          <div class="quantity-controls">
            <button class="quantity-btn" onclick="updateQuantity('${
              item.id
            }', ${item.quantity - 1})" 
                    ${item.quantity <= 1 ? "disabled" : ""}>
              <i class="bi bi-dash"></i>
            </button>
            <input type="number" class="quantity-input" value="${
              item.quantity
            }" min="1" max="10"
                   onchange="updateQuantity('${item.id}', this.value)">
            <button class="quantity-btn" onclick="updateQuantity('${
              item.id
            }', ${item.quantity + 1})" 
                    ${item.quantity >= 10 || !isInStock ? "disabled" : ""}>
              <i class="bi bi-plus"></i>
            </button>
          </div>
        </div>
        
        <div class="col-md-2 text-end">
          <p class="mb-1"><strong>$${(
            item.price_at_time * item.quantity
          ).toFixed(2)}</strong></p>
          <p class="text-muted small mb-0">$${item.price_at_time.toFixed(
            2
          )} mỗi cái</p>
        </div>
        
        <div class="col-md-2 text-end">
          <button class="btn btn-sm btn-outline-danger" onclick="removeItem('${
            item.id
          }')">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </div>
    </div>
  `;
}

// Update item quantity
window.updateQuantity = async function (itemId, newQuantity) {
  const quantity = parseInt(newQuantity);

  if (quantity < 1 || quantity > 10) {
    return;
  }

  try {
    showLoading(itemId);
    await cartService.updateItemQuantity(itemId, quantity);
    await loadCart(); // Refresh cart
    await updateCartCount();
    showToast("Đã cập nhật số lượng", "success");
  } catch (error) {
    console.error("Failed to update quantity:", error);
    showToast("Không thể cập nhật số lượng", "danger");
  }
};

// Remove item from cart
window.removeItem = async function (itemId) {
  const confirmed = await Dialog.confirm(
    "Bạn có chắc chắn muốn xóa sản phẩm này khỏi giỏ hàng?",
    {
      title: "Xóa Sản Phẩm",
      confirmText: "Xóa",
      cancelText: "Hủy",
      confirmClass: "btn-danger",
    }
  );

  if (!confirmed) {
    return;
  }

  try {
    showLoading(itemId);
    await cartService.removeItem(itemId);
    showToast("Đã xóa sản phẩm khỏi giỏ hàng", "success");
    // Refresh cart after showing success message
    await loadCart();
    await updateCartCount();
  } catch (error) {
    console.error("Failed to remove item:", error);
    showToast("Không thể xóa sản phẩm", "danger");
    // Reload cart anyway to show current state
    await loadCart();
  }
};

// Proceed to checkout
window.proceedToCheckout = function () {
  // Allow guest checkout: redirect to checkout page. If user is not authenticated, mark guest flag.
  if (!authService.isAuthenticated()) {
    window.location.href = "/checkout.html?guest=true";
    return;
  }

  window.location.href = "/checkout.html";
};

// Show loading state for an item
function showLoading(itemId) {
  const itemElement = document.querySelector(`[data-item-id="${itemId}"]`);
  if (itemElement) {
    itemElement.style.opacity = "0.6";
    itemElement.style.pointerEvents = "none";
  }
}

// Show error message
function showError(message) {
  const cartContent = document.getElementById("cartContent");
  cartContent.innerHTML = `
    <div class="alert alert-danger text-center">
      <i class="bi bi-exclamation-triangle me-2"></i>
      ${message}
    </div>
  `;
}

// Offline/demo banner helpers
function renderOfflineBanner() {
  const cartContent = document.getElementById("cartContent");
  if (!cartContent) return;
  let banner = document.getElementById("cartOfflineBanner");
  if (!banner) {
    banner = document.createElement("div");
    banner.id = "cartOfflineBanner";
    banner.className =
      "alert alert-warning d-flex justify-content-between align-items-center";
    banner.innerHTML = `
      <div>
        <strong>Chế độ ngoại tuyến / Demo:</strong> Một số dữ liệu được tải từ trình duyệt. Các thao tác được lưu cục bộ.
      </div>
      <div>
        <button class="btn btn-sm btn-outline-dark me-2" id="retryCartBtn">Thử Lại API</button>
        <a href="/products.html" class="btn btn-sm btn-dark">Tiếp Tục Mua Sắm</a>
      </div>
    `;
    cartContent.insertAdjacentElement("afterbegin", banner);
    document
      .getElementById("retryCartBtn")
      .addEventListener("click", async () => {
        const ls = document.getElementById("loadingSpinner");
        if (ls) ls.style.display = "";
        try {
          cart = await cartService.getCart();
          cartSummary = await cartService.getCartSummary();
          removeOfflineBanner();
          if (!cart || !cart.items || cart.items.length === 0)
            renderEmptyCart();
          else renderCart();
          showToast("Đã kết nối lại với API", "success");
        } catch (e) {
          console.warn("Retry failed", e);
          showToast(
            "Thử lại thất bại. Vẫn đang ngoại tuyến hoặc API không khả dụng.",
            "warning"
          );
        } finally {
          if (ls) ls.style.display = "none";
        }
      });
  }
}

function removeOfflineBanner() {
  const banner = document.getElementById("cartOfflineBanner");
  if (banner) banner.remove();
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");
  const toastId = "toast-" + Date.now();

  const toastHTML = `
    <div class="toast align-items-center text-white bg-${
      type === "success" ? "success" : type === "danger" ? "danger" : "info"
    } border-0" 
         id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toastElement = document.getElementById(toastId);
  const toast = new bootstrap.Toast(toastElement);
  toast.show();

  toastElement.addEventListener("hidden.bs.toast", () => {
    toastElement.remove();
  });
}
