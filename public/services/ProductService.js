export class ProductService {
  constructor() {
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : "/api";
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    // Demo products used when backend is unavailable (client-side only)
    this.demoProducts = [
      {
        id: "demo-1",
        name: "Classic White T-Shirt",
        short_description: "Comfortable cotton tee",
        base_price: 29.99,
        compare_price: 39.99,
        images: [{ url: "/images/product1.jpg", is_primary: true }],
        variants: [
          {
            id: "d1-v1",
            sku: "WT-001",
            size: "M",
            color: "White",
            inventory_quantity: 10,
          },
        ],
      },
      {
        id: "demo-2",
        name: "Denim Jeans",
        short_description: "Slim fit denim",
        base_price: 79.99,
        compare_price: 99.99,
        images: [{ url: "/images/product2.jpg", is_primary: true }],
        variants: [
          {
            id: "d2-v1",
            sku: "DJ-002",
            size: "32",
            color: "Blue",
            inventory_quantity: 5,
          },
        ],
      },
    ];
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
    console.log("Making request to:", url, "with options:", options);

    const response = await fetch(url, options);
    console.log("Response status:", response.status, response.statusText);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error:", errorText);
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log("API Response:", result);
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

    try {
      const result = await this.makeRequest(`/products?${params.toString()}`);
      // Cache the result
      this.cache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
      });

      return result;
    } catch (err) {
      // Fallback to demo products
      console.warn("Falling back to demo products due to error:", err);
      const products = this.demoProducts.slice(
        (page - 1) * limit,
        page * limit
      );
      const data = { products, total: this.demoProducts.length };
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;
    }
  }

  async getProductById(id) {
    const cacheKey = `product:${id}`;

    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.data;
      }
    }

    try {
      const result = await this.makeRequest(`/products/${id}`);
      this.cache.set(cacheKey, { data: result, timestamp: Date.now() });
      return result;
    } catch (err) {
      console.warn("Falling back to demo product for id", id, err);
      const prod = this.demoProducts.find((p) => String(p.id) === String(id));
      if (prod) {
        // Return the product object directly (same shape as API client expects)
        this.cache.set(cacheKey, { data: prod, timestamp: Date.now() });
        return prod;
      }
      throw err;
    }
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

  /**
   * Extract primary material from material_composition JSON
   * @param {Object} materialComposition - JSONB object with material percentages
   * @returns {string} Formatted primary material (e.g., "95% Organic Cotton")
   */
  extractPrimaryMaterial(materialComposition) {
    if (!materialComposition || typeof materialComposition !== 'object') {
      return null;
    }

    // Convert keys to readable format and find highest percentage
    const materials = Object.entries(materialComposition)
      .map(([key, value]) => ({
        name: this.formatMaterialName(key),
        percentage: value
      }))
      .sort((a, b) => b.percentage - a.percentage);

    if (materials.length === 0) return null;

    const primary = materials[0];
    return `${primary.percentage}% ${primary.name}`;
  }

  /**
   * Format material key to readable name
   * @param {string} key - Material key (e.g., "organic_cotton", "tencel_lyocell")
   * @returns {string} Formatted name (e.g., "Organic Cotton", "TENCEL Lyocell")
   */
  formatMaterialName(key) {
    const specialCases = {
      'tencel_lyocell': 'TENCEL Lyocell',
      'tencel_modal': 'TENCEL Modal',
      'peace_silk': 'Peace Silk',
      'lyocell': 'Lyocell'
    };

    if (specialCases[key]) {
      return specialCases[key];
    }

    // Convert snake_case to Title Case
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Get certification badges for display (limit to top N)
   * @param {Array} certificationLabels - Array of certification strings
   * @param {number} limit - Maximum number of badges to return
   * @returns {Array} Array of certification objects with name and badge class
   */
  getCertificationBadges(certificationLabels, limit = 3) {
    if (!Array.isArray(certificationLabels) || certificationLabels.length === 0) {
      return [];
    }

    const badgeConfig = {
      'GOTS': { name: 'GOTS', class: 'success' },
      'OEKO-TEX': { name: 'OEKO-TEX', class: 'info' },
      'B-Corp': { name: 'B-Corp', class: 'primary' },
      'Fair Trade': { name: 'Fair Trade', class: 'warning' },
      'FSC': { name: 'FSC', class: 'success' },
      'GRS': { name: 'GRS', class: 'info' },
      'RWS': { name: 'RWS', class: 'primary' },
      'Peace Silk Certified': { name: 'Peace Silk', class: 'secondary' },
      'Hemp Certified': { name: 'Hemp', class: 'success' },
      'EU Ecolabel': { name: 'EU Ecolabel', class: 'info' },
      'Cradle to Cradle': { name: 'C2C', class: 'primary' },
      'SFA': { name: 'SFA', class: 'warning' }
    };

    return certificationLabels
      .slice(0, limit)
      .map(cert => badgeConfig[cert] || { name: cert, class: 'secondary' });
  }

  /**
   * Find variant by size and color selection
   * @param {Array} variants - Array of product variants
   * @param {string} size - Selected size
   * @param {string} color - Selected color
   * @returns {Object|null} Matching variant or null
   */
  getVariantBySelection(variants, size, color) {
    if (!variants || variants.length === 0) return null;

    return variants.find(v => {
      const sizeMatch = !size || v.size === size;
      const colorMatch = !color || v.color === color;
      return sizeMatch && colorMatch;
    }) || null;
  }

  /**
   * Get unique sizes from variants
   * @param {Array} variants - Array of product variants
   * @returns {Array} Array of unique sizes
   */
  getAvailableSizes(variants) {
    if (!variants || variants.length === 0) return [];

    const sizes = [...new Set(variants.map(v => v.size).filter(Boolean))];

    // Sort sizes logically (XS, S, M, L, XL or numeric)
    const sizeOrder = { 'XS': 1, 'S': 2, 'M': 3, 'L': 4, 'XL': 5, 'XXL': 6 };

    return sizes.sort((a, b) => {
      // If both are in size order, use that
      if (sizeOrder[a] && sizeOrder[b]) {
        return sizeOrder[a] - sizeOrder[b];
      }
      // If both are numeric, sort numerically
      if (!isNaN(a) && !isNaN(b)) {
        return parseInt(a) - parseInt(b);
      }
      // Otherwise alphabetically
      return a.localeCompare(b);
    });
  }

  /**
   * Get unique colors from variants
   * @param {Array} variants - Array of product variants
   * @returns {Array} Array of unique color objects {name, hex}
   */
  getAvailableColors(variants) {
    if (!variants || variants.length === 0) return [];

    const colorMap = new Map();
    variants.forEach(v => {
      if (v.color && !colorMap.has(v.color)) {
        colorMap.set(v.color, {
          name: v.color,
          hex: v.color_hex || '#999'
        });
      }
    });

    return Array.from(colorMap.values());
  }

  /**
   * Format weight for display
   * @param {number} weightValue - Weight value
   * @param {string} weightUnit - Weight unit (g, kg, lb, oz)
   * @returns {string} Formatted weight string
   */
  formatWeight(weightValue, weightUnit) {
    if (!weightValue || !weightUnit) return null;

    const value = parseFloat(weightValue);
    if (isNaN(value)) return null;

    // Convert to user-friendly format
    if (weightUnit === 'g' && value >= 1000) {
      return `${(value / 1000).toFixed(2)} kg`;
    }
    if (weightUnit === 'oz' && value >= 16) {
      return `${(value / 16).toFixed(2)} lb`;
    }

    return `${value} ${weightUnit}`;
  }
}
