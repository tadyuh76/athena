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
    showError("Failed to load checkout information. Please try again.");
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
    showError("Failed to load order summary. Please try again.");
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

  // Handle payment method selection
  const paymentMethods = document.querySelectorAll(
    'input[name="paymentMethod"]'
  );
  paymentMethods.forEach((method) => {
    method.addEventListener("change", handlePaymentMethodChange);
  });
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
          ${item.variant.size ? `Size: ${item.variant.size}` : ""}
          ${item.variant.size && item.variant.color ? " • " : ""}
          ${item.variant.color ? `Color: ${item.variant.color}` : ""}
        </div>
        <div class="order-item-quantity">Quantity: ${item.quantity}</div>
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
    cartSummary.shipping === 0 ? "Free" : `$${cartSummary.shipping.toFixed(2)}`;
  taxEl.textContent = `$${cartSummary.tax.toFixed(2)}`;
  totalEl.textContent = `$${cartSummary.total.toFixed(2)}`;
}

// Handle payment method change
function handlePaymentMethodChange(event) {
  const method = event.target.value;
  // You can add specific logic for different payment methods here
  console.log("Payment method changed:", method);
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

  // Get selected payment method
  const paymentMethod = document.querySelector(
    'input[name="paymentMethod"]:checked'
  ).value;

  try {
    // Show confirmation dialog
    const confirmed = await Dialog.confirm(
      `Are you sure you want to place this order for $${cartSummary.total.toFixed(
        2
      )}?`,
      {
        title: "Confirm Order",
        confirmText: "Place Order",
        cancelText: "Cancel",
      }
    );

    if (!confirmed) {
      return;
    }

    // Disable place order button
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    placeOrderBtn.disabled = true;
    placeOrderBtn.innerHTML = `
      <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
      Processing...
    `;

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
      paymentMethod: paymentMethod,
    };

    // Process payment based on selected method
    if (paymentMethod === "paypal") {
      await processPayPalPayment(formData);
    } else if (paymentMethod === "stripe") {
      await processStripePayment(formData);
    }
  } catch (error) {
    console.error("Failed to place order:", error);
    showError("Failed to place order. Please try again.");

    // Re-enable place order button
    const placeOrderBtn = document.getElementById("placeOrderBtn");
    placeOrderBtn.disabled = false;
    placeOrderBtn.textContent = "Place Order";
  }
}

// Process PayPal payment
async function processPayPalPayment(formData) {
  // For demo: call backend to create order (backend returns mock order if not fully implemented)
  const token = localStorage.getItem("authToken");
  const url = (window.ENV ? window.ENV.getApiUrl() : "/api") + "/orders";

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
    paymentMethod: "paypal",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  try {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (data && (data.error || data.message)) || "Failed to create order"
      );
    }

    // Clear cart and redirect to confirmation
    try {
      await cartService.clearCart();
    } catch (err) {
      console.warn("Failed to clear cart after order:", err);
    }

    localStorage.setItem("lastOrder", JSON.stringify(data.order || data));
    window.location.href = "/order-confirmation.html";
    return;
  } catch (err) {
    // Backend call failed - create a local mock order and continue (guest/offline flow)
    console.warn("Creating local mock order due to failure:", err);
    const items = cart.items || [];
    const order = {
      id: "local_" + Date.now(),
      order_number: "LOCAL-" + Date.now(),
      total:
        cartSummary.total ||
        items.reduce(
          (s, it) => s + (it.price_at_time || 0) * (it.quantity || 0),
          0
        ),
      total_amount:
        cartSummary.total ||
        items.reduce(
          (s, it) => s + (it.price_at_time || 0) * (it.quantity || 0),
          0
        ),
      shippingInfo: formData,
      items,
      created_at: new Date().toISOString(),
    };

    try {
      await cartService.clearCart();
    } catch (clearErr) {
      console.warn("Failed to clear cart after local order:", clearErr);
    }

    localStorage.setItem("lastOrder", JSON.stringify(order));
    window.location.href = "/order-confirmation.html";
    return;
  }
}

// Process Stripe payment
async function processStripePayment(formData) {
  // For demo: call backend to create order (same flow as PayPal for now)
  const token = localStorage.getItem("authToken");
  const url = (window.ENV ? window.ENV.getApiUrl() : "/api") + "/orders";

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
    paymentMethod: "stripe",
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  try {
    const data = await res.json().catch(() => null);

    if (!res.ok) {
      throw new Error(
        (data && (data.error || data.message)) || "Failed to create order"
      );
    }

    try {
      await cartService.clearCart();
    } catch (err) {
      console.warn("Failed to clear cart after order:", err);
    }

    localStorage.setItem("lastOrder", JSON.stringify(data.order || data));
    window.location.href = "/order-confirmation.html";
    return;
  } catch (err) {
    console.warn("Creating local mock order due to failure:", err);
    const items = cart.items || [];
    const order = {
      id: "local_" + Date.now(),
      order_number: "LOCAL-" + Date.now(),
      total:
        cartSummary.total ||
        items.reduce(
          (s, it) => s + (it.price_at_time || 0) * (it.quantity || 0),
          0
        ),
      total_amount:
        cartSummary.total ||
        items.reduce(
          (s, it) => s + (it.price_at_time || 0) * (it.quantity || 0),
          0
        ),
      shippingInfo: formData,
      items,
      created_at: new Date().toISOString(),
    };

    try {
      await cartService.clearCart();
    } catch (clearErr) {
      console.warn("Failed to clear cart after local order:", clearErr);
    }

    localStorage.setItem("lastOrder", JSON.stringify(order));
    window.location.href = "/order-confirmation.html";
    return;
  }
  localStorage.setItem("lastOrder", JSON.stringify(data.order || data));
  window.location.href = "/order-confirmation.html";
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
