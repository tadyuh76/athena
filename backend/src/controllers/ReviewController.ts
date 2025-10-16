import { IncomingMessage, ServerResponse } from 'http';
import { ReviewService } from '../services/ReviewService';
import { sendJSON, sendError, parseUrl, parseBody } from '../utils/request-handler';

export class ReviewController {
  private reviewService: ReviewService;

  constructor() {
    this.reviewService = new ReviewService();
  }

  /**
   * GET /api/products/:productId/reviews
   * Get all reviews for a product
   */
  async getProductReviews(req: IncomingMessage, res: ServerResponse, productId: string) {
    try {
      const { query } = parseUrl(req);
      const page = parseInt(query.get('page') || '1');
      const limit = parseInt(query.get('limit') || '10');
      const rating = query.get('rating') ? parseInt(query.get('rating')!) : undefined;

      const result = await this.reviewService.getReviews(
        {
          product_id: productId,
          rating
        },
        page,
        limit
      );

      sendJSON(res, 200, result);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      sendError(res, 500, 'Failed to fetch reviews');
    }
  }

  /**
   * GET /api/reviews/user
   * Get all reviews by the authenticated user
   */
  async getUserReviews(req: IncomingMessage, res: ServerResponse) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      const { query } = parseUrl(req);
      const page = parseInt(query.get('page') || '1');
      const limit = parseInt(query.get('limit') || '10');

      const result = await this.reviewService.getReviews(
        { user_id: userId },
        page,
        limit
      );

      sendJSON(res, 200, result);
    } catch (error) {
      console.error('Error fetching user reviews:', error);
      sendError(res, 500, 'Failed to fetch reviews');
    }
  }

  /**
   * GET /api/reviews/:id
   * Get a single review by ID
   */
  async getReviewById(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      const review = await this.reviewService.getReviewById(id);
      if (!review) {
        sendError(res, 404, 'Review not found');
        return;
      }
      sendJSON(res, 200, review);
    } catch (error) {
      console.error('Error fetching review:', error);
      sendError(res, 500, 'Failed to fetch review');
    }
  }

  /**
   * POST /api/reviews
   * Create a new review
   */
  async createReview(req: IncomingMessage, res: ServerResponse) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      const body = await parseBody(req);
      const { product_id, rating, title, review, order_id } = body;

      // Validate required fields
      if (!product_id || !rating) {
        sendError(res, 400, 'Product ID and rating are required');
        return;
      }

      if (rating < 1 || rating > 5) {
        sendError(res, 400, 'Rating must be between 1 and 5');
        return;
      }

      const newReview = await this.reviewService.createReview(
        userId,
        product_id,
        rating,
        title,
        review,
        order_id
      );

      sendJSON(res, 201, newReview);
    } catch (error) {
      console.error('Error creating review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to create review';
      sendError(res, 400, errorMessage);
    }
  }

  /**
   * PUT /api/reviews/:id
   * Update a review
   */
  async updateReview(req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      const body = await parseBody(req);
      const { rating, title, review } = body;

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        sendError(res, 400, 'Rating must be between 1 and 5');
        return;
      }

      const updatedReview = await this.reviewService.updateReview(id, userId, {
        rating,
        title,
        review
      });

      sendJSON(res, 200, updatedReview);
    } catch (error) {
      console.error('Error updating review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update review';
      const statusCode = errorMessage.includes('Unauthorized') ? 403 :
                        errorMessage.includes('not found') ? 404 : 400;
      sendError(res, statusCode, errorMessage);
    }
  }

  /**
   * DELETE /api/reviews/:id
   * Delete a review
   */
  async deleteReview(req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      await this.reviewService.deleteReview(id, userId);
      sendJSON(res, 200, { success: true, message: 'Review deleted successfully' });
    } catch (error) {
      console.error('Error deleting review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete review';
      const statusCode = errorMessage.includes('Unauthorized') ? 403 :
                        errorMessage.includes('not found') ? 404 : 400;
      sendError(res, statusCode, errorMessage);
    }
  }

  /**
   * POST /api/reviews/:id/helpful
   * Mark a review as helpful
   */
  async markHelpful(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      await this.reviewService.incrementHelpfulCount(id);
      sendJSON(res, 200, { success: true, message: 'Review marked as helpful' });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      sendError(res, 500, 'Failed to mark review as helpful');
    }
  }

  /**
   * GET /api/products/:productId/reviews/eligibility
   * Check if user can review a product
   */
  async checkReviewEligibility(req: IncomingMessage, res: ServerResponse, productId: string) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Authentication required');
        return;
      }

      const eligibility = await this.reviewService.canUserReviewProduct(userId, productId);
      sendJSON(res, 200, eligibility);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      sendError(res, 500, 'Failed to check review eligibility');
    }
  }
}
