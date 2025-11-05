// Customer Order Tracking
import { AuthService } from '/services/AuthService.js';

const authService = new AuthService();
let userOrders = [];

document.addEventListener('DOMContentLoaded', async () => {
  if (!authService.isAuthenticated()) {
    window.location.href = '/login.html?redirect=/account.html';
    return;
  }

  await loadOrders();
});

async function loadOrders() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/orders/me', {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    const data = await response.json();

    if (data.success) {
      userOrders = data.orders;
      renderOrders();
    }
  } catch (error) {
    console.error('Lỗi tải đơn hàng:', error);
    showError('Không thể tải danh sách đơn hàng');
  }
}

function renderOrders() {
  const container = document.getElementById('ordersList');
  const noOrders = document.getElementById('noOrders');

  if (!userOrders || userOrders.length === 0) {
    container.innerHTML = '';
    noOrders.style.display = 'block';
    return;
  }

  noOrders.style.display = 'none';
  container.innerHTML = userOrders.map(order => `
    <div class="order-card mb-3">
      <div class="order-header">
        <div>
          <h5>${order.order_number}</h5>
          <small class="text-muted">${new Date(order.created_at).toLocaleDateString('vi-VN')}</small>
        </div>
        <div>
          <span class="badge bg-${getStatusColor(order.status)}">${getStatusText(order.status)}</span>
        </div>
      </div>
      <div class="order-body">
        <p><strong>Tổng tiền:</strong> ${formatPrice(order.total_amount)}</p>
        <p><strong>Thanh toán:</strong> ${getPaymentStatusText(order.payment_status)}</p>
        ${order.estimated_delivery_date ? `<p><strong>Dự kiến giao:</strong> ${new Date(order.estimated_delivery_date).toLocaleDateString('vi-VN')}</p>` : ''}
        ${renderTrackingInfo(order)}
      </div>
      <div class="order-footer">
        <button class="btn btn-sm btn-outline-primary" onclick="viewOrderDetails('${order.id}')">
          Chi tiết đơn hàng
        </button>
      </div>
    </div>
  `).join('');
}

function renderTrackingInfo(order) {
  const steps = [
    { status: 'processing', label: 'Đang xử lý', icon: 'clock' },
    { status: 'confirmed', label: 'Đã xác nhận', icon: 'check-circle' },
    { status: 'shipped', label: 'Đang giao', icon: 'truck' },
    { status: 'delivered', label: 'Đã giao', icon: 'box-seam' },
  ];

  const currentIndex = steps.findIndex(s => s.status === order.status);

  return `
    <div class="tracking-steps mt-3">
      ${steps.map((step, index) => `
        <div class="tracking-step ${index <= currentIndex ? 'active' : ''}">
          <div class="step-icon">
            <i class="bi bi-${step.icon}"></i>
          </div>
          <div class="step-label">${step.label}</div>
        </div>
      `).join('')}
    </div>
  `;
}

function getStatusText(status) {
  const map = {
    pending: 'Chờ xử lý',
    processing: 'Đang xử lý',
    confirmed: 'Đã xác nhận',
    shipped: 'Đang giao',
    delivered: 'Đã giao',
    cancelled: 'Đã hủy',
  };
  return map[status] || status;
}

function getStatusColor(status) {
  const map = {
    pending: 'warning',
    processing: 'info',
    confirmed: 'primary',
    shipped: 'primary',
    delivered: 'success',
    cancelled: 'danger',
  };
  return map[status] || 'secondary';
}

function getPaymentStatusText(status) {
  const map = {
    pending: 'Chờ thanh toán',
    processing: 'Đang xử lý',
    paid: 'Đã thanh toán',
    failed: 'Thất bại',
  };
  return map[status] || status;
}

function formatPrice(price) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price * 1000);
}

async function viewOrderDetails(orderId) {
  window.location.href = `/order-details.html?id=${orderId}`;
}

function showError(message) {
  const container = document.getElementById('ordersList');
  container.innerHTML = `
    <div class="alert alert-danger">
      <i class="bi bi-exclamation-triangle me-2"></i>
      ${message}
    </div>
  `;
}

window.loadOrders = loadOrders;
window.viewOrderDetails = viewOrderDetails;
