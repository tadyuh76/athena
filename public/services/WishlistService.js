export class WishlistService {
  constructor() {
    this.baseUrl = '/api';
    this.wishlist = [];
    this.count = 0;
  }

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

    return await response.json();
  }

  async getWishlist() {
    try {
      this.wishlist = await this.makeRequest('/wishlist');
      this.updateCount();
      return this.wishlist;
    } catch (error) {
      console.error('Failed to get wishlist:', error);
      return [];
    }
  }

  async addToWishlist(productId, variantId = null, notes = null) {
    try {
      const result = await this.makeRequest('/wishlist', 'POST', {
        product_id: productId,
        variant_id: variantId,
        notes: notes
      });

      await this.getWishlist(); // Refresh wishlist
      this.showNotification('Added to wishlist');
      return result;
    } catch (error) {
      console.error('Failed to add to wishlist:', error);
      throw error;
    }
  }

  async removeFromWishlist(wishlistItemId) {
    try {
      await this.makeRequest(`/wishlist/${wishlistItemId}`, 'DELETE');
      await this.getWishlist(); // Refresh wishlist
      this.showNotification('Removed from wishlist');
      return true;
    } catch (error) {
      console.error('Failed to remove from wishlist:', error);
      throw error;
    }
  }

  async updateWishlistItem(wishlistItemId, updates) {
    try {
      const result = await this.makeRequest(`/wishlist/${wishlistItemId}`, 'PUT', updates);
      await this.getWishlist(); // Refresh wishlist
      return result;
    } catch (error) {
      console.error('Failed to update wishlist item:', error);
      throw error;
    }
  }

  async getWishlistCount() {
    try {
      const result = await this.makeRequest('/wishlist/count');
      this.count = result.count;
      this.updateBadge();
      return this.count;
    } catch (error) {
      console.error('Failed to get wishlist count:', error);
      return 0;
    }
  }

  isInWishlist(productId, variantId = null) {
    return this.wishlist.some(item => 
      item.product_id === productId && 
      (!variantId || item.variant_id === variantId)
    );
  }

  updateCount() {
    this.count = this.wishlist.length;
    this.updateBadge();
  }

  updateBadge() {
    const badges = document.querySelectorAll('.wishlist-count');
    badges.forEach(badge => {
      badge.textContent = this.count > 0 ? this.count.toString() : '';
      badge.style.display = this.count > 0 ? 'inline-block' : 'none';
    });
  }

  showNotification(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '11';
    toast.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-body">
          <i class="bi bi-heart-fill text-danger me-2"></i>
          ${message}
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  toggleWishlistButton(button, isInWishlist) {
    if (isInWishlist) {
      button.innerHTML = '<i class="bi bi-heart-fill"></i>';
      button.classList.add('active');
    } else {
      button.innerHTML = '<i class="bi bi-heart"></i>';
      button.classList.remove('active');
    }
  }
}