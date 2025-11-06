export class CartService {
  constructor() {
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : "/api";
    this.cart = null;
  }

  async makeRequest(endpoint, method = "GET", body = null) {
    console.log("[CartService] Making request:", { endpoint, method, body });

    const headers = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("authToken");
    if (token) {
      console.log("[CartService] Using auth token");
      headers["Authorization"] = `Bearer ${token}`;
    } else {
      console.log("[CartService] No auth token found");
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log("[CartService] Fetching:", url);
    const response = await fetch(url, options);
    console.log("[CartService] Response status:", response.status);
    const data = await response.json();
    console.log("[CartService] Response data:", data);
    return data;
  }

  async getCart() {
    try {
      console.log("[CartService.getCart] Called");

      // Require authentication
      if (!localStorage.getItem("authToken")) {
        console.log("[CartService.getCart] No auth token, user must login");
        this.cart = { id: null, items: [] };
        this.updateCartBadge();
        return this.cart;
      }

      console.log("[CartService.getCart] Fetching cart from API...");
      this.cart = await this.makeRequest("/cart");
      console.log("[CartService.getCart] Cart received:", {
        itemCount: this.cart?.items?.length || 0,
      });
      this.updateCartBadge();
      return this.cart;
    } catch (error) {
      console.error("[CartService.getCart] Error:", error);
      this.cart = { id: null, items: [] };
      this.updateCartBadge();
      return this.cart;
    }
  }

  async addItem(productId, variantId, quantity = 1) {
    console.log("[CartService.addItem] Called with:", {
      productId,
      variantId,
      quantity,
    });

    // Require authentication for cart operations
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Authentication required. Please login to add items to cart.");
    }

    try {
      const body = {
        product_id: productId,
        variant_id: variantId,
        quantity: quantity,
      };

      console.log("[CartService.addItem] Sending request to add item...");
      const result = await this.makeRequest("/cart/items", "POST", body);
      console.log("[CartService.addItem] Item added successfully:", result);

      return result;
    } catch (error) {
      console.error("[CartService.addItem] Error:", error);
      throw error;
    }
  }

  async updateItemQuantity(itemId, quantity) {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Authentication required");
    }

    try {
      const result = await this.makeRequest(`/cart/items/${itemId}`, "PUT", {
        quantity: quantity,
      });

      return result;
    } catch (error) {
      console.error("Failed to update item quantity:", error);
      throw error;
    }
  }

  async removeItem(itemId) {
    const authToken = localStorage.getItem("authToken");
    if (!authToken) {
      throw new Error("Authentication required");
    }

    try {
      await this.makeRequest(`/cart/items/${itemId}`, "DELETE");
      return true;
    } catch (error) {
      console.error("Failed to remove item:", error);
      throw error;
    }
  }

  async clearCart() {
    try {
      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        throw new Error("Authentication required");
      }

      if (!this.cart || !this.cart.id) {
        throw new Error("Cart not found");
      }

      await this.makeRequest(`/cart/clear`, "POST");
      await this.getCart(); // Refresh cart
      return true;
    } catch (error) {
      console.error("Failed to clear cart:", error);
      throw error;
    }
  }

  async getCartSummary() {
    try {
      if (!this.cart || !this.cart.id) {
        await this.getCart();
      }

      const authToken = localStorage.getItem("authToken");
      if (!authToken) {
        return {
          subtotal: 0,
          shipping: 0,
          tax: 0,
          discount: 0,
          total: 0,
          itemCount: 0,
        };
      }

      return await this.makeRequest(`/cart/summary`);
    } catch (error) {
      console.error("Failed to get cart summary:", error);
      return {
        subtotal: 0,
        tax: 0,
        shipping: 0,
        total: 0,
        itemCount: 0,
      };
    }
  }

  getItemCount() {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce((total, item) => total + item.quantity, 0);
  }

  getCartTotal() {
    if (!this.cart || !this.cart.items) return 0;
    return this.cart.items.reduce(
      (total, item) => total + item.price_at_time * item.quantity,
      0
    );
  }

  updateCartBadge() {
    const count = this.getItemCount();

    // Update badges in regular DOM
    const badges = document.querySelectorAll(".cart-count, .cart-badge");
    badges.forEach((badge) => {
      badge.textContent = count > 0 ? count.toString() : "";
      badge.style.display = count > 0 ? "inline-block" : "none";
    });

    // Update badge in web component (site-header)
    const siteHeader = document.querySelector("site-header");
    if (siteHeader && siteHeader.shadowRoot) {
      const cartLink = siteHeader.shadowRoot.getElementById("cart-link");
      if (cartLink) {
        let existingBadge = cartLink.querySelector(".cart-badge");

        if (count > 0) {
          if (existingBadge) {
            existingBadge.textContent = count;
          } else {
            const badge = document.createElement("span");
            badge.className = "cart-badge";
            badge.style.cssText =
              "position: absolute; top: -5px; right: -5px; background: #dc2626; color: white; border-radius: 50%; width: 18px; height: 18px; font-size: 10px; display: flex; align-items: center; justify-content: center; z-index: 1;";
            badge.textContent = count;
            cartLink.style.position = "relative";
            cartLink.appendChild(badge);
          }
        } else if (existingBadge) {
          existingBadge.remove();
        }
      }
    }
  }

  // NOTE: Toast notifications removed from service layer per CLAUDE.md guidelines
  // Page scripts should handle user notifications directly

  formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }
}
