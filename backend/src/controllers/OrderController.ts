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

  // API for Admin: Get all orders
  async getAllOrders(req: AuthRequest, res: ServerResponse) {
    // Only Admin can call this API (verified by middleware)
    try {
      const orders = await this.orderService.getAllOrders();
      sendJSON(res, 200, { success: true, orders, role: req.userRole });
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
        return sendError(res, 404, 'Order not found');
      }

      // Check if user owns this order (unless admin)
      if (req.userRole !== 'admin' && req.userRole !== 'staff') {
        if (order.user_id !== req.userId) {
          return sendError(res, 403, 'Access denied');
        }
      }

      sendJSON(res, 200, { success: true, order });
    } catch (error) {
      console.error('[OrderController.getOrderById] Error:', error);
      sendError(res, 500, 'Failed to fetch order');
    }
  }
}