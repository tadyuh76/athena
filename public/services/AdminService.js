// Lớp này xử lý việc gọi các API chỉ dành cho Admin (đã được bảo vệ bằng token và role)
export class AdminService {
    constructor() {
        this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
    }

    async makeAdminRequest(endpoint, method = 'GET', body = null) {
        const token = localStorage.getItem('authToken');
        
        if (!token) throw new Error('Unauthorized'); // Lỗi 401
        
        const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
        
        const options = { method, headers };
        if (body && method !== 'GET') options.body = JSON.stringify(body);

        // GỌI API ADMIN (endpoint có tiền tố /admin đã được thêm)
        const response = await fetch(`${this.baseUrl}/admin${endpoint}`, options);
        
        // Đọc nội dung phản hồi
        const responseText = await response.text();
        let data = {};

        try {
            data = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
            if (!response.ok) {
                 // Xử lý lỗi nếu server trả về non-JSON (như lỗi 500 HTML)
                 throw new Error(`Server Error: Status ${response.status} - Non-JSON response.`);
            }
        }

        if (response.status === 403) {
            throw new Error('Forbidden'); // Lỗi 403
        }

        if (!response.ok) {
            throw new Error(data.error || `API Error: Status ${response.status}`);
        }
        
        return data; 
    }

    // DASHBOARD
    async getDashboardSummary() {
        return this.makeAdminRequest('/summary');
    }

    // COLLECTION CRUD (AdminProductService.ts)
    async createCollection(collectionData) {
        return this.makeAdminRequest('/collections', 'POST', collectionData);
    }
    
    async updateCollection(id, collectionData) {
        return this.makeAdminRequest(`/collections/${id}`, 'PUT', collectionData);
    }

    async deleteCollection(id) {
        return this.makeAdminRequest(`/collections/${id}`, 'DELETE');
    }
}