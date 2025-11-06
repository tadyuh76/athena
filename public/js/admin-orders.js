// Admin Orders Management Component
import { Dialog } from '/js/dialog.js';

export class AdminOrders {
  constructor() {
    this.orders = [];
    this.filteredOrders = [];
    this.currentFilter = 'all';
  }

  async init() {
    await this.loadOrders();
    this.render();
    this.attachEventListeners();
  }

  async loadOrders() {
    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch('/api/admin/orders', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.orders = data.orders;
        this.applyFilter(this.currentFilter);
      } else {
        throw new Error(data.message || 'Không thể tải danh sách đơn hàng');
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.showToast('Không thể tải danh sách đơn hàng', 'danger');
    }
  }

  applyFilter(status) {
    this.currentFilter = status;

    if (status === 'all') {
      this.filteredOrders = [...this.orders];
    } else {
      this.filteredOrders = this.orders.filter(order => order.status === status);
    }

    this.render();
  }

  render() {
    const container = document.getElementById('ordersContainer');
    if (!container) return;

    const statusCounts = this.getStatusCounts();

    container.innerHTML = `
      <div class="orders-management">
        <div class="orders-header">
          <h2>Quản lý đơn hàng</h2>
          <button class="btn btn-sm btn-outline-primary" onclick="adminOrders.loadOrders()">
            <i class="bi bi-arrow-clockwise"></i> Làm mới
          </button>
        </div>

        <!-- Status Filter Pills -->
        <div class="status-filters mb-4">
          <button class="filter-pill ${this.currentFilter === 'all' ? 'active' : ''}"
                  onclick="adminOrders.applyFilter('all')">
            Tất cả (${this.orders.length})
          </button>
          <button class="filter-pill ${this.currentFilter === 'pending' ? 'active' : ''}"
                  onclick="adminOrders.applyFilter('pending')">
            Chờ xử lý (${statusCounts.pending})
          </button>
          <button class="filter-pill ${this.currentFilter === 'preparing' ? 'active' : ''}"
                  onclick="adminOrders.applyFilter('preparing')">
            Đang chuẩn bị (${statusCounts.preparing})
          </button>
          <button class="filter-pill ${this.currentFilter === 'shipping' ? 'active' : ''}"
                  onclick="adminOrders.applyFilter('shipping')">
            Đang giao (${statusCounts.shipping})
          </button>
          <button class="filter-pill ${this.currentFilter === 'delivered' ? 'active' : ''}"
                  onclick="adminOrders.applyFilter('delivered')">
            Đã giao (${statusCounts.delivered})
          </button>
          <button class="filter-pill ${this.currentFilter === 'cancelled' ? 'active' : ''}"
                  onclick="adminOrders.applyFilter('cancelled')">
            Đã hủy (${statusCounts.cancelled})
          </button>
        </div>

        <!-- Orders Table -->
        <div class="orders-table-container">
          ${this.filteredOrders.length === 0 ? this.renderEmptyState() : this.renderOrdersTable()}
        </div>
      </div>

      <style>
        .orders-management {
          padding: 20px;
        }

        .orders-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
        }

        .status-filters {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .filter-pill {
          padding: 8px 16px;
          border: 1px solid #ddd;
          border-radius: 20px;
          background: white;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 14px;
        }

        .filter-pill:hover {
          background: #f5f5f5;
        }

        .filter-pill.active {
          background: #007bff;
          color: white;
          border-color: #007bff;
        }

        .orders-table-container {
          background: white;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .orders-table {
          width: 100%;
          border-collapse: collapse;
        }

        .orders-table th {
          background: #f8f9fa;
          padding: 12px;
          text-align: left;
          font-weight: 600;
          border-bottom: 2px solid #dee2e6;
        }

        .orders-table td {
          padding: 12px;
          border-bottom: 1px solid #f0f0f0;
        }

        .orders-table tr:hover {
          background: #f8f9fa;
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }

        .status-pending {
          background: #fff3cd;
          color: #856404;
        }

        .status-preparing {
          background: #cfe2ff;
          color: #084298;
        }

        .status-shipping {
          background: #d3d3f9;
          color: #1d1d5a;
        }

        .status-delivered {
          background: #d1e7dd;
          color: #0f5132;
        }

        .status-cancelled {
          background: #f8d7da;
          color: #842029;
        }

        .order-actions {
          display: flex;
          gap: 5px;
        }

        .btn-action {
          padding: 4px 8px;
          font-size: 12px;
          border-radius: 4px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #6c757d;
        }

        .empty-state i {
          font-size: 48px;
          margin-bottom: 16px;
        }
      </style>
    `;
  }

  renderOrdersTable() {
    return `
      <table class="orders-table">
        <thead>
          <tr>
            <th>Mã đơn hàng</th>
            <th>Khách hàng</th>
            <th>Tổng tiền</th>
            <th>Trạng thái</th>
            <th>Thanh toán</th>
            <th>Ngày tạo</th>
            <th>Dự kiến giao</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          ${this.filteredOrders.map(order => this.renderOrderRow(order)).join('')}
        </tbody>
      </table>
    `;
  }

  renderOrderRow(order) {
    const statusText = this.getStatusText(order.status);
    const paymentStatusText = this.getPaymentStatusText(order.payment_status);
    const createdDate = new Date(order.created_at).toLocaleDateString('vi-VN');
    const estimatedDate = order.estimated_delivery_date
      ? new Date(order.estimated_delivery_date).toLocaleDateString('vi-VN')
      : '-';

    return `
      <tr>
        <td><strong>${order.order_number}</strong></td>
        <td>${order.customer_email}</td>
        <td>${this.formatPrice(order.total_amount)}</td>
        <td><span class="status-badge status-${order.status}">${statusText}</span></td>
        <td><span class="status-badge status-${order.payment_status}">${paymentStatusText}</span></td>
        <td>${createdDate}</td>
        <td>${estimatedDate}</td>
        <td>
          <div class="order-actions">
            ${this.renderActions(order)}
          </div>
        </td>
      </tr>
    `;
  }

  renderActions(order) {
    const actions = [];

    // Xác nhận đơn hàng (pending -> preparing)
    if (order.status === 'pending' && order.payment_status === 'paid') {
      actions.push(`
        <button class="btn btn-sm btn-success btn-action"
                onclick="adminOrders.confirmOrder('${order.id}')">
          <i class="bi bi-check-circle"></i> Xác nhận
        </button>
      `);
    }

    // Bắt đầu giao hàng (preparing -> shipping)
    if (order.status === 'preparing') {
      actions.push(`
        <button class="btn btn-sm btn-primary btn-action"
                onclick="adminOrders.markAsShipped('${order.id}')">
          <i class="bi bi-truck"></i> Giao hàng
        </button>
      `);
    }

    // Hoàn thành đơn hàng (shipping -> delivered)
    if (order.status === 'shipping') {
      actions.push(`
        <button class="btn btn-sm btn-success btn-action"
                onclick="adminOrders.markAsDelivered('${order.id}')">
          <i class="bi bi-box-seam"></i> Hoàn thành
        </button>
      `);
    }

    // Hủy đơn hàng (any -> cancelled, except delivered/cancelled)
    if (!['delivered', 'cancelled'].includes(order.status)) {
      actions.push(`
        <button class="btn btn-sm btn-danger btn-action"
                onclick="adminOrders.cancelOrder('${order.id}')">
          <i class="bi bi-x-circle"></i> Hủy
        </button>
      `);
    }

    // View details (always available)
    actions.push(`
      <button class="btn btn-sm btn-outline-secondary btn-action"
              onclick="adminOrders.viewOrderDetails('${order.id}')">
        <i class="bi bi-eye"></i>
      </button>
    `);

    return actions.join('');
  }

  renderEmptyState() {
    return `
      <div class="empty-state">
        <i class="bi bi-inbox"></i>
        <h4>Không có đơn hàng</h4>
        <p>Chưa có đơn hàng nào trong mục này.</p>
      </div>
    `;
  }

  async confirmOrder(orderId) {
    const confirmed = await Dialog.confirm(
      'Xác nhận đơn hàng này? Thời gian giao hàng dự kiến là 3 ngày.',
      {
        title: 'Xác nhận đơn hàng',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        confirmClass: 'btn-success',
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/orders/${orderId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('Đã xác nhận đơn hàng thành công', 'success');
        await this.loadOrders();
      } else {
        throw new Error(data.message || 'Không thể xác nhận đơn hàng');
      }
    } catch (error) {
      console.error('Error confirming order:', error);
      this.showToast(error.message, 'danger');
    }
  }

  async markAsShipped(orderId) {
    const trackingNumber = await Dialog.prompt(
      'Nhập mã vận đơn (tùy chọn):',
      {
        title: 'Đánh dấu đã giao hàng',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
      }
    );

    if (trackingNumber === null) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/orders/${orderId}/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ trackingNumber: trackingNumber || undefined }),
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('Đã đánh dấu đơn hàng đang giao', 'success');
        await this.loadOrders();
      } else {
        throw new Error(data.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error marking as shipped:', error);
      this.showToast(error.message, 'danger');
    }
  }

  async markAsDelivered(orderId) {
    const confirmed = await Dialog.confirm(
      'Xác nhận đơn hàng này đã được giao thành công?',
      {
        title: 'Hoàn thành đơn hàng',
        confirmText: 'Xác nhận',
        cancelText: 'Hủy',
        confirmClass: 'btn-success',
      }
    );

    if (!confirmed) return;

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/orders/${orderId}/deliver`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('Đã đánh dấu đơn hàng đã giao', 'success');
        await this.loadOrders();
      } else {
        throw new Error(data.message || 'Không thể cập nhật trạng thái');
      }
    } catch (error) {
      console.error('Error marking as delivered:', error);
      this.showToast(error.message, 'danger');
    }
  }

  async cancelOrder(orderId) {
    const reason = await Dialog.prompt(
      'Nhập lý do hủy đơn hàng:',
      {
        title: 'Hủy đơn hàng',
        confirmText: 'Hủy đơn',
        cancelText: 'Quay lại',
        confirmClass: 'btn-danger',
      }
    );

    if (reason === null) return;

    if (!reason.trim()) {
      this.showToast('Vui lòng nhập lý do hủy đơn', 'warning');
      return;
    }

    try {
      const token = localStorage.getItem('authToken');
      const response = await fetch(`/api/admin/orders/${orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });

      const data = await response.json();

      if (data.success) {
        this.showToast('Đã hủy đơn hàng thành công', 'success');
        await this.loadOrders();
      } else {
        throw new Error(data.message || 'Không thể hủy đơn hàng');
      }
    } catch (error) {
      console.error('Error canceling order:', error);
      this.showToast(error.message, 'danger');
    }
  }

  async viewOrderDetails(orderId) {
    // Navigate to order details page or show modal
    window.location.href = `/admin.html#order-details/${orderId}`;
  }

  getStatusCounts() {
    const counts = {
      pending: 0,
      preparing: 0,
      shipping: 0,
      delivered: 0,
      cancelled: 0,
    };

    this.orders.forEach(order => {
      if (counts.hasOwnProperty(order.status)) {
        counts[order.status]++;
      }
    });

    return counts;
  }

  getStatusText(status) {
    const statusMap = {
      pending: 'Chờ xử lý',
      preparing: 'Đang chuẩn bị',
      shipping: 'Đang giao',
      delivered: 'Đã giao',
      cancelled: 'Đã hủy',
      refunded: 'Đã hoàn tiền',
    };
    return statusMap[status] || status;
  }

  getPaymentStatusText(status) {
    const statusMap = {
      pending: 'Chờ thanh toán',
      processing: 'Đang xử lý',
      paid: 'Đã thanh toán',
      failed: 'Thất bại',
      refunded: 'Đã hoàn tiền',
      partially_refunded: 'Hoàn một phần',
    };
    return statusMap[status] || status;
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }

  attachEventListeners() {
    // Any additional event listeners can be attached here
  }

  showToast(message, type = 'info') {
    const toastContainer = document.getElementById('toastContainer') || this.createToastContainer();
    const toastId = 'toast-' + Date.now();

    const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : type === 'danger' ? 'bg-danger' : 'bg-info';

    const toast = document.createElement('div');
    toast.id = toastId;
    toast.className = `toast align-items-center text-white ${bgClass} border-0`;
    toast.setAttribute('role', 'alert');
    toast.innerHTML = `
      <div class="d-flex">
        <div class="toast-body">${message}</div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    `;

    toastContainer.appendChild(toast);
    const bsToast = new bootstrap.Toast(toast, { delay: 4000 });
    bsToast.show();

    toast.addEventListener('hidden.bs.toast', () => {
      toast.remove();
    });
  }

  createToastContainer() {
    const container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    container.style.zIndex = '1055';
    document.body.appendChild(container);
    return container;
  }
}

// Create global instance
window.adminOrders = new AdminOrders();
