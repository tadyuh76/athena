/**
 * AddressService - Frontend service for managing user addresses
 */
export class AddressService {
  constructor() {
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
    this.addresses = [];
    this.defaultAddress = null;
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (!token) {
      throw new Error('Authentication required');
    }

    headers['Authorization'] = `Bearer ${token}`;

    const options = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);

    if (response.status === 401) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      window.location.href = '/login.html';
      throw new Error('Session expired');
    }

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || 'Request failed');
    }

    return await response.json();
  }

  /**
   * Get all addresses for the authenticated user
   */
  async getAddresses() {
    try {
      const result = await this.makeRequest('/addresses');
      this.addresses = result.addresses || [];
      this.defaultAddress = this.addresses.find(addr => addr.is_default) || null;
      return this.addresses;
    } catch (error) {
      console.error('Failed to get addresses:', error);
      throw error;
    }
  }

  /**
   * Get a specific address by ID
   */
  async getAddressById(addressId) {
    try {
      const result = await this.makeRequest(`/addresses/${addressId}`);
      return result.address;
    } catch (error) {
      console.error('Failed to get address:', error);
      throw error;
    }
  }

  /**
   * Get the default address
   */
  async getDefaultAddress() {
    try {
      const result = await this.makeRequest('/addresses/default');
      this.defaultAddress = result.address;
      return this.defaultAddress;
    } catch (error) {
      console.error('Failed to get default address:', error);
      throw error;
    }
  }

  /**
   * Create a new address
   */
  async createAddress(addressData) {
    try {
      const result = await this.makeRequest('/addresses', 'POST', addressData);
      await this.getAddresses(); // Refresh addresses list
      return result.address;
    } catch (error) {
      console.error('Failed to create address:', error);
      throw error;
    }
  }

  /**
   * Update an existing address
   */
  async updateAddress(addressId, addressData) {
    try {
      const result = await this.makeRequest(`/addresses/${addressId}`, 'PUT', addressData);
      await this.getAddresses(); // Refresh addresses list
      return result.address;
    } catch (error) {
      console.error('Failed to update address:', error);
      throw error;
    }
  }

  /**
   * Delete an address
   */
  async deleteAddress(addressId) {
    try {
      await this.makeRequest(`/addresses/${addressId}`, 'DELETE');
      await this.getAddresses(); // Refresh addresses list
      return true;
    } catch (error) {
      console.error('Failed to delete address:', error);
      throw error;
    }
  }

  /**
   * Set an address as the default
   */
  async setDefaultAddress(addressId) {
    try {
      const result = await this.makeRequest(`/addresses/${addressId}/default`, 'PUT');
      await this.getAddresses(); // Refresh addresses list
      return result.address;
    } catch (error) {
      console.error('Failed to set default address:', error);
      throw error;
    }
  }

  /**
   * Format address as a single line string - Vietnamese format
   * Format: Số nhà + Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
   */
  formatAddress(address) {
    const parts = [
      address.address_line1, // Số nhà + Tên đường
      address.address_line2, // Optional (căn hộ, tòa nhà)
      address.city, // Phường/Xã
      address.state_province, // Quận/Huyện
      address.country_code, // Tỉnh/Thành phố
    ].filter(Boolean);

    return parts.join(', ');
  }

  /**
   * Format address as multi-line HTML - Vietnamese format
   */
  formatAddressHTML(address) {
    const lines = [];

    lines.push(`<strong>${address.first_name} ${address.last_name}</strong>`);
    lines.push(`SĐT: ${address.phone}`);

    if (address.company) {
      lines.push(address.company);
    }

    // Địa chỉ chi tiết
    lines.push(address.address_line1); // Số nhà + Tên đường

    if (address.address_line2) {
      lines.push(address.address_line2); // Căn hộ, tòa nhà
    }

    // Phường/Xã, Quận/Huyện, Tỉnh/Thành phố
    const locationLine = [
      address.city, // Phường/Xã
      address.state_province, // Quận/Huyện
      address.country_code, // Tỉnh/Thành phố
    ].filter(Boolean).join(', ');
    lines.push(locationLine);

    return lines.join('<br>');
  }

  /**
   * Validate address data before submission - Vietnamese format
   */
  validateAddress(addressData) {
    const errors = [];

    if (!addressData.first_name?.trim()) {
      errors.push('Họ là bắt buộc');
    }

    if (!addressData.last_name?.trim()) {
      errors.push('Tên là bắt buộc');
    }

    if (!addressData.phone?.trim()) {
      errors.push('Số điện thoại là bắt buộc');
    }

    if (!addressData.address_line1?.trim()) {
      errors.push('Số nhà và tên đường là bắt buộc');
    }

    if (!addressData.city?.trim()) {
      errors.push('Phường/Xã là bắt buộc');
    }

    if (!addressData.state_province?.trim()) {
      errors.push('Quận/Huyện là bắt buộc');
    }

    if (!addressData.country_code?.trim()) {
      errors.push('Tỉnh/Thành phố là bắt buộc');
    }

    if (addressData.phone && addressData.phone.trim() && !/^[\d\s\-\+\(\)]+$/.test(addressData.phone)) {
      errors.push('Số điện thoại chứa ký tự không hợp lệ');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}
