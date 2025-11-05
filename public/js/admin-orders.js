import { AuthService } from "/services/AuthService.js";
import { Dialog } from "/js/dialog.js";

// Initialize services
const authService = new AuthService();
const API_URL = window.ENV ? window.ENV.getApiUrl() : '/api';

// State
let orders = [];
let currentPage = 1;
let totalOrders = 0;
let limit = 20;
let filters = {
  search: '',
  status: '',
  fromDate: '',
  toDate: ''
};
let sortBy = 'created_at';
let sortOrder = 'desc';

// Initialize flag to prevent double initialization
let isInitialized = false;

// Function to initialize orders management
async function initializeOrdersManagement() {
  if (isInitialized) {
    // If already initialized, just reload orders
    await loadOrders();
    return;
  }

  // Check if user is admin
  if (!authService.isAuthenticated()) {
    return;
  }

  const user = authService.getUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    return;
  }

  initializeEventListeners();
  isInitialized = true;
  await loadOrders();
}

// Initialize page when DOM is loaded (for standalone page)
document.addEventListener("DOMContentLoaded", async () => {
  // Only initialize if this is the standalone admin-orders.html page
  if (window.location.pathname.includes('admin-orders.html')) {
    // Check if user is admin
    if (!authService.isAuthenticated()) {
      window.location.href = "/login.html?redirect=" + encodeURIComponent(window.location.href);
      return;
    }

    const user = authService.getUser();
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
      await Dialog.alert("You don't have permission to access this page.", {
        title: "Access Denied"
      });
      window.location.href = "/";
      return;
    }

    await initializeOrdersManagement();
  }
});

// Listen for orders tab opened event (when integrated in admin.html)
window.addEventListener('ordersTabOpened', async () => {
  await initializeOrdersManagement();
});

// Initialize event listeners
function initializeEventListeners() {
  // Filters
  document.getElementById('applyFiltersBtn').addEventListener('click', applyFilters);
  document.getElementById('resetFiltersBtn').addEventListener('click', resetFilters);
  document.getElementById('refreshBtn').addEventListener('click', () => loadOrders());

  // Search on Enter key
  document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      applyFilters();
    }
  });

  // Sorting
  document.querySelectorAll('.sortable').forEach(th => {
    th.addEventListener('click', () => {
      const field = th.dataset.sort;
      if (sortBy === field) {
        sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        sortBy = field;
        sortOrder = 'desc';
      }
      updateSortIndicators();
      loadOrders();
    });
  });
}

// Apply filters
function applyFilters() {
  filters.search = document.getElementById('searchInput').value.trim();
  filters.status = document.getElementById('statusFilter').value;
  filters.fromDate = document.getElementById('fromDate').value;
  filters.toDate = document.getElementById('toDate').value;

  currentPage = 1;
  loadOrders();
}

// Reset filters
function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('statusFilter').value = '';
  document.getElementById('fromDate').value = '';
  document.getElementById('toDate').value = '';

  filters = {
    search: '',
    status: '',
    fromDate: '',
    toDate: ''
  };

  currentPage = 1;
  loadOrders();
}

// Update sort indicators
function updateSortIndicators() {
  document.querySelectorAll('.sortable').forEach(th => {
    const icon = th.querySelector('i');
    th.classList.remove('active');
    icon.className = 'bi bi-chevron-expand';

    if (th.dataset.sort === sortBy) {
      th.classList.add('active');
      icon.className = sortOrder === 'asc' ? 'bi bi-chevron-up' : 'bi bi-chevron-down';
    }
  });
}

// Load orders
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = `
    <tr>
      <td colspan="6" class="text-center py-5">
        <div class="spinner-border text-secondary" role="status"></div>
        <div class="mt-2 text-muted">Loading orders...</div>
      </td>
    </tr>
  `;

  try {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
      sortBy: sortBy,
      sortOrder: sortOrder
    });

    if (filters.search) params.append('search', filters.search);
    if (filters.status) params.append('status', filters.status);
    if (filters.fromDate) params.append('dateFrom', filters.fromDate);
    if (filters.toDate) params.append('dateTo', filters.toDate);

    const response = await fetch(`${API_URL}/admin/orders?${params}`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    const data = await response.json();
    orders = data.orders || [];
    totalOrders = data.total || 0;

    renderOrders();
    updatePagination(data.page, data.totalPages);
    updateOrderCount();
  } catch (error) {
    console.error('Error loading orders:', error);
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5">
          <i class="bi bi-exclamation-triangle display-1 text-danger"></i>
          <div class="mt-3 text-muted">Failed to load orders</div>
          <button class="btn btn-sm btn-outline-primary mt-2" onclick="location.reload()">
            Retry
          </button>
        </td>
      </tr>
    `;
  }
}

// Render orders table
function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');

  if (orders.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="6" class="text-center py-5">
          <i class="bi bi-inbox display-1 text-muted"></i>
          <div class="mt-3 text-muted">No orders found</div>
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = orders.map(order => {
    // Extract shipping address (it's an array, get the first shipping address)
    const shippingAddr = order.shipping_address?.find(addr => addr) || {};
    const customerName = shippingAddr.first_name && shippingAddr.last_name
      ? `${shippingAddr.first_name} ${shippingAddr.last_name}`
      : 'N/A';
    const customerPhone = shippingAddr.phone || order.customer_phone || '';

    return `
      <tr>
        <td>
          <code class="small">${order.id.substring(0, 8)}</code>
        </td>
        <td>
          <div class="small">${formatDate(order.created_at)}</div>
          <div class="text-muted" style="font-size: 0.75rem;">${formatTime(order.created_at)}</div>
        </td>
        <td>
          <div class="fw-semibold">${customerName}</div>
          <div class="small text-muted">${order.customer_email}</div>
          ${customerPhone ? `<div class="small text-muted">${customerPhone}</div>` : ''}
        </td>
        <td>
          <span class="fw-bold">$${order.total_amount.toFixed(2)}</span>
        </td>
        <td>
          ${getStatusBadge(order.status)}
        </td>
        <td class="text-end">
          <div class="btn-group btn-group-sm">
            <button class="btn btn-outline-primary" onclick="window.viewOrder('${order.id}')">
              <i class="bi bi-eye"></i>
            </button>
            ${renderQuickActions(order)}
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

// Render quick action buttons based on order status
// Workflow: pending → preparing → shipping → delivered
function renderQuickActions(order) {
  const actions = [];

  if (order.status === 'pending') {
    // pending: can confirm (to preparing) or cancel
    actions.push(`
      <button class="btn btn-outline-success" onclick="window.confirmOrder('${order.id}')" title="Confirm & Prepare">
        <i class="bi bi-check-lg"></i>
      </button>
    `);
    actions.push(`
      <button class="btn btn-outline-danger" onclick="window.cancelOrder('${order.id}')" title="Cancel">
        <i class="bi bi-x-lg"></i>
      </button>
    `);
  } else if (order.status === 'preparing') {
    // preparing: can manually move to shipping
    actions.push(`
      <button class="btn btn-outline-info" onclick="window.shipOrder('${order.id}')" title="Start Shipping">
        <i class="bi bi-truck"></i>
      </button>
    `);
  } else if (order.status === 'shipping') {
    // shipping: can manually mark as delivered
    actions.push(`
      <button class="btn btn-outline-success" onclick="window.deliverOrder('${order.id}')" title="Mark as Delivered">
        <i class="bi bi-check2-all"></i>
      </button>
    `);
  }
  // delivered: no more actions needed

  return actions.join('');
}

// Get status badge
function getStatusBadge(status) {
  const badges = {
    pending: '<span class="badge bg-warning text-dark">Pending</span>',
    preparing: '<span class="badge bg-info">Preparing</span>',
    shipping: '<span class="badge bg-primary">Shipping</span>',
    delivered: '<span class="badge bg-success">Delivered</span>',
    cancelled: '<span class="badge bg-danger">Cancelled</span>',
    refunded: '<span class="badge bg-secondary">Refunded</span>'
  };
  return badges[status] || `<span class="badge bg-secondary">${status}</span>`;
}

// Update pagination
function updatePagination(page, totalPages) {
  const pagination = document.getElementById('pagination');
  const paginationInfo = document.getElementById('paginationInfo');

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, totalOrders);
  paginationInfo.textContent = `Showing ${start}-${end} of ${totalOrders} orders`;

  if (totalPages <= 1) {
    pagination.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `
    <li class="page-item ${page === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="window.changePage(${page - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

  // Page numbers
  const maxPages = 5;
  let startPage = Math.max(1, page - Math.floor(maxPages / 2));
  let endPage = Math.min(totalPages, startPage + maxPages - 1);

  if (endPage - startPage < maxPages - 1) {
    startPage = Math.max(1, endPage - maxPages + 1);
  }

  if (startPage > 1) {
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="window.changePage(1); return false;">1</a>
      </li>
    `;
    if (startPage > 2) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  for (let i = startPage; i <= endPage; i++) {
    html += `
      <li class="page-item ${i === page ? 'active' : ''}">
        <a class="page-link" href="#" onclick="window.changePage(${i}); return false;">${i}</a>
      </li>
    `;
  }

  if (endPage < totalPages) {
    if (endPage < totalPages - 1) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
    html += `
      <li class="page-item">
        <a class="page-link" href="#" onclick="window.changePage(${totalPages}); return false;">${totalPages}</a>
      </li>
    `;
  }

  // Next button
  html += `
    <li class="page-item ${page === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="window.changePage(${page + 1}); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  pagination.innerHTML = html;
}

// Change page
window.changePage = function(page) {
  currentPage = page;
  loadOrders();
};

// Update order count
function updateOrderCount() {
  document.getElementById('orderCount').textContent = `${totalOrders} order${totalOrders !== 1 ? 's' : ''}`;
}

// View order details
window.viewOrder = async function(orderId) {
  const modal = new bootstrap.Modal(document.getElementById('orderDetailsModal'));
  const content = document.getElementById('orderDetailsContent');

  content.innerHTML = `
    <div class="text-center py-5">
      <div class="spinner-border text-secondary" role="status"></div>
      <div class="mt-2 text-muted">Loading order details...</div>
    </div>
  `;

  modal.show();

  try {
    const response = await fetch(`${API_URL}/orders/${orderId}`, {
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to load order details');
    }

    const data = await response.json();
    const order = data.order || data;
    content.innerHTML = renderOrderDetails(order);
  } catch (error) {
    console.error('Error loading order details:', error);
    content.innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i>
        Failed to load order details
      </div>
    `;
  }
};

// Render order details
function renderOrderDetails(order) {
  // Extract shipping address (it's an array, get the first shipping address)
  const shippingAddr = order.shipping_address?.find(addr => addr) || {};
  const customerName = shippingAddr.first_name && shippingAddr.last_name
    ? `${shippingAddr.first_name} ${shippingAddr.last_name}`
    : 'N/A';
  const customerPhone = shippingAddr.phone || order.customer_phone || '';

  return `
    <div class="row g-4">
      <!-- Order Info -->
      <div class="col-md-6">
        <h6 class="fw-bold mb-3">Order Information</h6>
        <table class="table table-sm table-borderless">
          <tr>
            <td class="text-muted" style="width: 120px;">Order ID:</td>
            <td><code>${order.id}</code></td>
          </tr>
          <tr>
            <td class="text-muted">Date:</td>
            <td>${formatDate(order.created_at)} ${formatTime(order.created_at)}</td>
          </tr>
          <tr>
            <td class="text-muted">Status:</td>
            <td>${getStatusBadge(order.status)}</td>
          </tr>
        </table>
      </div>

      <!-- Customer Info -->
      <div class="col-md-6">
        <h6 class="fw-bold mb-3">Customer Information</h6>
        <table class="table table-sm table-borderless">
          <tr>
            <td class="text-muted" style="width: 120px;">Name:</td>
            <td>${customerName}</td>
          </tr>
          <tr>
            <td class="text-muted">Email:</td>
            <td>${order.customer_email}</td>
          </tr>
          ${customerPhone ? `
          <tr>
            <td class="text-muted">Phone:</td>
            <td>${customerPhone}</td>
          </tr>
          ` : ''}
        </table>
      </div>

      <!-- Shipping Address -->
      <div class="col-md-6">
        <h6 class="fw-bold mb-3">Shipping Address</h6>
        <address class="small">
          ${shippingAddr.address_line1 || 'N/A'}<br>
          ${shippingAddr.address_line2 ? `${shippingAddr.address_line2}<br>` : ''}
          ${shippingAddr.city || ''}, ${shippingAddr.state_province || ''} ${shippingAddr.postal_code || ''}
        </address>
      </div>

      <!-- Order Items -->
      <div class="col-12">
        <h6 class="fw-bold mb-3">Order Items</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead class="table-light">
              <tr>
                <th>Product</th>
                <th>Price</th>
                <th>Quantity</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${order.items ? order.items.map(item => `
                <tr>
                  <td>
                    <div class="fw-semibold">${item.product_name || 'Product'}</div>
                    ${item.variant_size || item.variant_color ?
                      `<div class="small text-muted">
                        ${item.variant_size ? `Size: ${item.variant_size}` : ''}
                        ${item.variant_size && item.variant_color ? ' • ' : ''}
                        ${item.variant_color ? `Color: ${item.variant_color}` : ''}
                      </div>` : ''}
                  </td>
                  <td>$${item.unit_price.toFixed(2)}</td>
                  <td>${item.quantity}</td>
                  <td class="text-end">$${(item.unit_price * item.quantity).toFixed(2)}</td>
                </tr>
              `).join('') : ''}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" class="text-end fw-semibold">Subtotal:</td>
                <td class="text-end">$${order.subtotal.toFixed(2)}</td>
              </tr>
              ${order.discount_amount > 0 ? `
              <tr>
                <td colspan="3" class="text-end text-success">Discount:</td>
                <td class="text-end text-success">-$${order.discount_amount.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${order.tax_amount > 0 ? `
              <tr>
                <td colspan="3" class="text-end">Tax:</td>
                <td class="text-end">$${order.tax_amount.toFixed(2)}</td>
              </tr>
              ` : ''}
              ${order.shipping_amount > 0 ? `
              <tr>
                <td colspan="3" class="text-end">Shipping:</td>
                <td class="text-end">$${order.shipping_amount.toFixed(2)}</td>
              </tr>
              ` : ''}
              <tr class="table-light">
                <td colspan="3" class="text-end fw-bold">Total:</td>
                <td class="text-end fw-bold">$${order.total_amount.toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <!-- Actions -->
      <div class="col-12">
        <hr>
        <div class="d-flex gap-2 justify-content-end">
          ${renderDetailActions(order)}
        </div>
      </div>
    </div>
  `;
}

// Render detail modal actions
function renderDetailActions(order) {
  const actions = [];

  if (order.status === 'pending') {
    actions.push(`
      <button class="btn btn-success" onclick="window.confirmOrder('${order.id}')">
        <i class="bi bi-check-lg me-2"></i>Confirm Order
      </button>
    `);
    actions.push(`
      <button class="btn btn-danger" onclick="window.cancelOrder('${order.id}')">
        <i class="bi bi-x-lg me-2"></i>Cancel Order
      </button>
    `);
  } else if (order.status === 'preparing') {
    actions.push(`
      <button class="btn btn-info" onclick="window.shipOrder('${order.id}')">
        <i class="bi bi-truck me-2"></i>Start Shipping
      </button>
    `);
  } else if (order.status === 'shipping') {
    actions.push(`
      <button class="btn btn-success" onclick="window.deliverOrder('${order.id}')">
        <i class="bi bi-check2-all me-2"></i>Mark as Delivered
      </button>
    `);
  }

  return actions.join('');
}

// Confirm order
window.confirmOrder = async function(orderId) {
  const confirmed = await Dialog.confirm(
    "Are you sure you want to confirm this order? The customer will be notified.",
    {
      title: "Confirm Order",
      confirmText: "Confirm Order",
      confirmClass: "btn-success"
    }
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/admin/orders/${orderId}/confirm`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to confirm order');
    }

    showToast('Order confirmed successfully', 'success');
    await loadOrders();

    // Close modal if open
    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error('Error confirming order:', error);
    showToast('Failed to confirm order', 'danger');
  }
};

// Ship order
window.shipOrder = async function(orderId) {
  const confirmed = await Dialog.confirm(
    "Start shipping this order? This will begin the delivery process.",
    {
      title: "Start Shipping",
      confirmText: "Start Shipping",
      confirmClass: "btn-info"
    }
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/admin/orders/${orderId}/ship`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to start shipping');
    }

    showToast('Order is now shipping', 'success');
    await loadOrders();

    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error('Error starting shipping:', error);
    showToast('Failed to start shipping', 'danger');
  }
};

// Deliver order
window.deliverOrder = async function(orderId) {
  const confirmed = await Dialog.confirm(
    "Mark this order as delivered? This action confirms the order has reached the customer.",
    {
      title: "Deliver Order",
      confirmText: "Mark as Delivered",
      confirmClass: "btn-success"
    }
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/admin/orders/${orderId}/deliver`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to deliver order');
    }

    showToast('Order marked as delivered', 'success');
    await loadOrders();

    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error('Error delivering order:', error);
    showToast('Failed to deliver order', 'danger');
  }
};

// Cancel order
window.cancelOrder = async function(orderId) {
  const confirmed = await Dialog.confirm(
    "Are you sure you want to cancel this order? This action cannot be undone.",
    {
      title: "Cancel Order",
      confirmText: "Cancel Order",
      cancelText: "Keep Order",
      confirmClass: "btn-danger"
    }
  );

  if (!confirmed) return;

  try {
    const response = await fetch(`${API_URL}/admin/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to cancel order');
    }

    showToast('Order cancelled successfully', 'success');
    await loadOrders();

    const modal = bootstrap.Modal.getInstance(document.getElementById('orderDetailsModal'));
    if (modal) modal.hide();
  } catch (error) {
    console.error('Error cancelling order:', error);
    showToast('Failed to cancel order', 'danger');
  }
};

// Format date
function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

// Format time
function formatTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Show toast notification
function showToast(message, type = 'info') {
  let toastContainer = document.getElementById("toastContainer");
  if (!toastContainer) {
    toastContainer = document.createElement("div");
    toastContainer.id = "toastContainer";
    toastContainer.className = "toast-container position-fixed top-0 end-0 p-3";
    toastContainer.style.zIndex = "1055";
    document.body.appendChild(toastContainer);
  }

  const toastId = "toast-" + Date.now();
  const bgClass = type === 'success' ? 'bg-success' :
                  type === 'warning' ? 'bg-warning' :
                  type === 'danger' ? 'bg-danger' : 'bg-info';
  const icon = type === 'success' ? 'bi-check-circle' :
               type === 'warning' ? 'bi-exclamation-triangle' :
               type === 'danger' ? 'bi-x-circle' : 'bi-info-circle';

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

  toast.addEventListener("hidden.bs.toast", () => toast.remove());
}
