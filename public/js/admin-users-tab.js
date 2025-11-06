import { Dialog } from '/js/dialog.js';

// State
let currentPage = 1;
const limit = 20;
let currentFilters = {};
let currentSort = { field: 'created_at', order: 'desc' };

// Initialize users tab
export function initUsersTab() {
  setupUserEventListeners();
  loadUsers();
  loadUserStats();
}

function setupUserEventListeners() {
  // Search input
  const searchInput = document.getElementById('userSearchInput');
  if (searchInput) {
    searchInput.addEventListener('input', debounce(() => {
      currentPage = 1;
      applyFilters();
    }, 500));
  }

  // Role filter
  const roleFilter = document.getElementById('userRoleFilter');
  if (roleFilter) {
    roleFilter.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  }

  // Status filter
  const statusFilter = document.getElementById('userStatusFilter');
  if (statusFilter) {
    statusFilter.addEventListener('change', () => {
      currentPage = 1;
      applyFilters();
    });
  }

  // Reset filters button
  const resetBtn = document.getElementById('resetUserFiltersBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', resetFilters);
  }

  // Refresh button
  const refreshBtn = document.getElementById('refreshUsersBtn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      loadUsers();
      loadUserStats();
    });
  }
}

function applyFilters() {
  const searchInput = document.getElementById('userSearchInput');
  const roleFilter = document.getElementById('userRoleFilter');
  const statusFilter = document.getElementById('userStatusFilter');

  currentFilters = {
    search: searchInput?.value || '',
    role: roleFilter?.value || '',
    status: statusFilter?.value || ''
  };

  loadUsers();
}

function resetFilters() {
  const searchInput = document.getElementById('userSearchInput');
  const roleFilter = document.getElementById('userRoleFilter');
  const statusFilter = document.getElementById('userStatusFilter');

  if (searchInput) searchInput.value = '';
  if (roleFilter) roleFilter.value = '';
  if (statusFilter) statusFilter.value = '';

  currentFilters = {};
  currentPage = 1;
  loadUsers();
}

// Load users
export async function loadUsers() {
  try {
    showLoadingState();

    const token = localStorage.getItem('authToken');
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: limit.toString(),
      ...currentFilters
    });

    const response = await fetch(`/api/admin/users?${params}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Không thể tải danh sách người dùng');
    }

    renderUsers(result.users || []);
    renderPagination(result.total || 0, result.totalPages || 1);
    updateUserCount(result.total || 0);

  } catch (error) {
    console.error('Error loading users:', error);
    showErrorState();
    showNotification('Không thể tải danh sách người dùng', 'danger');
  }
}

// Load user statistics
async function loadUserStats() {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch('/api/admin/users/stats', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (result.success) {
      displayUserStats(result);
    }
  } catch (error) {
    console.error('Error loading user stats:', error);
  }
}

function displayUserStats(stats) {
  const statsContainer = document.getElementById('userStatsContainer');
  if (!statsContainer) return;

  statsContainer.innerHTML = `
    <div class="row g-3 mb-4">
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted mb-2">Tổng người dùng</h6>
            <h3 class="mb-0">${stats.totalUsers || 0}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted mb-2">Khách hàng</h6>
            <h3 class="mb-0">${stats.byRole?.customer || 0}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted mb-2">Admin</h6>
            <h3 class="mb-0">${stats.byRole?.admin || 0}</h3>
          </div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card border-0 shadow-sm">
          <div class="card-body">
            <h6 class="text-muted mb-2">Mới tháng này</h6>
            <h3 class="mb-0">${stats.newUsersThisMonth || 0}</h3>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderUsers(users) {
  const tbody = document.getElementById('usersTableBody');
  if (!tbody) return;

  if (users.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-muted">
          Không tìm thấy người dùng nào
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = users.map(user => `
    <tr>
      <td>
        <div class="d-flex align-items-center">
          ${user.avatar_url ?
            `<img src="${user.avatar_url}" alt="${user.first_name}" class="rounded-circle me-2" width="32" height="32">` :
            `<div class="rounded-circle bg-secondary text-white d-flex align-items-center justify-content-center me-2" style="width: 32px; height: 32px;">
              ${(user.first_name?.[0] || user.email[0]).toUpperCase()}
            </div>`
          }
          <div>
            <div class="fw-semibold">${user.first_name || ''} ${user.last_name || ''}</div>
            <small class="text-muted">${user.email}</small>
          </div>
        </div>
      </td>
      <td>${user.phone || '-'}</td>
      <td>${getRoleBadge(user.role)}</td>
      <td>${getStatusBadge(user.status)}</td>
      <td>
        <div class="d-flex gap-1">
          ${user.email_verified ? '<i class="bi bi-check-circle-fill text-success" title="Email đã xác thực"></i>' : '<i class="bi bi-x-circle-fill text-muted" title="Email chưa xác thực"></i>'}
          ${user.phone_verified ? '<i class="bi bi-phone-fill text-success" title="SĐT đã xác thực"></i>' : ''}
        </div>
      </td>
      <td><small class="text-muted">${formatDate(user.created_at)}</small></td>
      <td class="text-end">
        <div class="btn-group btn-group-sm">
          <button class="btn btn-outline-secondary" onclick="window.viewUser('${user.id}')" title="Xem chi tiết">
            <i class="bi bi-eye"></i>
          </button>
          <button class="btn btn-outline-primary" onclick="window.editUser('${user.id}')" title="Chỉnh sửa">
            <i class="bi bi-pencil"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function getRoleBadge(role) {
  const badges = {
    admin: '<span class="badge bg-danger">Admin</span>',
    customer: '<span class="badge bg-primary">Khách hàng</span>'
  };
  return badges[role] || '<span class="badge bg-secondary">-</span>';
}

function getStatusBadge(status) {
  const badges = {
    active: '<span class="badge bg-success">Hoạt động</span>',
    suspended: '<span class="badge bg-danger">Tạm khóa</span>',
    inactive: '<span class="badge bg-secondary">Không hoạt động</span>'
  };
  return badges[status] || '<span class="badge bg-secondary">-</span>';
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function renderPagination(total, totalPages) {
  const paginationContainer = document.getElementById('userPagination');
  if (!paginationContainer) return;

  if (totalPages <= 1) {
    paginationContainer.innerHTML = '';
    return;
  }

  let html = '';

  // Previous button
  html += `
    <li class="page-item ${currentPage === 1 ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="window.changePage(${currentPage - 1}); return false;">
        <i class="bi bi-chevron-left"></i>
      </a>
    </li>
  `;

  // Page numbers
  for (let i = 1; i <= totalPages; i++) {
    if (
      i === 1 ||
      i === totalPages ||
      (i >= currentPage - 2 && i <= currentPage + 2)
    ) {
      html += `
        <li class="page-item ${i === currentPage ? 'active' : ''}">
          <a class="page-link" href="#" onclick="window.changePage(${i}); return false;">${i}</a>
        </li>
      `;
    } else if (i === currentPage - 3 || i === currentPage + 3) {
      html += '<li class="page-item disabled"><span class="page-link">...</span></li>';
    }
  }

  // Next button
  html += `
    <li class="page-item ${currentPage === totalPages ? 'disabled' : ''}">
      <a class="page-link" href="#" onclick="window.changePage(${currentPage + 1}); return false;">
        <i class="bi bi-chevron-right"></i>
      </a>
    </li>
  `;

  paginationContainer.innerHTML = html;
}

function updateUserCount(total) {
  const countElement = document.getElementById('userCount');
  if (countElement) {
    countElement.textContent = `${total} người dùng`;
  }

  const paginationInfo = document.getElementById('userPaginationInfo');
  if (paginationInfo) {
    const start = (currentPage - 1) * limit + 1;
    const end = Math.min(currentPage * limit, total);
    paginationInfo.textContent = `Hiển thị ${start}-${end} trong tổng ${total} người dùng`;
  }
}

function showLoadingState() {
  const tbody = document.getElementById('usersTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5">
          <div class="spinner-border text-secondary" role="status">
            <span class="visually-hidden">Đang tải...</span>
          </div>
          <div class="mt-2 text-muted">Đang tải danh sách người dùng...</div>
        </td>
      </tr>
    `;
  }
}

function showErrorState() {
  const tbody = document.getElementById('usersTableBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-5 text-danger">
          <i class="bi bi-exclamation-triangle fs-1"></i>
          <div class="mt-2">Không thể tải danh sách người dùng</div>
        </td>
      </tr>
    `;
  }
}

// Global functions
window.changePage = function(page) {
  currentPage = page;
  loadUsers();
};

window.viewUser = async function(userId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    const user = result.user;

    await Dialog.alert(`
      <div class="text-start">
        <h5>${user.first_name} ${user.last_name}</h5>
        <hr>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Số điện thoại:</strong> ${user.phone || '-'}</p>
        <p><strong>Vai trò:</strong> ${user.role}</p>
        <p><strong>Trạng thái:</strong> ${user.status}</p>
        <p><strong>Email xác thực:</strong> ${user.email_verified ? 'Đã xác thực' : 'Chưa xác thực'}</p>
        <p><strong>Ngày tạo:</strong> ${formatDate(user.created_at)}</p>
        <p><strong>Đăng nhập lần cuối:</strong> ${formatDate(user.last_login_at)}</p>
      </div>
    `, { title: 'Thông tin người dùng' });

  } catch (error) {
    console.error('Error viewing user:', error);
    showNotification('Không thể tải thông tin người dùng', 'danger');
  }
};

window.editUser = async function(userId) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/users/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    const user = result.user;

    // Show edit options
    const action = await Dialog.confirm(`
      <div class="text-start">
        <p><strong>${user.first_name} ${user.last_name}</strong></p>
        <p class="text-muted">${user.email}</p>
        <hr>
        <p>Chọn hành động:</p>
        <div class="list-group">
          <button class="list-group-item list-group-item-action" onclick="window.changeUserStatus('${userId}', '${user.status}'); return false;">
            Thay đổi trạng thái (Hiện tại: ${user.status})
          </button>
          <button class="list-group-item list-group-item-action" onclick="window.changeUserRole('${userId}', '${user.role}'); return false;">
            Thay đổi vai trò (Hiện tại: ${user.role})
          </button>
        </div>
      </div>
    `, {
      title: 'Chỉnh sửa người dùng',
      confirmText: 'Đóng',
      showCancelButton: false
    });

  } catch (error) {
    console.error('Error editing user:', error);
    showNotification('Không thể tải thông tin người dùng', 'danger');
  }
};

window.changeUserStatus = async function(userId, currentStatus) {
  const statuses = {
    'active': 'Hoạt động',
    'suspended': 'Tạm khóa',
    'inactive': 'Không hoạt động'
  };

  const options = Object.entries(statuses)
    .filter(([key]) => key !== currentStatus)
    .map(([key, value]) => `<option value="${key}">${value}</option>`)
    .join('');

  const newStatus = await Dialog.prompt(`
    <div class="mb-3">
      <label class="form-label">Chọn trạng thái mới:</label>
      <select class="form-select" id="statusSelect">
        ${options}
      </select>
    </div>
  `, {
    title: 'Thay đổi trạng thái',
    inputType: 'custom',
    confirmText: 'Cập nhật'
  });

  if (newStatus) {
    const selectedStatus = document.getElementById('statusSelect')?.value;
    if (selectedStatus) {
      await updateUserStatus(userId, selectedStatus);
    }
  }
};

window.changeUserRole = async function(userId, currentRole) {
  const roles = {
    'customer': 'Khách hàng',
    'admin': 'Admin'
  };

  const options = Object.entries(roles)
    .filter(([key]) => key !== currentRole)
    .map(([key, value]) => `<option value="${key}">${value}</option>`)
    .join('');

  const confirmed = await Dialog.confirm(`
    <div class="mb-3">
      <label class="form-label">Chọn vai trò mới:</label>
      <select class="form-select" id="roleSelect">
        ${options}
      </select>
    </div>
  `, {
    title: 'Thay đổi vai trò',
    confirmText: 'Cập nhật'
  });

  if (confirmed) {
    const selectedRole = document.getElementById('roleSelect')?.value;
    if (selectedRole) {
      await updateUserRole(userId, selectedRole);
    }
  }
};

async function updateUserStatus(userId, status) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/users/${userId}/status`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    showNotification('Cập nhật trạng thái thành công', 'success');
    loadUsers();
    loadUserStats();

  } catch (error) {
    console.error('Error updating user status:', error);
    showNotification('Không thể cập nhật trạng thái', 'danger');
  }
}

async function updateUserRole(userId, role) {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`/api/admin/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ role })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.message);
    }

    showNotification('Cập nhật vai trò thành công', 'success');
    loadUsers();
    loadUserStats();

  } catch (error) {
    console.error('Error updating user role:', error);
    showNotification('Không thể cập nhật vai trò', 'danger');
  }
}

// Utility: Debounce
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

// Utility: Show notification
function showNotification(message, type = 'info') {
  // Create toast notification
  const toast = document.createElement('div');
  toast.className = `toast align-items-center text-white bg-${type} border-0`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  toast.setAttribute('aria-atomic', 'true');
  toast.innerHTML = `
    <div class="d-flex">
      <div class="toast-body">${message}</div>
      <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
    </div>
  `;

  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container position-fixed top-0 end-0 p-3';
    document.body.appendChild(container);
  }

  container.appendChild(toast);
  const bsToast = new bootstrap.Toast(toast);
  bsToast.show();

  toast.addEventListener('hidden.bs.toast', () => {
    toast.remove();
  });
}
