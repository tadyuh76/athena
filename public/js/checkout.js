import { AuthService } from "/services/AuthService.js";
import { CartService } from "/services/CartService.js";
import { AddressService } from "/services/AddressService.js";
import { DiscountService } from "/services/DiscountService.js";
import { Dialog } from "/js/dialog.js";

// Initialize services
const authService = new AuthService();
const cartService = new CartService();
const addressService = new AddressService();

// State
let cart = null;
let cartSummary = null;
let savedAddresses = [];
let appliedDiscount = null;

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Allow guest checkout: don't force login here. Load summary and user info if available.
    await loadOrderSummary();
    await loadUserInfo();
    await loadSavedAddresses();
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

// Load saved addresses for logged-in users
async function loadSavedAddresses() {
  try {
    const user = authService.getUser();
    if (!user) {
      // User not logged in, hide saved addresses section
      document.getElementById("savedAddressesSection").style.display = "none";
      return;
    }

    // Fetch saved addresses
    savedAddresses = await addressService.getAddresses();

    if (savedAddresses.length === 0) {
      // No saved addresses, hide the section
      document.getElementById("savedAddressesSection").style.display = "none";
      return;
    }

    // Show saved addresses section
    document.getElementById("savedAddressesSection").style.display = "block";

    // Populate address select dropdown
    const addressSelect = document.getElementById("savedAddressSelect");
    addressSelect.innerHTML = '<option value="">Nhập địa chỉ mới...</option>';

    savedAddresses.forEach((address) => {
      const option = document.createElement("option");
      option.value = address.id;
      option.textContent = `${address.first_name} ${address.last_name} - ${address.address_line1}, ${address.city}${address.is_default ? " (Mặc định)" : ""}`;
      addressSelect.appendChild(option);
    });

    // Auto-select default address if exists
    const defaultAddress = savedAddresses.find((addr) => addr.is_default);
    if (defaultAddress) {
      addressSelect.value = defaultAddress.id;
      fillAddressForm(defaultAddress);
    }
  } catch (error) {
    console.error("Failed to load saved addresses:", error);
    // Don't show error to user, just hide the section
    document.getElementById("savedAddressesSection").style.display = "none";
  }
}

// Fill address form with selected address data - Vietnamese format
function fillAddressForm(address) {
  document.getElementById("firstName").value = address.first_name || "";
  document.getElementById("lastName").value = address.last_name || "";
  document.getElementById("phone").value = address.phone || "";
  document.getElementById("address").value = address.address_line1 || ""; // Số nhà + Tên đường
  document.getElementById("city").value = address.city || ""; // Phường/Xã
  document.getElementById("state").value = address.state_province || ""; // Quận/Huyện
  document.getElementById("zip").value = address.country_code || ""; // Tỉnh/Thành phố
}

// Setup event listeners
function setupEventListeners() {
  // Handle form submission
  document
    .getElementById("placeOrderBtn")
    .addEventListener("click", handlePlaceOrder);

  // Handle discount code
  document.getElementById("applyDiscountBtn").addEventListener("click", applyDiscountCode);
  document.getElementById("discountCode").addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      applyDiscountCode();
    }
  });
  document.getElementById("removeDiscountBtn").addEventListener("click", removeDiscount);

  // Handle saved address selection
  const addressSelect = document.getElementById("savedAddressSelect");
  if (addressSelect) {
    addressSelect.addEventListener("change", (e) => {
      const selectedAddressId = e.target.value;

      if (!selectedAddressId) {
        // User selected "Enter new address", clear the form
        document.getElementById("firstName").value = "";
        document.getElementById("lastName").value = "";
        document.getElementById("phone").value = "";
        document.getElementById("address").value = "";
        document.getElementById("city").value = "";
        document.getElementById("state").value = "";
        document.getElementById("zip").value = "";

        // Keep email from user profile if available
        const user = authService.getUser();
        if (user) {
          document.getElementById("email").value = user.email || "";
        }
        return;
      }

      // Find and fill the selected address
      const selectedAddress = savedAddresses.find(
        (addr) => addr.id === selectedAddressId
      );
      if (selectedAddress) {
        fillAddressForm(selectedAddress);
      }
    });
  }
}

// Render order summary
function renderOrderSummary() {
  const orderItems = document.getElementById("orderItems");
  const subtotalEl = document.getElementById("subtotal");
  const shippingEl = document.getElementById("shipping");
  const taxEl = document.getElementById("tax");
  const discountEl = document.getElementById("discount");
  const discountRow = document.getElementById("discountRow");
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

  // Calculate totals with discount
  let discount = 0;
  if (appliedDiscount) {
    discount = appliedDiscount.discountAmount || 0;
  }

  const total = Math.max(0, cartSummary.subtotal + cartSummary.shipping + cartSummary.tax - discount);

  // Update summary
  subtotalEl.textContent = `$${cartSummary.subtotal.toFixed(2)}`;
  shippingEl.textContent =
    cartSummary.shipping === 0 ? "Miễn Phí" : `$${cartSummary.shipping.toFixed(2)}`;
  taxEl.textContent = `$${cartSummary.tax.toFixed(2)}`;

  // Show/hide discount row
  if (appliedDiscount) {
    discountEl.textContent = `$${discount.toFixed(2)}`;
    document.getElementById("discountCodeLabel").textContent = `(${appliedDiscount.discount.code || 'Mã giảm giá'})`;
    discountRow.style.display = "flex";
  } else {
    discountRow.style.display = "none";
  }

  totalEl.textContent = `$${total.toFixed(2)}`;
}

// Apply discount code
async function applyDiscountCode() {
  const discountCodeInput = document.getElementById("discountCode");
  const code = discountCodeInput.value.trim();
  const messageEl = document.getElementById("discountMessage");

  if (!code) {
    messageEl.innerHTML = '<small class="text-danger">Vui lòng nhập mã giảm giá</small>';
    return;
  }

  // Disable button while processing
  const applyBtn = document.getElementById("applyDiscountBtn");
  applyBtn.disabled = true;
  applyBtn.innerHTML = '<span class="spinner-border spinner-border-sm"></span>';

  try {
    // Prepare cart items for discount validation
    const items = cart.items.map(item => ({
      product_id: item.product.id,
      category_id: item.product.category_id,
      collection_id: item.product.collection_id,
      quantity: item.quantity,
      price: item.price_at_time
    }));

    // Validate discount
    const result = await DiscountService.validateDiscount(code, items, cartSummary.subtotal);

    // Store applied discount
    appliedDiscount = result;

    // Update UI
    renderOrderSummary();
    messageEl.innerHTML = `<small class="text-success"><i class="bi bi-check-circle"></i> ${result.message}</small>`;
    discountCodeInput.disabled = true;
    applyBtn.style.display = "none";

  } catch (error) {
    console.error('Error applying discount:', error);
    messageEl.innerHTML = `<small class="text-danger"><i class="bi bi-exclamation-circle"></i> ${error.message}</small>`;
  } finally {
    applyBtn.disabled = false;
    applyBtn.innerHTML = 'Áp dụng';
  }
}

// Remove discount
function removeDiscount() {
  appliedDiscount = null;
  document.getElementById("discountCode").value = "";
  document.getElementById("discountCode").disabled = false;
  document.getElementById("applyDiscountBtn").style.display = "inline-block";
  document.getElementById("discountMessage").innerHTML = "";
  renderOrderSummary();
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
    // Calculate final total with discount
    let discount = 0;
    if (appliedDiscount) {
      discount = appliedDiscount.discountAmount || 0;
    }
    const finalTotal = Math.max(0, cartSummary.subtotal + cartSummary.shipping + cartSummary.tax - discount);

    // Show confirmation dialog with correct total
    const confirmed = await Dialog.confirm(
      `Bạn có chắc chắn muốn đặt hàng với tổng giá trị $${finalTotal.toFixed(2)}?`,
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

  // Include discount code if applied
  if (appliedDiscount && appliedDiscount.discount) {
    body.discountCode = appliedDiscount.discount.code;
  }

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
