const API_URL = window.ENV ? window.ENV.getApiUrl() : '/api';

// Helper function to make authenticated requests
async function makeAuthRequest(url, options = {}) {
  const token = localStorage.getItem('authToken');

  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Request failed');
  }

  return await response.json();
}

export const DiscountService = {
  /**
   * Validate discount code cho checkout
   */
  async validateDiscount(code, items, subtotal) {
    try {
      return await makeAuthRequest(`${API_URL}/discounts/validate`, {
        method: 'POST',
        body: JSON.stringify({
          code,
          items,
          subtotal
        })
      });
    } catch (error) {
      console.error('Error validating discount:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Lấy danh sách discounts
   */
  async getDiscounts(filters = {}) {
    try {
      const params = new URLSearchParams();
      if (filters.is_active !== undefined) {
        params.append('is_active', filters.is_active);
      }
      if (filters.type) {
        params.append('type', filters.type);
      }
      if (filters.search) {
        params.append('search', filters.search);
      }
      if (filters.page) {
        params.append('page', filters.page);
      }
      if (filters.limit) {
        params.append('limit', filters.limit);
      }

      const url = `${API_URL}/admin/discounts${params.toString() ? '?' + params.toString() : ''}`;
      return await makeAuthRequest(url);
    } catch (error) {
      console.error('Error getting discounts:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Lấy discount theo ID
   */
  async getDiscountById(id) {
    try {
      return await makeAuthRequest(`${API_URL}/admin/discounts/${id}`);
    } catch (error) {
      console.error('Error getting discount:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Tạo discount mới
   */
  async createDiscount(data) {
    try {
      return await makeAuthRequest(`${API_URL}/admin/discounts`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error creating discount:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Cập nhật discount
   */
  async updateDiscount(id, data) {
    try {
      return await makeAuthRequest(`${API_URL}/admin/discounts/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    } catch (error) {
      console.error('Error updating discount:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Xóa discount
   */
  async deleteDiscount(id) {
    try {
      return await makeAuthRequest(`${API_URL}/admin/discounts/${id}`, {
        method: 'DELETE'
      });
    } catch (error) {
      console.error('Error deleting discount:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Lấy thống kê discount
   */
  async getDiscountStats(id) {
    try {
      return await makeAuthRequest(`${API_URL}/admin/discounts/${id}/stats`);
    } catch (error) {
      console.error('Error getting discount stats:', error);
      throw error;
    }
  },

  /**
   * ADMIN: Lấy lịch sử sử dụng discount
   */
  async getDiscountUsage(id, page = 1, limit = 20) {
    try {
      const params = new URLSearchParams({ page, limit });
      return await makeAuthRequest(
        `${API_URL}/admin/discounts/${id}/usage?${params.toString()}`
      );
    } catch (error) {
      console.error('Error getting discount usage:', error);
      throw error;
    }
  }
};
