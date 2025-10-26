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
    showError("Failed to load cart. Please refresh the page.");
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
          <li><a class="dropdown-item" href="/account.html"><i class="bi bi-person me-2"></i>My Account</a></li>
          <li><a class="dropdown-item" href="/orders.html"><i class="bi bi-bag me-2"></i>My Orders</a></li>
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
  } else if (authSection) {
    authSection.innerHTML = `
      <a href="/login.html" class="btn btn-outline-dark">Sign In</a>
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
    // Get cart and summary
    cart = await cartService.getCart();
    cartSummary = await cartService.getCartSummary();

    // Hide spinner if it exists
    if (loadingSpinner) {
      loadingSpinner.style.display = "none";
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
    showError("Failed to load cart. Please refresh the page.");
    console.error("Failed to load cart:", error);
  }
}

// Render empty cart
function renderEmptyCart() {
  const cartContent = document.getElementById("cartContent");
  cartContent.innerHTML = `
    <div class="empty-cart">
      <i class="bi bi-bag"></i>
      <h3>Your cart is empty</h3>
      <p class="text-muted mb-4">Looks like you haven't added anything to your cart yet.</p>
      <a href="/products.html" class="btn btn-dark">Continue Shopping</a>
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
          <h5 class="mb-3">Order Summary</h5>
          
          <div class="d-flex justify-content-between mb-2">
            <span>Subtotal (${cartSummary.itemCount} items)</span>
            <span>$${cartSummary.subtotal.toFixed(2)}</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span>Shipping</span>
            <span>${
              cartSummary.shipping === 0
                ? "Free"
                : "$" + cartSummary.shipping.toFixed(2)
            }</span>
          </div>
          
          <div class="d-flex justify-content-between mb-2">
            <span>Tax</span>
            <span>$${cartSummary.tax.toFixed(2)}</span>
          </div>
          
          ${
            cartSummary.discount > 0
              ? `
            <div class="d-flex justify-content-between mb-2 text-success">
              <span>Discount</span>
              <span>-$${cartSummary.discount.toFixed(2)}</span>
            </div>
          `
              : ""
          }
          
          <hr>
          
          <div class="d-flex justify-content-between mb-3">
            <strong>Total</strong>
            <strong>$${cartSummary.total.toFixed(2)}</strong>
          </div>
          
          ${
            cartSummary.shipping === 0 && cartSummary.subtotal < 150
              ? `
            <div class="alert alert-info small">
              <i class="bi bi-info-circle me-1"></i>
              Add $${(150 - cartSummary.subtotal).toFixed(
                2
              )} more for free shipping
            </div>
          `
              : ""
          }
          
          <button class="btn btn-dark w-100 mb-3" onclick="proceedToCheckout()">
            Proceed to Checkout
          </button>
          
          <a href="/products.html" class="btn btn-outline-secondary w-100">
            Continue Shopping
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
  const primaryImage = product.images?.find(img => img.is_primary) || product.images?.[0];
  const imageUrl = primaryImage?.url || product.featured_image_url || "/images/placeholder-user.jpg";

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
            ${variant.size ? `Size: ${variant.size}` : ""}
            ${variant.size && variant.color ? " • " : ""}
            ${variant.color ? `Color: ${variant.color}` : ""}
          </p>
          <p class="text-muted small mb-0">SKU: ${variant.sku}</p>
          ${
            !isInStock
              ? '<p class="text-danger small mb-0">Out of stock</p>'
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
          )} each</p>
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
    showToast("Quantity updated", "success");
  } catch (error) {
    console.error("Failed to update quantity:", error);
    showToast("Failed to update quantity", "danger");
  }
};

// Remove item from cart
window.removeItem = async function (itemId) {
  const confirmed = await Dialog.confirm(
    "Are you sure you want to remove this item from your cart?",
    {
      title: "Remove Item",
      confirmText: "Remove",
      cancelText: "Cancel",
      confirmClass: "btn-danger"
    }
  );

  if (!confirmed) {
    return;
  }

  try {
    showLoading(itemId);
    await cartService.removeItem(itemId);
    showToast("Item removed from cart", "success");
    // Refresh cart after showing success message
    await loadCart();
    await updateCartCount();
  } catch (error) {
    console.error("Failed to remove item:", error);
    showToast("Failed to remove item", "danger");
    // Reload cart anyway to show current state
    await loadCart();
  }
};

// Proceed to checkout
window.proceedToCheckout = function () {
  if (!authService.isAuthenticated()) {
    window.location.href =
      "/login.html?redirect=" + encodeURIComponent("/checkout.html");
    return;
  }

  // For now, show a message that checkout is coming soon
  showToast("Checkout functionality coming soon!", "info");
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
