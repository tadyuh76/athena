import { BaseModel } from './BaseModel';
import { ProductReview } from '../types/database.types';

export interface ReviewWithUser extends ProductReview {
  user?: {
    id: string;
    display_name?: string;
    avatar_url?: string;
  };
}

export interface ReviewStats {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    [key: number]: number;
  };
}

export class ReviewModel extends BaseModel<ProductReview> {
  protected tableName = 'product_reviews';

  /**
   * Find reviews by product ID with user details
   */
  async findByProductId(
    productId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{ reviews: ReviewWithUser[]; total: number }> {
    try {
      const start = (page - 1) * limit;
      const end = start + limit - 1;

      const { data, error, count } = await this.client
        .from(this.tableName)
        .select(`
          *,
          user:user_profiles(id, display_name, avatar_url)
        `, { count: 'exact' })
        .eq('product_id', productId)
        .eq('status', 'approved')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) {
        throw error;
      }

      return {
        reviews: (data || []) as ReviewWithUser[],
        total: count || 0
      };
    } catch (error) {
      throw new Error(`Failed to find reviews by product ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find reviews by user ID
   */
  async findByUserId(userId: string): Promise<ReviewWithUser[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          product:products(id, name, slug, images:product_images(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as ReviewWithUser[];
    } catch (error) {
      throw new Error(`Failed to find reviews by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find review by user and product
   */
  async findByUserAndProduct(
    userId: string,
    productId: string
  ): Promise<ProductReview | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as ProductReview;
    } catch (error) {
      throw new Error(`Failed to find review by user and product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get review statistics for a product
   */
  async getProductReviewStats(productId: string): Promise<ReviewStats> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('rating')
        .eq('product_id', productId)
        .eq('status', 'approved');

      if (error) {
        throw error;
      }

      const reviews = data || [];
      const total_reviews = reviews.length;

      if (total_reviews === 0) {
        return {
          average_rating: 0,
          total_reviews: 0,
          rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
        };
      }

      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      const average_rating = sum / total_reviews;

      const rating_distribution: { [key: number]: number } = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      reviews.forEach(r => {
        rating_distribution[r.rating] = (rating_distribution[r.rating] || 0) + 1;
      });

      return {
        average_rating: Math.round(average_rating * 10) / 10,
        total_reviews,
        rating_distribution
      };
    } catch (error) {
      throw new Error(`Failed to get review stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Increment helpful count for a review
   */
  async incrementHelpfulCount(reviewId: string): Promise<boolean> {
    try {
      const review = await this.findById(reviewId);
      if (!review) {
        throw new Error('Review not found');
      }

      await this.update(reviewId, {
        helpful_count: review.helpful_count + 1
      } as any);

      return true;
    } catch (error) {
      throw new Error(`Failed to increment helpful count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if user can review product (purchased and not reviewed yet)
   */
  async canUserReviewProduct(userId: string, productId: string): Promise<boolean> {
    try {
      // Check if user already reviewed
      const existingReview = await this.findByUserAndProduct(userId, productId);
      if (existingReview) {
        return false;
      }

      // Check if user purchased the product
      const { data, error } = await this.client
        .from('order_items')
        .select('id, order:orders!inner(user_id, status)')
        .eq('product_id', productId)
        .eq('order.user_id', userId)
        .eq('order.status', 'completed')
        .limit(1);

      if (error) {
        throw error;
      }

      return (data && data.length > 0);
    } catch (error) {
      throw new Error(`Failed to check review eligibility: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
