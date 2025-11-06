import { DiscountService } from '/services/DiscountService.js';

// State
let currentPage = 1;
const limit = 20;
let currentFilters = {};
let editingDiscountId = null;

// Bootstrap modal instances
let discountModal, statsModal;

// Initialize discount tab
export function initDiscountsTab() {
  // Initialize Bootstrap modals
  discountModal = new bootstrap.Modal(document.getElementById('discountModal'));
  statsModal = new bootstrap.Modal(document.getElementById('discountStatsModal'));

  // Setup event listeners
  setupDiscountEventListeners();
}

function setupDiscountEventListeners() {
  // Create discount button
  const createBtn = document.getElementById('createDiscountBtn');
  if (createBtn) {
    createBtn.addEventListener('click', openCreateModal);
  }

  // Save discount button
  const saveBtn = document.getElementById('saveDiscountBtn');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveDiscount);
  }

  // Filters
  const searchInput = document.getElementById('discountSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      currentPage = 1;
      applyFilters();
    }, 500));
  }

  const typeFilter = document.getElementById('discountTypeFilter');
  if (typeFilter) {
    typeFilter.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  }

  const statusFilter = document.getElementById('discountStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  }

  const resetBtn = document.getElementById('resetDiscountFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // Discount type change
  const discountType = document.getElementById('discountType');
  if (discountType) {
    discountType.addEventListener('change', (e) => {
      updateValueHint(e.target.value);
    });
  }
}

// Load discounts
export async function loadDiscounts() {
  try {
    document.getElementById('discountLoadingSpinner').style.display = 'block';
    document.getElementById('discountsContent').style.display = 'none';
    document.getElementById('discountEmptyState').style.display = 'none';

    const filters = {
      page: currentPage,
      limit,
      ...currentFilters
    };

    const result = await DiscountService.getDiscounts(filters);

    if (result.discounts.length === 0) {
      document.getElementById('discountLoadingSpinner').style.display = 'none';
      document.getElementById('discountEmptyState').style.display = 'block';
      return;
    }

    renderDiscounts(result.discounts);
    renderPagination(result.total);

    document.getElementById('discountLoadingSpinner').style.display = 'none';
    document.getElementById('discountsContent').style.display = 'block';
  } catch (error) {
    console.error('Error loading discounts:', error);
    showNotification('Lỗi khi tải danh sách mã giảm giá', 'danger');
    document.getElementById('discountLoadingSpinner').style.display = 'none';
    document.getElementById('discountEmptyState').style.display = 'block';
  }
}

// Render discounts table
function renderDiscounts(discounts) {
  const tbody = document.getElementById('discountsTableBody');
  tbody.innerHTML = '';

  discounts.forEach(discount => {
    const row = document.createElement('tr');

    // Type badge
    let typeClass = 'badge bg-info';
    let typeText = 'Phần trăm';
    if (discount.type === 'fixed_amount') {
      typeClass = 'badge bg-success';
      typeText = 'Số tiền';
    } else if (discount.type === 'free_shipping') {
      typeClass = 'badge bg-warning';
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
        ${discount.code ? `<code class="px-2 py-1 bg-light rounded">${discount.code}</code>` : '<span class="text-muted">Tự động</span>'}
      </td>
      <td><span class="${typeClass}">${typeText}</span></td>
      <td><strong>${valueDisplay}</strong></td>
      <td>${usageText}</td>
      <td>
        <small>
          <div>Từ: ${startsAt}</div>
          <div>Đến: ${endsAt}</div>
        </small>
      </td>
      <td>
        <span class="badge ${discount.is_active ? 'bg-success' : 'bg-secondary'}">
          ${discount.is_active ? 'Hoạt động' : 'Tạm dừng'}
        </span>
      </td>
      <td class="text-end">
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
  const pagination = document.getElementById('discountPagination');
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
  const search = document.getElementById('discountSearchInput').value.trim();
  const type = document.getElementById('discountTypeFilter').value;
  const status = document.getElementById('discountStatusFilter').value;

  currentFilters = {};
  if (search) currentFilters.search = search;
  if (type) currentFilters.type = type;
  if (status) currentFilters.is_active = status;

  loadDiscounts();
}

function resetFilters() {
  document.getElementById('discountSearchInput').value = '';
  document.getElementById('discountTypeFilter').value = '';
  document.getElementById('discountStatusFilter').value = '';
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

  // Set default start time to now (in local time for datetime-local input)
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  document.getElementById('startsAt').value = `${year}-${month}-${day}T${hours}:${minutes}`;

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
    showNotification('Lỗi khi tải thông tin mã giảm giá', 'danger');
  }
};

// Save discount
async function saveDiscount() {
  const form = document.getElementById('discountForm');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // Convert datetime-local to ISO string
  const startsAtValue = document.getElementById('startsAt').value;
  const endsAtValue = document.getElementById('endsAt').value;

  const data = {
    code: document.getElementById('discountCode').value.trim() || null,
    type: document.getElementById('discountType').value,
    value: parseFloat(document.getElementById('discountValue').value),
    description: document.getElementById('discountDescription').value.trim() || null,
    min_purchase_amount: parseFloat(document.getElementById('minPurchaseAmount').value) || null,
    min_quantity: parseInt(document.getElementById('minQuantity').value) || null,
    usage_limit: parseInt(document.getElementById('usageLimit').value) || null,
    usage_limit_per_user: parseInt(document.getElementById('usageLimitPerUser').value) || null,
    applies_to: 'all', // Simplified for now
    starts_at: startsAtValue ? new Date(startsAtValue).toISOString() : new Date().toISOString(),
    ends_at: endsAtValue ? new Date(endsAtValue).toISOString() : null,
    is_active: document.getElementById('isActive').checked
  };

  // Validate
  if (data.type === 'percentage' && (data.value <= 0 || data.value > 100)) {
    showNotification('Giá trị phần trăm phải từ 1-100', 'danger');
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
    showNotification(error.message || 'Lỗi khi lưu mã giảm giá', 'danger');
  }
}

// Delete discount
window.deleteDiscount = async function(id) {
  if (!confirm('Bạn có chắc chắn muốn xóa mã giảm giá này?')) {
    return;
  }

  try {
    await DiscountService.deleteDiscount(id);
    showNotification('Xóa mã giảm giá thành công', 'success');
    loadDiscounts();
  } catch (error) {
    console.error('Error deleting discount:', error);
    showNotification(error.message || 'Lỗi khi xóa mã giảm giá', 'danger');
  }
};

// View discount stats
window.viewDiscountStats = async function(id) {
  try {
    document.getElementById('discountStatsBody').innerHTML = `
      <div class="text-center py-5">
        <div class="spinner-border text-secondary" role="status">
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
                ${stats.discount.code ? `<code>${stats.discount.code}</code>` : '<span class="text-muted">Tự động</span>'}
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

    document.getElementById('discountStatsBody').innerHTML = html;
  } catch (error) {
    console.error('Error loading stats:', error);
    document.getElementById('discountStatsBody').innerHTML = `
      <div class="alert alert-danger">
        <i class="bi bi-exclamation-triangle me-2"></i> Lỗi khi tải thống kê
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
  // Use Bootstrap toast or alert
  const alertDiv = document.createElement('div');
  alertDiv.className = `alert alert-${type} alert-dismissible fade show position-fixed top-0 start-50 translate-middle-x mt-3`;
  alertDiv.style.zIndex = '9999';
  alertDiv.innerHTML = `
    ${message}
    <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
  `;
  document.body.appendChild(alertDiv);

  setTimeout(() => {
    alertDiv.remove();
  }, 3000);
}
