import { AuthService } from "./AuthService.js";

/**
 * Service for admin product operations
 */
export class AdminProductService {
  constructor() {
    this.authService = new AuthService();
    this.apiUrl = window.ENV ? window.ENV.getApiUrl() : '';
  }

  /**
   * Get all products (admin only)
   */
  async getAllProducts() {
    const response = await this.authService.makeRequest("/admin/products", "GET");
    return response;
  }

  /**
   * Get product by ID (admin only)
   */
  async getProductById(id) {
    const response = await this.authService.makeRequest(`/admin/products/${id}`, "GET");
    return response;
  }

  /**
   * Create new product (admin only)
   */
  async createProduct(productData) {
    const response = await this.authService.makeRequest("/admin/products", "POST", productData);
    return response;
  }

  /**
   * Update product (admin only)
   */
  async updateProduct(id, productData) {
    const response = await this.authService.makeRequest(`/admin/products/${id}`, "PUT", productData);
    return response;
  }

  /**
   * Delete product (admin only)
   */
  async deleteProduct(id) {
    const response = await this.authService.makeRequest(`/admin/products/${id}`, "DELETE");
    return response;
  }

  /**
   * Upload product image (admin only)
   * @param {File} file - Image file from file input
   * @returns {Promise<{success: boolean, url: string}>} - Uploaded image URL
   */
  async uploadProductImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('authToken');

    const response = await fetch(`${this.apiUrl}/admin/products/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get variants for a product (admin only)
   */
  async getProductVariants(productId) {
    const response = await this.authService.makeRequest(`/admin/products/${productId}/variants`, "GET");
    return response;
  }

  /**
   * Upload variant image (admin only)
   * @param {File} file - Image file from file input
   * @returns {Promise<{success: boolean, url: string}>} - Uploaded image URL
   */
  async uploadVariantImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    const token = localStorage.getItem('authToken');

    const response = await fetch(`${this.apiUrl}/admin/products/variants/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    const data = await response.json();
    return data;
  }

  /**
   * Get all collections (for product form dropdown)
   */
  async getAllCollections() {
    const response = await this.authService.makeRequest("/admin/collections", "GET");
    return response;
  }

  /**
   * Get dashboard summary (admin only)
   */
  async getDashboardSummary() {
    const response = await this.authService.makeRequest("/admin/dashboard", "GET");
    return response;
  }

  /**
   * Upsert product variants (admin only)
   * Handles both insert (new variants) and update (existing variants)
   * @param {string} productId - Product ID
   * @param {Array} variants - Array of variant objects
   * @returns {Promise<{success: boolean, data: any}>}
   */
  async upsertVariants(productId, variants) {
    const response = await this.authService.makeRequest(`/admin/products/${productId}/variants`, "POST", variants);
    return response;
  }

  /**
   * Delete product variant (admin only)
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @returns {Promise<{success: boolean}>}
   */
  async deleteVariant(productId, variantId) {
    const response = await this.authService.makeRequest(`/admin/products/${productId}/variants/${variantId}`, "DELETE");
    return response;
  }
}
