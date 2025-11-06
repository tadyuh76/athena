import { AuthService } from "./AuthService.js";

export class CollectionService {
  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Get all collections (admin only)
   */
  async getAllCollections() {
    const response = await this.authService.makeRequest("/admin/collections", "GET");
    return response;
  }

  /**
   * Create new collection (admin only)
   */
  async createCollection(collectionData) {
    const response = await this.authService.makeRequest("/admin/collections", "POST", collectionData);
    return response;
  }

  /**
   * Update collection (admin only)
   */
  async updateCollection(id, collectionData) {
    const response = await this.authService.makeRequest(`/admin/collections/${id}`, "PUT", collectionData);
    return response;
  }

  /**
   * Delete collection (admin only)
   */
  async deleteCollection(id) {
    const response = await this.authService.makeRequest(`/admin/collections/${id}`, "DELETE");
    return response;
  }

  /**
   * Upload collection image (admin only)
   * @param {File} file - Image file from file input
   * @returns {Promise<{url: string}>} - Uploaded image URL
   */
  async uploadImage(file) {
    const formData = new FormData();
    formData.append('image', file);

    // Get auth token
    const token = localStorage.getItem('authToken');

    // getApiUrl() already includes /api, so just add the endpoint path
    const apiUrl = window.ENV ? window.ENV.getApiUrl() : '';
    const response = await fetch(`${apiUrl}/admin/collections/upload-image`, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        // Don't set Content-Type - browser will set it with boundary
      },
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }

    const data = await response.json();
    return data;
  }
}
