export class CartService {
  constructor() {
    this.baseUrl = '/api';
    this.cart = null;
    this.sessionId = this.getSessionId();
  }

  getSessionId() {
    let sessionId = localStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  async makeRequest(endpoint, method = 'GET', body = null) {
    const headers = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, options);
    return await response.json();
  }

  async getCart() {
    try {
      const params = new URLSearchParams();
      if (!localStorage.getItem('authToken')) {
        params.append('session_id', this.sessionId);
      }

      this.cart = await this.makeRequest(`/cart?${params.toString()}`);
      this.updateCartBadge();
      return this.cart;
    } catch (error) {
      console.error('Failed to get cart:', error);
      // Create empty cart if API fails
      this.cart = { id: this.sessionId, items: [] };
      return this.cart;
    }
  }

  async addItem(productId, variantId, quantity = 1) {
    try {
      const body = {
        product_id: productId,
        variant_id: variantId,
        quantity: quantity
      };

      // Add session_id for guest users
      if (!localStorage.getItem('authToken')) {
        body.session_id = this.sessionId;
      }

      const result = await this.makeRequest('/cart/items', 'POST', body);

      await this.getCart(); // Refresh cart
      this.showNotification('Added to cart');
      return result;
    } catch (error) {
      console.error('Failed to add item to cart:', error);
      throw error;
    }
  }

  async updateItemQuantity(itemId, quantity) {
    try {
      const result = await this.makeRequest(`/cart/items/${itemId}`, 'PUT', {
        quantity: quantity
      });

      await this.getCart(); // Refresh cart
      return result;
    } catch (error) {
      console.error('Failed to update item quantity:', error);
      throw error;
    }
  }

  async removeItem(itemId) {
    try {
      await this.makeRequest(`/cart/items/${itemId}`, 'DELETE');
      await this.getCart(); // Refresh cart
      this.showNotification('Removed from cart');
      return true;
    } catch (error) {
      console.error('Failed to remove item:', error);
      throw error;
    }
  }

  async clearCart() {
    try {
      if (!this.cart || !this.cart.id) {
        throw new Error('Cart not found');
      }

      const params = new URLSearchParams();
      if (!localStorage.getItem('authToken')) {
        params.append('session_id', this.sessionId);
      }
      await this.makeRequest(`/cart/clear?${params.toString()}`, 'POST');
      await this.getCart(); // Refresh cart
      return true;
    } catch (error) {
      console.error('Failed to clear cart:', error);
      throw error;
    }
  }

  async getCartSummary() {
    try {
      if (!this.cart || !this.cart.id) {
        await this.getCart();
      }

      const params = new URLSearchParams();
      if (!localStorage.getItem('authToken')) {
        params.append('session_id', this.sessionId);
      }
      return await this.makeRequest(`/cart/summary?${params.toString()}`);
    } catch (error) {
      console.error('Failed to get cart summary:', error);
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0
      };
    }
  }

  async mergeGuestCart() {
    try {
      if (!this.sessionId || !localStorage.getItem('authToken')) {
        return;
      }

      const result = await this.makeRequest('/cart/merge', 'POST', {
        session_id: this.sessionId
      });

      // Clear session ID after merge
      localStorage.removeItem('sessionId');
      this.sessionId = null;
      
      this.cart = result;
      this.updateCartBadge();
      return result;
    } catch (error) {
      console.error('Failed to merge guest cart:', error);
    }
  }

  getItemCount() {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((total, item) => total + (item.price_at_time * item.quantity), 0);
  }

  updateCartBadge() {
    const count = this.getItemCount();
    const badges = document.querySelectorAll('.cart-count');
    badges.forEach(badge => {
      badge.textContent = count > 0 ? count.toString() : '';
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });
  }

  showNotification(message) {
    const toast = document.createElement('div');
    toast.className = 'position-fixed bottom-0 end-0 p-3';
    toast.style.zIndex = '11';
    toast.innerHTML = `
      <div class="toast show" role="alert">
        <div class="toast-body">
          <i class="bi bi-cart-check-fill text-success me-2"></i>
          ${message}
        </div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.remove();
    }, 3000);
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
}