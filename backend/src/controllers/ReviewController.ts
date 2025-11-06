import { IncomingMessage, ServerResponse } from 'http';
import { ReviewService } from '../services/ReviewService';
import { sendJSON, sendError, parseUrl, parseBody } from '../utils/request-handler';
import { MultipartParser } from '../utils/multipart-parser';
import { StorageService } from '../utils/storage';

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
      const userId = (req as any).user?.id; // Optional auth

      const result = await this.reviewService.getReviewsWithLikeStatus(
        {
          product_id: productId,
          rating
        },
        page,
        limit,
        userId
      );

      sendJSON(res, 200, result);
    } catch (error) {
      console.error('Error fetching product reviews:', error);
      sendError(res, 500, 'Không thể tải đánh giá');
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
      sendError(res, 500, 'Không thể tải đánh giá');
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
        sendError(res, 404, 'Không tìm thấy đánh giá');
        return;
      }
      sendJSON(res, 200, review);
    } catch (error) {
      console.error('Error fetching review:', error);
      sendError(res, 500, 'Không thể tải đánh giá');
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
        sendError(res, 401, 'Yêu cầu đăng nhập');
        return;
      }

      const body = await parseBody(req);
      const { product_id, rating, title, review, order_id, images } = body;

      // Validate required fields
      if (!product_id || !rating) {
        sendError(res, 400, 'ID sản phẩm và đánh giá là bắt buộc');
        return;
      }

      if (rating < 1 || rating > 5) {
        sendError(res, 400, 'Đánh giá phải từ 1 đến 5 sao');
        return;
      }

      // Validate images if provided
      if (images && !Array.isArray(images)) {
        sendError(res, 400, 'Hình ảnh phải là một mảng URL');
        return;
      }

      if (images && images.length > 5) {
        sendError(res, 400, 'Tối đa 5 hình ảnh cho mỗi đánh giá');
        return;
      }

      const newReview = await this.reviewService.createReview(
        userId,
        product_id,
        rating,
        title,
        review,
        order_id,
        images
      );

      sendJSON(res, 201, newReview);
    } catch (error) {
      console.error('Error creating review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tạo đánh giá';
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
        sendError(res, 401, 'Yêu cầu đăng nhập');
        return;
      }

      const body = await parseBody(req);
      const { rating, title, review } = body;

      // Validate rating if provided
      if (rating !== undefined && (rating < 1 || rating > 5)) {
        sendError(res, 400, 'Đánh giá phải từ 1 đến 5 sao');
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
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật đánh giá';
      const statusCode = errorMessage.includes('Unauthorized') || errorMessage.includes('Không có quyền') ? 403 :
                        errorMessage.includes('not found') || errorMessage.includes('không tìm thấy') ? 404 : 400;
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
        sendError(res, 401, 'Yêu cầu đăng nhập');
        return;
      }

      await this.reviewService.deleteReview(id, userId);
      sendJSON(res, 200, { success: true, message: 'Đã xóa đánh giá thành công' });
    } catch (error) {
      console.error('Error deleting review:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể xóa đánh giá';
      const statusCode = errorMessage.includes('Unauthorized') || errorMessage.includes('Không có quyền') ? 403 :
                        errorMessage.includes('not found') || errorMessage.includes('không tìm thấy') ? 404 : 400;
      sendError(res, statusCode, errorMessage);
    }
  }

  /**
   * POST /api/reviews/:id/helpful
   * Mark a review as helpful (deprecated - use toggleLike instead)
   */
  async markHelpful(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      await this.reviewService.incrementHelpfulCount(id);
      sendJSON(res, 200, { success: true, message: 'Đã đánh dấu hữu ích' });
    } catch (error) {
      console.error('Error marking review as helpful:', error);
      sendError(res, 500, 'Không thể đánh dấu hữu ích');
    }
  }

  /**
   * POST /api/reviews/:id/like
   * Toggle like on a review (heart functionality)
   */
  async toggleLike(req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Yêu cầu đăng nhập');
        return;
      }

      const result = await this.reviewService.toggleReviewLike(id, userId);
      sendJSON(res, 200, result);
    } catch (error) {
      console.error('Error toggling review like:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể cập nhật yêu thích';
      sendError(res, 500, errorMessage);
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
        sendError(res, 401, 'Yêu cầu đăng nhập');
        return;
      }

      const eligibility = await this.reviewService.canUserReviewProduct(userId, productId);
      sendJSON(res, 200, eligibility);
    } catch (error) {
      console.error('Error checking review eligibility:', error);
      sendError(res, 500, 'Không thể kiểm tra điều kiện đánh giá');
    }
  }

  /**
   * POST /api/reviews/upload-image
   * Upload a review image to Supabase Storage
   */
  async uploadReviewImage(req: IncomingMessage, res: ServerResponse) {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        sendError(res, 401, 'Yêu cầu đăng nhập');
        return;
      }

      // Check content type
      const contentType = req.headers['content-type'];
      if (!contentType || !contentType.includes('multipart/form-data')) {
        sendError(res, 400, 'Content-Type phải là multipart/form-data');
        return;
      }

      // Check content length (max 5MB)
      const contentLength = MultipartParser.getContentLength(req);
      const maxSize = 5 * 1024 * 1024; // 5MB

      if (contentLength > maxSize) {
        sendError(res, 413, 'Kích thước file vượt quá giới hạn 5MB');
        return;
      }

      // Parse multipart form data
      const formData = await MultipartParser.parse(req);

      if (formData.files.length === 0) {
        sendError(res, 400, 'Không có file nào được tải lên');
        return;
      }

      // Get the first file (single file upload)
      const file = formData.files[0];

      // Validate file
      try {
        StorageService.validateReviewImage(file.mimeType, file.data.length);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Invalid file';
        sendError(res, 400, errorMessage);
        return;
      }

      // Upload to Supabase Storage
      const publicUrl = await StorageService.uploadReviewImage(
        file.data,
        userId,
        file.filename,
        file.mimeType
      );

      sendJSON(res, 200, { url: publicUrl });
    } catch (error) {
      console.error('Error uploading review image:', error);
      const errorMessage = error instanceof Error ? error.message : 'Không thể tải lên hình ảnh';
      sendError(res, 500, errorMessage);
    }
  }
}
