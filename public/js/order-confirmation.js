import { AuthService } from "/services/AuthService.js";

// Initialize services
const authService = new AuthService();

// Get order ID from URL
const urlParams = new URLSearchParams(window.location.search);
const orderId = urlParams.get('order_id');
const sessionId = urlParams.get('session_id');

console.log('[OrderConfirmation] Order ID:', orderId);
console.log('[OrderConfirmation] Session ID:', sessionId);

// Initialize page
document.addEventListener("DOMContentLoaded", async () => {
  if (!orderId) {
    showError();
    return;
  }

  try {
    await loadOrderDetails(orderId);
  } catch (error) {
    console.error('Failed to load order:', error);
    showError();
  }
});

// Load order details
async function loadOrderDetails(orderId) {
  try {
    const token = localStorage.getItem('authToken');
    const url = (window.ENV ? window.ENV.getApiUrl() : '/api') + `/orders/${orderId}`;

    const response = await fetch(url, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch order');
    }

    const data = await response.json();
    console.log('[OrderConfirmation] Order data:', data);

    if (data.success && data.order) {
      displayOrder(data.order);
    } else {
      showError();
    }
  } catch (error) {
    console.error('[OrderConfirmation] Error loading order:', error);
    showError();
  }
}

// Display order details
function displayOrder(order) {
  // Hide loading, show success
  document.getElementById('loadingState').classList.add('d-none');
  document.getElementById('successState').classList.remove('d-none');

  // Order number and basic info
  document.getElementById('orderNumber').textContent = order.order_number || order.id;

  // Format date
  const orderDate = new Date(order.created_at);
  document.getElementById('orderDate').textContent = orderDate.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  // Total
  document.getElementById('orderTotal').textContent = `$${order.total_amount.toFixed(2)}`;

  // Email
  document.getElementById('orderEmail').textContent = order.customer_email || '-';

  // Payment status
  const paymentStatusEl = document.getElementById('paymentStatus');
  if (order.payment_status === 'paid') {
    paymentStatusEl.textContent = 'Đã Thanh Toán';
    paymentStatusEl.className = 'badge bg-success';
  } else if (order.payment_status === 'pending') {
    paymentStatusEl.textContent = 'Đang Chờ';
    paymentStatusEl.className = 'badge bg-warning';
  } else {
    paymentStatusEl.textContent = 'Chưa Thanh Toán';
    paymentStatusEl.className = 'badge bg-secondary';
  }

  // Order items
  if (order.items && order.items.length > 0) {
    const itemsHtml = order.items.map(item => `
      <div class="d-flex align-items-center mb-3 pb-3 border-bottom">
        <img src="${item.product_image_url || '/images/placeholder.jpg'}"
             alt="${item.product_name}"
             style="width: 80px; height: 80px; object-fit: cover; border-radius: 8px;"
             class="me-3">
        <div class="flex-grow-1">
          <h6 class="mb-1">${item.product_name}</h6>
          <div class="text-muted small">
            ${item.variant_title ? `<span>${item.variant_title}</span> • ` : ''}
            <span>Số lượng: ${item.quantity}</span>
          </div>
        </div>
        <div class="text-end">
          <div class="fw-bold">$${item.total_price.toFixed(2)}</div>
          <div class="text-muted small">$${item.unit_price.toFixed(2)} mỗi cái</div>
        </div>
      </div>
    `).join('');

    document.getElementById('orderItems').innerHTML = itemsHtml;
  }

  // Shipping address
  if (order.shipping_address) {
    const addr = Array.isArray(order.shipping_address)
      ? order.shipping_address[0]
      : order.shipping_address;

    const addressHtml = `
      <div>
        <strong>${addr.first_name} ${addr.last_name}</strong><br>
        ${addr.address_line1}<br>
        ${addr.address_line2 ? `${addr.address_line2}<br>` : ''}
        ${addr.city}, ${addr.state_province || addr.state} ${addr.postal_code}<br>
        ${addr.country_code || 'US'}<br>
        ${addr.phone ? `<span class="text-muted">Điện thoại: ${addr.phone}</span>` : ''}
      </div>
    `;

    document.getElementById('shippingAddress').innerHTML = addressHtml;
  }
}

// Show error state
function showError() {
  document.getElementById('loadingState').classList.add('d-none');
  document.getElementById('errorState').classList.remove('d-none');
}
