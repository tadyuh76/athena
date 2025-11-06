export class ReviewService {
  constructor() {
    this.baseUrl = window.ENV ? window.ENV.getApiUrl() : '/api';
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

    const url = `${this.baseUrl}${endpoint}`;
    const response = await fetch(url, options);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Get reviews for a product
   */
  async getProductReviews(productId, page = 1, limit = 10, filters = {}) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    // Add filters
    Object.keys(filters).forEach(key => {
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        params.append(key, filters[key]);
      }
    });

    return await this.makeRequest(`/products/${productId}/reviews?${params.toString()}`);
  }

  /**
   * Get user's own reviews
   */
  async getUserReviews(page = 1, limit = 10) {
    const params = new URLSearchParams({
      page: page.toString(),
      limit: limit.toString(),
    });

    return await this.makeRequest(`/reviews/user?${params.toString()}`);
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(reviewId) {
    return await this.makeRequest(`/reviews/${reviewId}`);
  }

  /**
   * Create a new review
   */
  async createReview(productId, rating, title = '', review = '', orderId = null, images = []) {
    return await this.makeRequest('/reviews', 'POST', {
      product_id: productId,
      rating,
      title,
      review,
      order_id: orderId,
      images: images && images.length > 0 ? images : undefined,
    });
  }

  /**
   * Update an existing review
   */
  async updateReview(reviewId, updates) {
    return await this.makeRequest(`/reviews/${reviewId}`, 'PUT', updates);
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId) {
    return await this.makeRequest(`/reviews/${reviewId}`, 'DELETE');
  }

  /**
   * Mark a review as helpful (deprecated - use toggleLike instead)
   */
  async markHelpful(reviewId) {
    return await this.makeRequest(`/reviews/${reviewId}/helpful`, 'POST');
  }

  /**
   * Toggle like on a review (heart functionality)
   */
  async toggleLike(reviewId) {
    return await this.makeRequest(`/reviews/${reviewId}/like`, 'POST');
  }

  /**
   * Upload review image to Supabase Storage
   * Returns the public URL of the uploaded image
   */
  async uploadReviewImage(file) {
    try {
      // Create FormData and append the file
      const formData = new FormData();
      formData.append('image', file);

      // Get auth token
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('Authentication required to upload images');
      }

      // Upload to backend endpoint
      const url = `${this.baseUrl}/reviews/upload-image`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const data = await response.json();
      return data.url; // Return the public URL from Supabase Storage
    } catch (error) {
      console.error('Error uploading review image:', error);
      throw error;
    }
  }

  /**
   * Check if user can review a product
   */
  async checkReviewEligibility(productId) {
    return await this.makeRequest(`/products/${productId}/reviews/eligibility`);
  }

  /**
   * Format rating as stars
   */
  renderStars(rating, maxRating = 5) {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = maxRating - fullStars - (hasHalfStar ? 1 : 0);

    let html = '';
    for (let i = 0; i < fullStars; i++) {
      html += '<i class="bi bi-star-fill text-warning"></i>';
    }
    if (hasHalfStar) {
      html += '<i class="bi bi-star-half text-warning"></i>';
    }
    for (let i = 0; i < emptyStars; i++) {
      html += '<i class="bi bi-star text-warning"></i>';
    }

    return html;
  }

  /**
   * Format date for display
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now - date;
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) {
      return 'Today';
    } else if (diffInDays === 1) {
      return 'Yesterday';
    } else if (diffInDays < 7) {
      return `${diffInDays} days ago`;
    } else if (diffInDays < 30) {
      const weeks = Math.floor(diffInDays / 7);
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
    } else if (diffInDays < 365) {
      const months = Math.floor(diffInDays / 30);
      return `${months} ${months === 1 ? 'month' : 'months'} ago`;
    } else {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * Get initials from name
   */
  getInitials(firstName, lastName) {
    const first = firstName ? firstName.charAt(0).toUpperCase() : '';
    const last = lastName ? lastName.charAt(0).toUpperCase() : '';
    return first + last || '??';
  }
}
