import { ServerResponse } from 'http';
import { OrderService, CreateOrderRequest } from '../services/OrderService';
import { AuthRequest } from '../middleware/auth';
import { sendJSON, sendError, parseBody } from '../utils/request-handler';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // API for Customer: Create order
  async createOrder(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);

      // Validate request body
      if (!body.shippingInfo) {
        return sendError(res, 400, 'Shipping information is required');
      }

      if (!body.paymentMethod) {
        return sendError(res, 400, 'Payment method is required');
      }

      // Prepare request
      const request: CreateOrderRequest = {
        userId: req.userId,
        shippingInfo: body.shippingInfo,
        paymentMethod: body.paymentMethod,
      };

      // Create order
      const result = await this.orderService.createOrder(request);

      sendJSON(res, 201, {
        success: true,
        order: result.order,
        clientSecret: result.clientSecret, // For Stripe frontend
        message: result.message,
      });
    } catch (error) {
      console.error('[OrderController.createOrder] Error:', error);
      sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Failed to create order'
      );
    }
  }

  // API for Customer: Create Stripe Checkout Session
  async createCheckoutSession(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);

      // Validate request body
      if (!body.shippingInfo) {
        return sendError(res, 400, 'Shipping information is required');
      }

      // Prepare request
      const request: CreateOrderRequest = {
        userId: req.userId,
        shippingInfo: body.shippingInfo,
        paymentMethod: 'stripe',
        discountCode: body.discountCode, // Include discount code if provided
      };

      // Get base URL from referer or default to frontend URL
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const referer = req.headers['referer'] || req.headers['origin'];

      // Extract base URL from referer if available, otherwise use localhost:3000
      let baseUrl;
      if (referer) {
        const url = new URL(referer);
        baseUrl = `${url.protocol}//${url.host}`;
      } else {
        baseUrl = `${protocol}://localhost:3000`;
      }

      // Create checkout session
      const result = await this.orderService.createStripeCheckoutSession(request, baseUrl);

      sendJSON(res, 201, {
        success: true,
        order: result.order,
        checkoutUrl: result.checkoutUrl,
        message: result.message,
      });
    } catch (error) {
      console.error('[OrderController.createCheckoutSession] Error:', error);
      sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Failed to create checkout session'
      );
    }
  }

  // API for Customer: Create Buy Now Checkout Session (direct purchase without cart)
  async createBuyNowCheckoutSession(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);

      // Validate request body
      if (!body.productId) {
        return sendError(res, 400, 'Product ID is required');
      }

      if (!body.variantId) {
        return sendError(res, 400, 'Variant ID is required');
      }

      if (!body.quantity || body.quantity < 1) {
        return sendError(res, 400, 'Valid quantity is required');
      }

      if (!body.shippingInfo) {
        return sendError(res, 400, 'Shipping information is required');
      }

      // Get base URL from referer or default to frontend URL
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const referer = req.headers['referer'] || req.headers['origin'];

      // Extract base URL from referer if available, otherwise use localhost:3000
      let baseUrl;
      if (referer) {
        const url = new URL(referer);
        baseUrl = `${url.protocol}//${url.host}`;
      } else {
        baseUrl = `${protocol}://localhost:3000`;
      }

      // Create buy now checkout session
      const result = await this.orderService.createBuyNowCheckoutSession(
        req.userId,
        body.productId,
        body.variantId,
        body.quantity,
        body.shippingInfo,
        baseUrl
      );

      sendJSON(res, 201, {
        success: true,
        order: result.order,
        checkoutUrl: result.checkoutUrl,
        message: result.message,
      });
    } catch (error) {
      console.error('[OrderController.createBuyNowCheckoutSession] Error:', error);
      sendError(
        res,
        500,
        error instanceof Error ? error.message : 'Failed to create buy now checkout session'
      );
    }
  }

  // API for Admin: Get all orders
  async getAllOrders(req: AuthRequest, res: ServerResponse) {
    // Only Admin can call this API (verified by middleware)
    try {
      // Parse query parameters from URL
      const url = new URL(req.url || '', `http://${req.headers.host}`);
      const searchParams = url.searchParams;

      const filters = {
        search: searchParams.get('search') || undefined,
        status: searchParams.get('status') || undefined,
        dateFrom: searchParams.get('dateFrom') || undefined,
        dateTo: searchParams.get('dateTo') || undefined,
        sortBy: searchParams.get('sortBy') || undefined,
        sortOrder: (searchParams.get('sortOrder') as 'asc' | 'desc') || undefined,
        page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : undefined,
        limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      };

      const result = await this.orderService.getAllOrders(filters);
      sendJSON(res, 200, { success: true, ...result, role: req.userRole });
    } catch (error) {
      console.error('[OrderController.getAllOrders] Error:', error);
      sendError(res, 500, 'Failed to fetch all orders');
    }
  }

  // API for Customer: Get my orders
  async getMyOrders(req: AuthRequest, res: ServerResponse) {
    try {
      if (!req.userId) {
        return sendError(res, 401, 'Authentication required');
      }

      const orders = await this.orderService.getUserOrders(req.userId);
      sendJSON(res, 200, { success: true, orders });
    } catch (error) {
      console.error('[OrderController.getMyOrders] Error:', error);
      sendError(res, 500, 'Failed to fetch orders');
    }
  }

  // API for Customer/Admin: Get order by ID
  async getOrderById(req: AuthRequest, res: ServerResponse, orderId: string) {
    try {
      const order = await this.orderService.getOrderById(orderId);

      if (!order) {
        return sendError(res, 404, 'Đơn hàng không tồn tại');
      }

      // Check if user owns this order (unless admin)
      if (req.userRole !== 'admin' && req.userRole !== 'staff') {
        if (order.user_id !== req.userId) {
          return sendError(res, 403, 'Không có quyền truy cập');
        }
      }

      sendJSON(res, 200, { success: true, order });
    } catch (error) {
      console.error('[OrderController.getOrderById] Error:', error);
      sendError(res, 500, 'Không thể tải đơn hàng');
    }
  }

  // API for Admin: Confirm order
  async confirmOrder(_req: AuthRequest, res: ServerResponse, orderId: string) {
    try {
      const order = await this.orderService.confirmOrder(orderId);
      sendJSON(res, 200, {
        success: true,
        order,
        message: 'Đã xác nhận đơn hàng thành công',
      });
    } catch (error) {
      console.error('[OrderController.confirmOrder] Error:', error);
      sendError(
        res,
        400,
        error instanceof Error ? error.message : 'Không thể xác nhận đơn hàng'
      );
    }
  }

  // API for Admin: Mark as shipped
  async markAsShipped(req: AuthRequest, res: ServerResponse, orderId: string) {
    try {
      const body = await parseBody(req);
      const order = await this.orderService.markAsShipped(orderId, body.trackingNumber);
      sendJSON(res, 200, {
        success: true,
        order,
        message: 'Đã đánh dấu đơn hàng đang giao',
      });
    } catch (error) {
      console.error('[OrderController.markAsShipped] Error:', error);
      sendError(
        res,
        400,
        error instanceof Error ? error.message : 'Không thể cập nhật trạng thái'
      );
    }
  }

  // API for Admin: Mark as delivered
  async markAsDelivered(_req: AuthRequest, res: ServerResponse, orderId: string) {
    try {
      const order = await this.orderService.markAsDelivered(orderId);
      sendJSON(res, 200, {
        success: true,
        order,
        message: 'Đã đánh dấu đơn hàng đã giao',
      });
    } catch (error) {
      console.error('[OrderController.markAsDelivered] Error:', error);
      sendError(
        res,
        400,
        error instanceof Error ? error.message : 'Không thể cập nhật trạng thái'
      );
    }
  }

  // API for Admin: Cancel order
  async cancelOrder(req: AuthRequest, res: ServerResponse, orderId: string) {
    try {
      const body = await parseBody(req);
      const order = await this.orderService.cancelOrder(orderId, body.reason);
      sendJSON(res, 200, {
        success: true,
        order,
        message: 'Đã hủy đơn hàng thành công',
      });
    } catch (error) {
      console.error('[OrderController.cancelOrder] Error:', error);
      sendError(
        res,
        400,
        error instanceof Error ? error.message : 'Không thể hủy đơn hàng'
      );
    }
  }
}