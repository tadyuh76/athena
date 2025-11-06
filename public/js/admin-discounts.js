import { AuthService } from '/services/AuthService.js';
import { DiscountService } from '/services/DiscountService.js';
import { Dialog } from '/js/dialog.js';

// State
let currentPage = 1;
const limit = 20;
let currentFilters = {};
let editingDiscountId = null;

// Bootstrap modal instances
let discountModal, statsModal;

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  // Check admin authentication
  const user = await AuthService.getCurrentUser();
  if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
    window.location.href = '/admin-login.html';
    return;
  }

  // Initialize Bootstrap modals
  discountModal = new bootstrap.Modal(document.getElementById('discountModal'));
  statsModal = new bootstrap.Modal(document.getElementById('statsModal'));

  // Setup event listeners
  setupEventListeners();

  // Load discounts
  await loadDiscounts();
});

function setupEventListeners() {
  // Logout
  document.getElementById('logoutBtn').addEventListener('click', async (e) => {
    e.preventDefault();
    await AuthService.logout();
    window.location.href = '/admin-login.html';
  });

  // Create discount button
  document.getElementById('createDiscountBtn').addEventListener('click', () => {
    openCreateModal();
  });

  // Save discount button
  document.getElementById('saveDiscountBtn').addEventListener('click', () => {
    saveDiscount();
  });

  // Filters
  document.getElementById('searchInput').addEventListener('input', debounce(() => {
    currentPage = 1;
    applyFilters();
  }, 500));

  document.getElementById('typeFilter').addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById('statusFilter').addEventListener('change', () => {
    currentPage = 1;
    applyFilters();
  });

  document.getElementById('resetFiltersBtn').addEventListener('click', () => {
    resetFilters();
  });

  // Discount type change
  document.getElementById('discountType').addEventListener('change', (e) => {
    updateValueHint(e.target.value);
  });
}

// Load discounts
async function loadDiscounts() {
  try {
    document.getElementById('loadingSpinner').style.display = 'block';
    document.getElementById('discountsContent').style.display = 'none';
    document.getElementById('emptyState').style.display = 'none';

    const filters = {
      page: currentPage,
      limit,
      ...currentFilters
    };

    const result = await DiscountService.getDiscounts(filters);

    if (result.discounts.length === 0) {
      document.getElementById('loadingSpinner').style.display = 'none';
      document.getElementById('emptyState').style.display = 'block';
      return;
    }

    renderDiscounts(result.discounts);
    renderPagination(result.total);

    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('discountsContent').style.display = 'block';
  } catch (error) {
    console.error('Error loading discounts:', error);
    showNotification('Lỗi khi tải danh sách mã giảm giá', 'error');
    document.getElementById('loadingSpinner').style.display = 'none';
    document.getElementById('emptyState').style.display = 'block';
  }
}

// Render discounts table
function renderDiscounts(discounts) {
  const tbody = document.getElementById('discountsTableBody');
  tbody.innerHTML = '';

  discounts.forEach(discount => {
    const row = document.createElement('tr');

    // Type badge
    let typeClass = 'discount-type-percentage';
    let typeText = 'Phần trăm';
    if (discount.type === 'fixed_amount') {
      typeClass = 'discount-type-fixed';
      typeText = 'Số tiền';
    } else if (discount.type === 'free_shipping') {
      typeClass = 'discount-type-shipping';
      typeText = 'Free ship';
    }

    // Value display
    let valueDisplay = '';
    if (discount.type === 'percentage') {
      valueDisplay = `${discount.value}%`;
    } else if (discount.type === 'fixed_amount') {
      valueDisplay = `${Number(discount.value).toLocaleString('vi-VN')} đ`;
    } else {
      valueDisplay = 'Free';
    }

    // Usage display
    const usageText = discount.usage_limit
      ? `${discount.usage_count} / ${discount.usage_limit}`
      : discount.usage_count;

    // Date display
    const startsAt = new Date(discount.starts_at).toLocaleDateString('vi-VN');
    const endsAt = discount.ends_at
      ? new Date(discount.ends_at).toLocaleDateString('vi-VN')
      : 'Không giới hạn';

    row.innerHTML = `
      <td>
        ${discount.code ? `<span class="code-badge">${discount.code}</span>` : '<span class="text-muted">Tự động</span>'}
      </td>
      <td>
        <div class="text-truncate" style="max-width: 200px;" title="${discount.description || ''}">
          ${discount.description || '<span class="text-muted">Không có mô tả</span>'}
        </div>
      </td>
      <td><span class="discount-type-badge ${typeClass}">${typeText}</span></td>
      <td><strong>${valueDisplay}</strong></td>
      <td>${usageText}</td>
      <td>
        <small>
          Từ: ${startsAt}<br>
          Đến: ${endsAt}
        </small>
      </td>
      <td>
        <span class="status-badge ${discount.is_active ? 'status-active' : 'status-inactive'}">
          ${discount.is_active ? 'Hoạt động' : 'Tạm dừng'}
        </span>
      </td>
      <td>
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-primary" onclick="window.viewDiscountStats('${discount.id}')" title="Thống kê">
            <i class="bi bi-bar-chart"></i>
          </button>
          <button class="btn btn-outline-secondary" onclick="window.editDiscount('${discount.id}')" title="Sửa">
            <i class="bi bi-pencil"></i>
          </button>
          <button class="btn btn-outline-danger" onclick="window.deleteDiscount('${discount.id}')" title="Xóa">
            <i class="bi bi-trash"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });
}

// Render pagination
function renderPagination(total) {
  const totalPages = Math.ceil(total / limit);
  const pagination = document.getElementById('pagination');
  pagination.innerHTML = '';

  if (totalPages <= 1) return;

  // Previous button
  const prevLi = document.createElement('li');
  prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
  prevLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage - 1}">Trước</a>`;
  pagination.appendChild(prevLi);

  // Page numbers
  const startPage = Math.max(1, currentPage - 2);
  const endPage = Math.min(totalPages, currentPage + 2);

  for (let i = startPage; i <= endPage; i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === currentPage ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#" data-page="${i}">${i}</a>`;
    pagination.appendChild(li);
  }

  // Next button
  const nextLi = document.createElement('li');
  nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
  nextLi.innerHTML = `<a class="page-link" href="#" data-page="${currentPage + 1}">Sau</a>`;
  pagination.appendChild(nextLi);

  // Add click events
  pagination.querySelectorAll('.page-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const page = parseInt(e.target.dataset.page);
      if (page && page !== currentPage) {
        currentPage = page;
        loadDiscounts();
      }
    });
  });
}

// Filters
function applyFilters() {
  const search = document.getElementById('searchInput').value.trim();
  const type = document.getElementById('typeFilter').value;
  const status = document.getElementById('statusFilter').value;

  currentFilters = {};
  if (search) currentFilters.search = search;
  if (type) currentFilters.type = type;
  if (status) currentFilters.is_active = status;

  loadDiscounts();
}

function resetFilters() {
  document.getElementById('searchInput').value = '';
  document.getElementById('typeFilter').value = '';
  document.getElementById('statusFilter').value = '';
  currentFilters = {};
  currentPage = 1;
  loadDiscounts();
}

// Open create modal
function openCreateModal() {
  editingDiscountId = null;
  document.getElementById('discountModalTitle').textContent = 'Tạo mã giảm giá';
  document.getElementById('discountForm').reset();
  document.getElementById('discountId').value = '';

  // Set default start time to now
  const now = new Date();
  now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
  document.getElementById('startsAt').value = now.toISOString().slice(0, 16);

  updateValueHint('');
  discountModal.show();
}

// Edit discount
window.editDiscount = async function(id) {
  try {
    editingDiscountId = id;
    document.getElementById('discountModalTitle').textContent = 'Chỉnh sửa mã giảm giá';

    const discount = await DiscountService.getDiscountById(id);

    // Fill form
    document.getElementById('discountId').value = discount.id;
    document.getElementById('discountCode').value = discount.code || '';
    document.getElementById('discountType').value = discount.type;
    document.getElementById('discountValue').value = discount.value;
    document.getElementById('discountDescription').value = discount.description || '';
    document.getElementById('minPurchaseAmount').value = discount.min_purchase_amount || '';
    document.getElementById('minQuantity').value = discount.min_quantity || '';
    document.getElementById('usageLimit').value = discount.usage_limit || '';
    document.getElementById('usageLimitPerUser').value = discount.usage_limit_per_user || '';
    document.getElementById('appliesTo').value = discount.applies_to || 'all';

    // Set dates
    if (discount.starts_at) {
      const startsAt = new Date(discount.starts_at);
      startsAt.setMinutes(startsAt.getMinutes() - startsAt.getTimezoneOffset());
      document.getElementById('startsAt').value = startsAt.toISOString().slice(0, 16);
    }

    if (discount.ends_at) {
      const endsAt = new Date(discount.ends_at);
      endsAt.setMinutes(endsAt.getMinutes() - endsAt.getTimezoneOffset());
      document.getElementById('endsAt').value = endsAt.toISOString().slice(0, 16);
    }

    document.getElementById('isActive').checked = discount.is_active;

    updateValueHint(discount.type);
    discountModal.show();
  } catch (error) {
    console.error('Error loading discount:', error);
    showNotification('Lỗi khi tải thông tin mã giảm giá', 'error');
  }
};

// Save discount
async function saveDiscount() {
  const form = document.getElementById('discountForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const data = {
    code: document.getElementById('discountCode').value.trim() || null,
    type: document.getElementById('discountType').value,
    value: parseFloat(document.getElementById('discountValue').value),
    description: document.getElementById('discountDescription').value.trim() || null,
    min_purchase_amount: parseFloat(document.getElementById('minPurchaseAmount').value) || null,
    min_quantity: parseInt(document.getElementById('minQuantity').value) || null,
    usage_limit: parseInt(document.getElementById('usageLimit').value) || null,
    usage_limit_per_user: parseInt(document.getElementById('usageLimitPerUser').value) || null,
    applies_to: document.getElementById('appliesTo').value,
    starts_at: document.getElementById('startsAt').value,
    ends_at: document.getElementById('endsAt').value || null,
    is_active: document.getElementById('isActive').checked
  };

  // Validate
  if (data.type === 'percentage' && (data.value <= 0 || data.value > 100)) {
    showNotification('Giá trị phần trăm phải từ 1-100', 'error');
    return;
  }

  try {
    if (editingDiscountId) {
      await DiscountService.updateDiscount(editingDiscountId, data);
      showNotification('Cập nhật mã giảm giá thành công', 'success');
    } else {
      await DiscountService.createDiscount(data);
      showNotification('Tạo mã giảm giá thành công', 'success');
    }

    discountModal.hide();
    loadDiscounts();
  } catch (error) {
    console.error('Error saving discount:', error);
    showNotification(error.message || 'Lỗi khi lưu mã giảm giá', 'error');
  }
}

// Delete discount
window.deleteDiscount = async function(id) {
  const confirmed = await Dialog.confirm(
    'Bạn có chắc chắn muốn xóa mã giảm giá này?',
    {
      title: 'Xác nhận xóa',
      confirmText: 'Xóa',
      cancelText: 'Hủy',
      type: 'danger'
    }
  );

  if (!confirmed) return;

  try {
    await DiscountService.deleteDiscount(id);
    showNotification('Xóa mã giảm giá thành công', 'success');
    loadDiscounts();
  } catch (error) {
    console.error('Error deleting discount:', error);
    showNotification(error.message || 'Lỗi khi xóa mã giảm giá', 'error');
  }
};

// View discount stats
window.viewDiscountStats = async function(id) {
  try {
    document.getElementById('statsModalBody').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Đang tải...</span>
        </div>
      </div>
    `;

    statsModal.show();

    const stats = await DiscountService.getDiscountStats(id);
    const usage = await DiscountService.getDiscountUsage(id, 1, 10);

    let html = `
      <div class="row g-3 mb-4">
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body text-center">
              <h6 class="card-subtitle mb-2 text-muted">Mã giảm giá</h6>
              <h4 class="card-title mb-0">
                ${stats.discount.code ? `<span class="code-badge">${stats.discount.code}</span>` : '<span class="text-muted">Tự động</span>'}
              </h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body text-center">
              <h6 class="card-subtitle mb-2 text-muted">Số lần sử dụng</h6>
              <h4 class="card-title mb-0">
                ${stats.usage_count}${stats.remaining_uses !== null ? ` / ${stats.discount.usage_limit}` : ''}
              </h4>
            </div>
          </div>
        </div>
        <div class="col-md-4">
          <div class="card bg-light">
            <div class="card-body text-center">
              <h6 class="card-subtitle mb-2 text-muted">Tổng tiết kiệm</h6>
              <h4 class="card-title mb-0 text-success">
                ${Number(stats.total_savings).toLocaleString('vi-VN')} đ
              </h4>
            </div>
          </div>
        </div>
      </div>
    `;

    if (usage.usages.length > 0) {
      html += `
        <h6 class="mb-3">Lịch sử sử dụng gần đây</h6>
        <div class="table-responsive">
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Đơn hàng</th>
                <th>Tiết kiệm</th>
                <th>Ngày sử dụng</th>
              </tr>
            </thead>
            <tbody>
      `;

      usage.usages.forEach(u => {
        html += `
          <tr>
            <td>${u.order?.order_number || 'N/A'}</td>
            <td class="text-success">${Number(u.amount_saved).toLocaleString('vi-VN')} đ</td>
            <td>${new Date(u.created_at).toLocaleString('vi-VN')}</td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    } else {
      html += `
        <div class="text-center text-muted py-3">
          <i class="bi bi-inbox" style="font-size: 3rem;"></i>
          <p class="mt-2">Chưa có lịch sử sử dụng</p>
        </div>
      `;
    }

    document.getElementById('statsModalBody').innerHTML = html;
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('statsModalBody').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle"></i> Lỗi khi tải thống kê
      </div>
    `;
  }
};

// Update value hint based on discount type
function updateValueHint(type) {
  const hint = document.getElementById('valueHint');
  const valueInput = document.getElementById('discountValue');

  if (type === 'percentage') {
    hint.textContent = 'Nhập giá trị từ 1-100 (%)';
    valueInput.max = 100;
    valueInput.placeholder = 'VD: 20';
  } else if (type === 'fixed_amount') {
    hint.textContent = 'Nhập số tiền giảm (đồng)';
    valueInput.removeAttribute('max');
    valueInput.placeholder = 'VD: 50000';
  } else if (type === 'free_shipping') {
    hint.textContent = 'Nhập phí ship tối đa được miễn phí (đồng)';
    valueInput.removeAttribute('max');
    valueInput.placeholder = 'VD: 30000';
  } else {
    hint.textContent = '';
    valueInput.removeAttribute('max');
    valueInput.placeholder = '';
  }
}

// Utility functions
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

function showNotification(message, type = 'info') {
  const toastHtml = `
    <div class="toast align-items-center text-white bg-${type === 'error' ? 'danger' : type === 'success' ? 'success' : 'info'} border-0" role="alert">
      <div class="d-flex">
        <div class="toast-body">
          <i class="bi bi-${type === 'error' ? 'exclamation-circle' : type === 'success' ? 'check-circle' : 'info-circle'}"></i>
          ${message}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>
  `;

  let toastContainer = document.querySelector('.toast-container');
  if (!toastContainer) {
    toastContainer = document.createElement('div');
    toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(toastContainer);
  }

  const toastElement = document.createElement('div');
  toastElement.innerHTML = toastHtml;
  toastContainer.appendChild(toastElement.firstElementChild);

  const toast = new bootstrap.Toast(toastElement.firstElementChild);
  toast.show();

  toastElement.firstElementChild.addEventListener('hidden.bs.toast', () => {
    toastElement.remove();
  });
}
