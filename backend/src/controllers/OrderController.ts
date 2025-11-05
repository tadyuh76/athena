import { ServerResponse } from 'http';
import { OrderService } from '../services/OrderService';
import { AuthRequest } from '../middleware/auth';
import { sendJSON, sendError } from '../utils/request-handler';

export class OrderController {
  private orderService: OrderService;

  constructor() {
    this.orderService = new OrderService();
  }

  // API cho Customer: Tạo đơn hàng
  async createOrder(req: AuthRequest, res: ServerResponse) {
    try {
      // const body = await parseBody(req);
      const newOrder = await this.orderService.createOrder(req.userId!);
      sendJSON(res, 201, { success: true, order: newOrder, message: 'Mock order created.' });
    } catch (error) {
      sendError(res, 500, 'Failed to create order');
    }
  }

  // API cho Admin: Lấy tất cả đơn hàng
  async getAllOrders(req: AuthRequest, res: ServerResponse) {
    // Chỉ Admin mới gọi được API này (đã được kiểm tra bởi middleware)
    try {
      const orders = await this.orderService.getAllOrders();
      sendJSON(res, 200, { success: true, orders, role: req.userRole });
    } catch (error) {
      sendError(res, 500, 'Failed to fetch all orders');
    }
  }
}