export class CartService {
  constructor() {
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
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
    console.log('[CartService] Making request:', { endpoint, method, body });

    const headers = {
      'Content-Type': 'application/json',
    };

    const token = localStorage.getItem('authToken');
    if (token) {
      console.log('[CartService] Using auth token');
      headers['Authorization'] = `Bearer ${token}`;
    } else {
      console.log('[CartService] No auth token found');
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== 'GET') {
      options.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log('[CartService] Fetching:', url);
    const response = await fetch(url, options);
    console.log('[CartService] Response status:', response.status);
    const data = await response.json();
    console.log('[CartService] Response data:', data);
    return data;
  }

  async getCart() {
    try {
      console.log('[CartService.getCart] Called');
      // Only get cart for authenticated users
      if (!localStorage.getItem('authToken')) {
        console.log('[CartService.getCart] No auth token, returning empty cart');
        this.cart = { id: null, items: [] };
        this.updateCartBadge();
        return this.cart;
      }

      console.log('[CartService.getCart] Fetching cart from API...');
      this.cart = await this.makeRequest('/cart');
      console.log('[CartService.getCart] Cart received:', { itemCount: this.cart?.items?.length || 0 });
      this.updateCartBadge();
      return this.cart;
    } catch (error) {
      console.error('[CartService.getCart] Error:', error);
      // Create empty cart if API fails
      this.cart = { id: null, items: [] };
      this.updateCartBadge();
      return this.cart;
    }
  }

  async addItem(productId, variantId, quantity = 1) {
    console.log('[CartService.addItem] Called with:', { productId, variantId, quantity });

    // Require authentication for cart operations
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      console.error('[CartService.addItem] No auth token found');
      throw new Error('Authentication required to add items to cart');
    }

    try {
      const body = {
        product_id: productId,
        variant_id: variantId,
        quantity: quantity
      };

      console.log('[CartService.addItem] Sending request to add item...');
      const result = await this.makeRequest('/cart/items', 'POST', body);
      console.log('[CartService.addItem] Item added successfully:', result);

      console.log('[CartService.addItem] Refreshing cart...');
      await this.getCart(); // Refresh cart
      this.showNotification('Added to cart');
      return result;
    } catch (error) {
      console.error('[CartService.addItem] Error:', error);
      throw error;
    }
  }

  async updateItemQuantity(itemId, quantity) {
    // Require authentication for cart operations
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Authentication required to update cart');
    }

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
    // Require authentication for cart operations
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
      throw new Error('Authentication required to remove items from cart');
    }

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
    
    // Update badges in regular DOM
    const badges = document.querySelectorAll('.cart-count, .cart-badge');
    badges.forEach(badge => {
      badge.textContent = count > 0 ? count.toString() : '';
      badge.style.display = count > 0 ? 'inline-block' : 'none';
    });

    // Update badge in web component (site-header)
    const siteHeader = document.querySelector('site-header');
    if (siteHeader && siteHeader.shadowRoot) {
      const cartLink = siteHeader.shadowRoot.getElementById('cart-link');
      if (cartLink) {
        let existingBadge = cartLink.querySelector('.cart-badge');
        
        if (count > 0) {
          if (existingBadge) {
            existingBadge.textContent = count;
          } else {
            const badge = document.createElement('span');
            badge.className = 'cart-badge';
            badge.style.cssText = 'position: absolute; top: -5px; right: -5px; background: #dc2626; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; z-index: 1;';
            badge.textContent = count;
            cartLink.style.position = 'relative';
            cartLink.appendChild(badge);
          }
        } else if (existingBadge) {
          existingBadge.remove();
        }
      }
    }
  }

  showNotification(message, type = 'success') {
    // Create toast container if it doesn't exist
    let toastContainer = document.getElementById('toastContainer');
    if (!toastContainer) {
      toastContainer = document.createElement('div');
      toastContainer.id = 'toastContainer';
      toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
      toastContainer.style.zIndex = '1055';
      document.body.appendChild(toastContainer);
    }

    const toastId = 'cart-toast-' + Date.now();
    const bgClass = type === 'success' ? 'bg-success' : type === 'warning' ? 'bg-warning' : type === 'danger' ? 'bg-danger' : 'bg-info';
    const icon = type === 'success' ? 'bi-cart-check-fill' : 'bi-cart-x-fill';
    
    const toastHTML = `
      <div class="toast align-items-center text-white ${bgClass} border-0 shadow-lg" 
           id="${toastId}" role="alert" aria-live="assertive" aria-atomic="true">
        <div class="d-flex">
          <div class="toast-body d-flex align-items-center">
            <i class="bi ${icon} me-2"></i>
            ${message}
          </div>
          <button type="button" class="btn-close btn-close-white me-2 m-auto" 
                  data-bs-dismiss="toast" aria-label="Close"></button>
        </div>
      </div>
    `;
    
    toastContainer.insertAdjacentHTML('beforeend', toastHTML);
    
    const toastElement = document.getElementById(toastId);
    if (window.bootstrap) {
      const toast = new bootstrap.Toast(toastElement, { delay: 3000 });
      toast.show();
      
      toastElement.addEventListener('hidden.bs.toast', () => {
        toastElement.remove();
      });
    } else {
      // Fallback without Bootstrap
      toastElement.style.display = 'block';
      setTimeout(() => {
        toastElement.style.opacity = '0';
        setTimeout(() => toastElement.remove(), 300);
      }, 3000);
    }
  }

  formatPrice(price) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  }
}