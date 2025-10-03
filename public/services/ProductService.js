export class ProductService {
  constructor() {
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  async makeRequest(endpoint, method = "GET", body = null) {
    const headers = {
      "Content-Type": "application/json",
    };

    const token = localStorage.getItem("authToken");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
    };

    if (body && method !== "GET") {
      options.body = JSON.stringify(body);
    }

    const url = `${this.baseUrl}${endpoint}`;
    console.log('Making request to:', url, 'with options:', options);
    
    const response = await fetch(url, options);
    console.log('Response status:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error:', errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    console.log('API Response:', result);
    return result;
  }

  async getProducts(filters = {}, page = 1, limit = 20) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters to params
    Object.keys(filters).forEach((key) => {
      if (
        filters[key] !== undefined &&
        filters[key] !== null &&
        filters[key] !== ""
      ) {
        params.append(key, filters[key]);
      }
    });

    const cacheKey = `products:${params.toString()}`;

    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = await this.makeRequest(`/products?${params.toString()}`);

    // Cache the result
    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  async getProductById(id) {
    const cacheKey = `product:${id}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = await this.makeRequest(`/products/${id}`);

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  async getProductBySlug(slug) {
    const cacheKey = `product:slug:${slug}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = await this.makeRequest(`/products/slug/${slug}`);

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  async getCategories() {
    const cacheKey = "categories";

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = await this.makeRequest("/categories");

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  async getCollections() {
    const cacheKey = "collections";

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    const result = await this.makeRequest("/collections");

    this.cache.set(cacheKey, {
      data: result,
      timestamp: Date.now(),
    });

    return result;
  }

  clearCache() {
    this.cache.clear();
  }

  formatPrice(price) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  }

  calculateDiscount(price, comparePrice) {
    if (!comparePrice || comparePrice <= price) return 0;
    return Math.round(((comparePrice - price) / comparePrice) * 100);
  }

  getDiscountPercentage(price, comparePrice) {
    return this.calculateDiscount(price, comparePrice);
  }

  isInStock(product) {
    if (!product.variants || product.variants.length === 0) return true;
    return product.variants.some(
      (variant) => this.getAvailableStock(variant) > 0
    );
  }

  getAvailableStock(variant) {
    return Math.max(
      0,
      (variant.inventory_quantity || 0) - (variant.reserved_quantity || 0)
    );
  }

  getTotalStock(product) {
    if (!product.variants || product.variants.length === 0) return 0;
    return product.variants.reduce(
      (total, variant) => total + this.getAvailableStock(variant),
      0
    );
  }
}
