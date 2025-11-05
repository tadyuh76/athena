import { AuthService } from "/services/AuthService.js";
import { CartService } from "/services/CartService.js";
import { Dialog } from "/js/dialog.js";

// Initialize services
const authService = new AuthService();
const cartService = new CartService();

// State
let cart = null;
let cartSummary = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Allow guest checkout: don't force login here. Load summary and user info if available.
    await loadOrderSummary();
    await loadUserInfo();
    setupEventListeners();
  } catch (error) {
    console.error("Failed to initialize checkout:", error);
    showError("Không thể tải thông tin thanh toán. Vui lòng thử lại.");
  }
});

// Load order summary
async function loadOrderSummary() {
  try {
    cart = await cartService.getCart();
    cartSummary = await cartService.getCartSummary();

    // Check if cart is empty
    if (!cart || !cart.items || cart.items.length === 0) {
      window.location.href = "/cart.html";
      return;
    }

    renderOrderSummary();
  } catch (error) {
    console.error("Failed to load order summary:", error);
    showError("Không thể tải tóm tắt đơn hàng. Vui lòng thử lại.");
  }
}

// Load user information
async function loadUserInfo() {
  try {
    const user = authService.getUser();
    if (user) {
      // Populate form fields with user information
      document.getElementById("firstName").value = user.first_name || "";
      document.getElementById("lastName").value = user.last_name || "";
      document.getElementById("email").value = user.email || "";
    }
  } catch (error) {
    console.error("Failed to load user information:", error);
  }
}

// Setup event listeners
function setupEventListeners() {
  // Handle form submission
  document
    .getElementById("placeOrderBtn")
    .addEventListener("click", handlePlaceOrder);
}

// Render order summary
function renderOrderSummary() {
  const orderItems = document.getElementById("orderItems");
  const subtotalEl = document.getElementById("subtotal");
  const shippingEl = document.getElementById("shipping");
  const taxEl = document.getElementById("tax");
  const totalEl = document.getElementById("total");

  // Render order items
  orderItems.innerHTML = cart.items
    .map(
      (item) => `
    <div class="order-item">
      <img src="${
        item.product.images?.[0]?.url ||
        item.product.featured_image_url ||
        "/images/placeholder.jpg"
      }"
           alt="${item.product.name}"
           class="order-item-image">
      <div class="order-item-details">
        <div class="order-item-name">${item.product.name}</div>
        <div class="order-item-variant">
          ${item.variant.size ? `Kích cỡ: ${item.variant.size}` : ""}
          ${item.variant.size && item.variant.color ? " • " : ""}
          ${item.variant.color ? `Màu: ${item.variant.color}` : ""}
        </div>
        <div class="order-item-quantity">Số lượng: ${item.quantity}</div>
      </div>
      <div class="order-item-price">
        $${(item.price_at_time * item.quantity).toFixed(2)}
      </div>
    </div>
  `
    )
    .join("");

  // Update summary
  subtotalEl.textContent = `$${cartSummary.subtotal.toFixed(2)}`;
  shippingEl.textContent =
    cartSummary.shipping === 0 ? "Miễn Phí" : `$${cartSummary.shipping.toFixed(2)}`;
  taxEl.textContent = `$${cartSummary.tax.toFixed(2)}`;
  totalEl.textContent = `$${cartSummary.total.toFixed(2)}`;
}

// Handle place order
async function handlePlaceOrder(event) {
  event.preventDefault();

  // Validate form
  const form = document.getElementById("shippingForm");
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  try {
    // Show confirmation dialog
    const confirmed = await Dialog.confirm(
      `Bạn có chắc chắn muốn đặt hàng với tổng giá trị $${cartSummary.total.toFixed(
        2
      )}?`,
      {
        title: "Xác Nhận Đơn Hàng",
        confirmText: "Đặt Hàng",
        cancelText: "Hủy",
      }
    );

    if (!confirmed) {
      return;
    }

    // Show processing overlay and disable place order button
    showProcessingOverlay(true);
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    placeOrderBtn.disabled = true;
    placeOrderBtn.setAttribute("aria-busy", "true");
    placeOrderBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Đang xử lý...';

    // Get form data
    const formData = {
      firstName: document.getElementById("firstName").value,
      lastName: document.getElementById("lastName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      zip: document.getElementById("zip").value,
    };

    // Create checkout session
    await createCheckoutSession(formData);
  } catch (error) {
    console.error("Failed to place order:", error);
    showToast("Không thể đặt hàng. Vui lòng thử lại.", "danger");

    // Re-enable place order button and hide overlay
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    if (placeOrderBtn) {
      placeOrderBtn.disabled = false;
      placeOrderBtn.removeAttribute("aria-busy");
      placeOrderBtn.textContent = "Đặt Hàng";
    }
    showProcessingOverlay(false);
  }
}

// Processing overlay helper
function showProcessingOverlay(show) {
  let overlay = document.getElementById("processingOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "processingOverlay";
    overlay.style = `position:fixed;inset:0;background:rgba(0,0,0,0.45);display:flex;align-items:center;justify-content:center;z-index:1050;`;
    overlay.innerHTML = `
      <div class="text-center text-white">
        <div class="spinner-border text-light" role="status" style="width:3rem;height:3rem"></div>
        <div class="mt-3">Đang xử lý đơn hàng của bạn...</div>
      </div>
    `;
    document.body.appendChild(overlay);
  }

  overlay.style.display = show ? "flex" : "none";
}

// Create Stripe Checkout Session
async function createCheckoutSession(formData) {
  const token = localStorage.getItem("authToken");
  const url = (window.ENV ? window.ENV.getApiUrl() : "/api") + "/orders/checkout-session";

  const body = {
    shippingInfo: {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      city: formData.city,
      state: formData.state,
      zip: formData.zip,
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (data && (data.error || data.message)) || "Không thể tạo phiên thanh toán"
      );
    }

    // Redirect to Stripe Checkout
    if (data.checkoutUrl) {
      window.location.href = data.checkoutUrl;
    } else {
      throw new Error("Không nhận được URL thanh toán");
    }
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    throw err;
  }
}

// Show error message
function showError(message) {
  const orderItems = document.getElementById("orderItems");
  orderItems.innerHTML = `
    <div class="alert alert-danger m-0">
      <i class="bi bi-exclamation-triangle me-2"></i>
      ${message}
    </div>
  `;
}

// Show toast notification
function showToast(message, type = "info") {
  const toastContainer = document.getElementById("toastContainer");
  const toastId = "toast-" + Date.now();

  const toastHTML = `
    <div class="toast align-items-center text-white bg-${type} border-0"
         id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast" aria-label="Close"></button>
      </div>
    </div>
  `;

  toastContainer.insertAdjacentHTML("beforeend", toastHTML);

  const toast = new bootstrap.Toast(document.getElementById(toastId));
  toast.show();
}
