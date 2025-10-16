import { supabase, supabaseAdmin } from '../utils/supabase';
import { ProductReview } from '../types/database.types';

export interface ReviewFilter {
  product_id?: string;
  user_id?: string;
  rating?: number;
  is_verified_purchase?: boolean;
}

export interface ReviewWithUser extends ProductReview {
  user?: {
    first_name: string;
    last_name: string;
    avatar_url?: string;
  };
}

export class ReviewService {
  /**
   * Get reviews for a product with pagination
   */
  async getReviews(
    filter: ReviewFilter = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: ReviewWithUser[];
    total: number;
    page: number;
    totalPages: number;
    stats: {
      averageRating: number;
      totalReviews: number;
      ratingDistribution: { [key: number]: number };
    };
  }> {
    try {
      let query = supabase
        .from('product_reviews')
        .select(`
          *,
          user:users!product_reviews_user_id_fkey(first_name, last_name, avatar_url)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      // Apply filters
      if (filter.product_id) {
        query = query.eq('product_id', filter.product_id);
      }
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id);
      }
      if (filter.rating !== undefined) {
        query = query.eq('rating', filter.rating);
      }
      if (filter.is_verified_purchase !== undefined) {
        query = query.eq('is_verified_purchase', filter.is_verified_purchase);
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate review statistics if product_id is provided
      let stats = {
        averageRating: 0,
        totalReviews: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
      };

      if (filter.product_id) {
        const { data: allReviews } = await supabase
          .from('product_reviews')
          .select('rating')
          .eq('product_id', filter.product_id);

        if (allReviews && allReviews.length > 0) {
          stats.totalReviews = allReviews.length;
          const totalRating = allReviews.reduce((sum, r) => sum + r.rating, 0);
          stats.averageRating = parseFloat((totalRating / allReviews.length).toFixed(1));

          // Calculate rating distribution
          allReviews.forEach(review => {
            const rating = review.rating as 1 | 2 | 3 | 4 | 5;
            stats.ratingDistribution[rating]++;
          });
        }
      }

      return {
        reviews: data || [],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit),
        stats
      };
    } catch (error) {
      console.error('Error in getReviews:', error);
      throw new Error(`Failed to get reviews: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single review by ID
   */
  async getReviewById(id: string): Promise<ReviewWithUser | null> {
    try {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(`
          *,
          user:users!product_reviews_user_id_fkey(first_name, last_name, avatar_url)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to get review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create a new review
   */
  async createReview(
    userId: string,
    productId: string,
    rating: number,
    title?: string,
    review?: string,
    orderId?: string
  ): Promise<ProductReview> {
    try {
      // Check if user has already reviewed this product for this order
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('order_id', orderId || null)
        .single();

      if (existingReview) {
        throw new Error('You have already reviewed this product');
      }

      // Check if this is a verified purchase
      let isVerifiedPurchase = false;
      if (orderId) {
        const { data: orderItem } = await supabase
          .from('order_items')
          .select('id')
          .eq('order_id', orderId)
          .eq('product_id', productId)
          .single();

        isVerifiedPurchase = !!orderItem;
      }

      // Create the review
      const { data, error } = await supabase
        .from('product_reviews')
        .insert({
          user_id: userId,
          product_id: productId,
          order_id: orderId || null,
          rating,
          title: title || null,
          review: review || null,
          is_verified_purchase: isVerifiedPurchase
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update product rating and review count
      await this.updateProductRatingStats(productId);

      return data;
    } catch (error) {
      throw new Error(`Failed to create review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update a review
   */
  async updateReview(
    reviewId: string,
    userId: string,
    updates: {
      rating?: number;
      title?: string;
      review?: string;
    }
  ): Promise<ProductReview> {
    try {
      // Verify the review belongs to the user
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('user_id, product_id')
        .eq('id', reviewId)
        .single();

      if (!existingReview) {
        throw new Error('Review not found');
      }

      if (existingReview.user_id !== userId) {
        throw new Error('Unauthorized to update this review');
      }

      // Update the review
      const { data, error } = await supabase
        .from('product_reviews')
        .update({
          rating: updates.rating,
          title: updates.title,
          review: updates.review
        })
        .eq('id', reviewId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update product rating stats
      await this.updateProductRatingStats(existingReview.product_id);

      return data;
    } catch (error) {
      throw new Error(`Failed to update review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete a review
   */
  async deleteReview(reviewId: string, userId: string): Promise<boolean> {
    try {
      // Verify the review belongs to the user
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('user_id, product_id')
        .eq('id', reviewId)
        .single();

      if (!existingReview) {
        throw new Error('Review not found');
      }

      if (existingReview.user_id !== userId) {
        throw new Error('Unauthorized to delete this review');
      }

      const { error } = await supabase
        .from('product_reviews')
        .delete()
        .eq('id', reviewId);

      if (error) {
        throw error;
      }

      // Update product rating stats
      await this.updateProductRatingStats(existingReview.product_id);

      return true;
    } catch (error) {
      throw new Error(`Failed to delete review: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Mark review as helpful
   */
  async incrementHelpfulCount(reviewId: string): Promise<boolean> {
    try {
      const { error } = await supabase.rpc('increment_review_helpful_count', {
        review_id: reviewId
      });

      if (error) {
        // If the RPC doesn't exist, do it manually
        const { data: review } = await supabase
          .from('product_reviews')
          .select('helpful_count')
          .eq('id', reviewId)
          .single();

        if (review) {
          await supabase
            .from('product_reviews')
            .update({ helpful_count: (review.helpful_count || 0) + 1 })
            .eq('id', reviewId);
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to increment helpful count:', error);
      return false;
    }
  }

  /**
   * Update product rating and review count statistics
   */
  private async updateProductRatingStats(productId: string): Promise<void> {
    try {
      const { data: reviews } = await supabase
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId);

      if (reviews && reviews.length > 0) {
        const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
        const averageRating = totalRating / reviews.length;

        await supabaseAdmin
          .from('products')
          .update({
            rating: parseFloat(averageRating.toFixed(1)),
            review_count: reviews.length
          })
          .eq('id', productId);
      } else {
        // No reviews, reset to null
        await supabaseAdmin
          .from('products')
          .update({
            rating: null,
            review_count: 0
          })
          .eq('id', productId);
      }
    } catch (error) {
      console.error('Failed to update product rating stats:', error);
      // Don't throw, as this is a background operation
    }
  }

  /**
   * Check if user can review a product (has purchased it)
   */
  async canUserReviewProduct(userId: string, productId: string): Promise<{
    canReview: boolean;
    reason?: string;
    orderId?: string;
  }> {
    try {
      // Check if user has already reviewed this product
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .maybeSingle();

      if (existingReview) {
        return { canReview: false, reason: 'You have already reviewed this product' };
      }

      // Check if user has purchased this product
      const { data: orderItems } = await supabase
        .from('order_items')
        .select('order_id, orders!inner(user_id, status)')
        .eq('product_id', productId)
        .eq('orders.user_id', userId)
        .in('orders.status', ['delivered', 'confirmed']);

      if (!orderItems || orderItems.length === 0) {
        return { canReview: false, reason: 'You must purchase this product before reviewing' };
      }

      // User can review, return the most recent order ID
      return { canReview: true, orderId: orderItems[0].order_id };
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      return { canReview: false, reason: 'Unable to verify purchase' };
    }
  }
}
