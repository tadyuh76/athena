import { AuthService } from "/services/AuthService.js";
import { AdminService } from "/services/AdminService.js";
import { ProductService } from "/services/ProductService.js";

const authService = new AuthService();
const adminService = new AdminService(); 
const productService = new ProductService();

// Tạo AdminService Class để gọi các Admin API (đã được bảo vệ)
class AdminService {
    constructor() {
        this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
    }

    async makeAdminRequest(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('authToken');
        
        if (!token) throw new Error('Unauthorized'); // Sẽ bị bắt và chuyển hướng
        
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        
        const options = { method, headers };
        if (body && method !== 'GET') options.body = JSON.stringify(body);

        const response = await fetch(`${this.baseUrl}/admin${endpoint}`, options);
        
        if (response.status === 403) {
            throw new Error('Forbidden'); // Admin Service sẽ bắt lỗi 403
        }
        
        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || `API Error: ${response.status}`);
        }
        
        return response.json();
    }

    async getDashboardSummary() {
        return this.makeAdminRequest('/summary');
    }
}

// Logic chính của Admin App
document.addEventListener("DOMContentLoaded", async () => {
    // 1. Gắn sự kiện Logout
    document.getElementById('adminLogout')?.addEventListener('click', async (e) => {
        e.preventDefault();
        await authService.logout(); // Sử dụng AuthService có sẵn
        window.location.href = '/login.html';
    });

    try {
        await checkAdminAuth();
        loadDashboard();
        setupNavigation();
        updateAdminName();
        
    } catch (error) {
        console.error("Admin App Initialization Error:", error);
        handleAuthError(error.message);
    }
});

function handleAuthError(errorMessage) {
    if (errorMessage === 'Forbidden') {
        // Hiển thị màn hình từ chối truy cập
        document.getElementById('unauthorizedScreen').classList.remove('d-none');
        document.body.classList.remove('admin-mode');
    } else if (errorMessage === 'Unauthorized' || errorMessage === 'User not found') {
        // Chuyển hướng về trang đăng nhập
        window.location.href = '/login.html?redirect=/admin.html';
    }
}

async function checkAdminAuth() {
    const user = authService.getUser();
    
    // Yêu cầu bắt buộc phải đăng nhập
    if (!authService.isAuthenticated()) {
        throw new Error('Unauthorized'); 
    }
    
    // Nếu user tồn tại nhưng không có role (trường hợp hiếm), hoặc role không hợp lệ
    if (!user || (user.role !== 'admin' && user.role !== 'staff')) {
        throw new Error('Forbidden'); 
    }

    // Kiểm tra quyền bằng cách gọi thử Dashboard API (nếu thành công -> quyền ok)
    await adminService.getDashboardSummary();
}

function updateAdminName() {
    const user = authService.getUser();
    if (user) {
        document.getElementById('adminName').textContent = user.first_name || user.email;
    }
}


async function loadDashboard() {
    const summaryCards = document.getElementById('summaryCards');
    summaryCards.innerHTML = ''; // Xóa spinner

    try {
        const { summary } = await adminService.getDashboardSummary();
        
        const data = [
            { label: 'Total Orders', value: summary.totalOrders, icon: 'bi-receipt' },
            { label: 'Total Products', value: summary.totalProducts, icon: 'bi-tags' },
            { label: 'Total Revenue', value: '$' + summary.totalRevenue.toFixed(2), icon: 'bi-currency-dollar' },
        ];
        
        summaryCards.innerHTML = data.map(item => `
            <div class="col-md-4">
                <div class="summary-card">
                    <div class="label">${item.label}</div>
                    <div class="d-flex align-items-center justify-content-between mt-2">
                        <div class="value">${item.value}</div>
                        <i class="bi ${item.icon} fs-3 text-muted"></i>
                    </div>
                </div>
            </div>
        `).join('');

    } catch (error) {
        // Lỗi 403 đã được xử lý ở handleAuthError
        if (error.message !== 'Forbidden') {
             summaryCards.innerHTML = '<div class="col-12"><p class="text-danger">Không thể tải dữ liệu Dashboard.</p></div>';
        }
    }
}

function setupNavigation() {
    document.querySelectorAll('.sidebar-menu a').forEach(link => {
        link.addEventListener('click', (e) => {
            if (link.id === 'adminLogout') return;
            
            e.preventDefault();
            
            // Lấy ID Section (ví dụ: #dashboard -> dashboardSection)
            const targetId = link.getAttribute('href').substring(1);
            const targetSectionId = targetId + 'Section';
            
            // Cập nhật active class
            document.querySelectorAll('.sidebar-menu a').forEach(a => a.classList.remove('active'));
            link.classList.add('active');
            
            // Ẩn/Hiện nội dung chính
            document.querySelectorAll('.admin-main-content > div').forEach(section => {
                // Chỉ ẩn các section có ID kết thúc bằng "Section"
                if (section.id && section.id.endsWith('Section')) {
                    section.style.display = 'none';
                }
            });
            
            const targetSection = document.getElementById(targetSectionId);
            if (targetSection) {
                targetSection.style.display = 'block';
            }
        });
    });
}