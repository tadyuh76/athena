import { AuthService } from './AuthService.js';

export class OrderService {
  constructor() {
    this.authService = new AuthService();
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
  }

  /**
   * Create a direct "Buy Now" checkout session
   * Creates order directly from product variant and quantity, not from cart
   * @param {string} productId - Product ID
   * @param {string} variantId - Variant ID
   * @param {number} quantity - Quantity to purchase
   * @param {Object} shippingInfo - Shipping information
   * @returns {Promise<Object>} Checkout session response
   */
  async createBuyNowCheckout(productId, variantId, quantity, shippingInfo) {
    try {
      const response = await this.authService.makeRequest(
        '/orders/buy-now-checkout',
        'POST',
        {
          productId,
          variantId,
          quantity,
          shippingInfo,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to create buy now checkout');
      }

      return response;
    } catch (error) {
      console.error('[OrderService] Buy now checkout error:', error);
      throw error;
    }
  }

  /**
   * Create a checkout session from cart
   * @param {Object} shippingInfo - Shipping information
   * @returns {Promise<Object>} Checkout session response
   */
  async createCheckoutSession(shippingInfo) {
    try {
      const response = await this.authService.makeRequest(
        '/orders/checkout-session',
        'POST',
        {
          shippingInfo,
        }
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to create checkout session');
      }

      return response;
    } catch (error) {
      console.error('[OrderService] Checkout session error:', error);
      throw error;
    }
  }

  /**
   * Get user's orders
   * @returns {Promise<Array>} List of orders
   */
  async getMyOrders() {
    try {
      const response = await this.authService.makeRequest('/orders/me', 'GET');

      if (!response.success) {
        throw new Error(response.message || 'Failed to get orders');
      }

      return response.orders || [];
    } catch (error) {
      console.error('[OrderService] Get orders error:', error);
      throw error;
    }
  }

  /**
   * Get order by ID
   * @param {string} orderId - Order ID
   * @returns {Promise<Object>} Order details
   */
  async getOrderById(orderId) {
    try {
      const response = await this.authService.makeRequest(
        `/orders/${orderId}`,
        'GET'
      );

      if (!response.success) {
        throw new Error(response.message || 'Failed to get order');
      }

      return response.order;
    } catch (error) {
      console.error('[OrderService] Get order error:', error);
      throw error;
    }
  }
}
