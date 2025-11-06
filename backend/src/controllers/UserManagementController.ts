import { IncomingMessage, ServerResponse } from 'http';
import { UserManagementService } from '../services/UserManagementService';
import { requireAuth } from '../middleware/auth';
import { sendJSON, sendError } from '../utils/request-handler';

export class UserManagementController {
  private userManagementService: UserManagementService;

  constructor() {
    this.userManagementService = new UserManagementService();
  }

  /**
   * Get all users with pagination and filters (Admin only)
   */
  async getAllUsers(req: IncomingMessage, res: ServerResponse) {
    try {
      await requireAuth(req, res);

      const url = new URL(req.url!, `http://${req.headers.host}`);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const search = url.searchParams.get('search') || '';
      const role = url.searchParams.get('role') || '';
      const status = url.searchParams.get('status') || '';

      const result = await this.userManagementService.getAllUsers({
        page,
        limit,
        search,
        role,
        status
      });

      sendJSON(res, 200, { success: true, ...result });
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      sendError(res, 500, 'Không thể tải danh sách người dùng');
    }
  }

  /**
   * Get user by ID (Admin only)
   */
  async getUserById(req: IncomingMessage, res: ServerResponse, userId: string) {
    try {
      await requireAuth(req, res);

      const user = await this.userManagementService.getUserById(userId);

      if (!user) {
        sendError(res, 404, 'Không tìm thấy người dùng');
        return;
      }

      sendJSON(res, 200, { success: true, user });
    } catch (error) {
      console.error('Error in getUserById:', error);
      sendError(res, 500, 'Không thể tải thông tin người dùng');
    }
  }

  /**
   * Update user status (Admin only)
   */
  async updateUserStatus(req: IncomingMessage, res: ServerResponse, userId: string) {
    try {
      await requireAuth(req, res);

      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
      }

      const { status } = JSON.parse(body);

      if (!status || !['active', 'suspended', 'inactive'].includes(status)) {
        sendError(res, 400, 'Trạng thái không hợp lệ');
        return;
      }

      const user = await this.userManagementService.updateUserStatus(userId, status);

      if (!user) {
        sendError(res, 404, 'Không tìm thấy người dùng');
        return;
      }

      sendJSON(res, 200, { success: true, user, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
      console.error('Error in updateUserStatus:', error);
      sendError(res, 500, 'Không thể cập nhật trạng thái người dùng');
    }
  }

  /**
   * Update user role (Admin only)
   */
  async updateUserRole(req: IncomingMessage, res: ServerResponse, userId: string) {
    try {
      await requireAuth(req, res);

      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
      }

      const { role } = JSON.parse(body);

      if (!role || !['customer', 'admin'].includes(role)) {
        sendError(res, 400, 'Vai trò không hợp lệ');
        return;
      }

      const user = await this.userManagementService.updateUserRole(userId, role);

      if (!user) {
        sendError(res, 404, 'Không tìm thấy người dùng');
        return;
      }

      sendJSON(res, 200, { success: true, user, message: 'Cập nhật vai trò thành công' });
    } catch (error) {
      console.error('Error in updateUserRole:', error);
      sendError(res, 500, 'Không thể cập nhật vai trò người dùng');
    }
  }

  /**
   * Update user profile (Admin only)
   */
  async updateUserProfile(req: IncomingMessage, res: ServerResponse, userId: string) {
    try {
      await requireAuth(req, res);

      let body = '';
      for await (const chunk of req) {
        body += chunk.toString();
      }

      const updates = JSON.parse(body);

      // Only allow updating specific fields
      const allowedFields = ['first_name', 'last_name', 'phone', 'email_verified', 'phone_verified'];
      const filteredUpdates: any = {};

      for (const field of allowedFields) {
        if (updates[field] !== undefined) {
          filteredUpdates[field] = updates[field];
        }
      }

      if (Object.keys(filteredUpdates).length === 0) {
        sendError(res, 400, 'Không có trường nào để cập nhật');
        return;
      }

      const user = await this.userManagementService.updateUserProfile(userId, filteredUpdates);

      if (!user) {
        sendError(res, 404, 'Không tìm thấy người dùng');
        return;
      }

      sendJSON(res, 200, { success: true, user, message: 'Cập nhật thông tin thành công' });
    } catch (error) {
      console.error('Error in updateUserProfile:', error);
      sendError(res, 500, 'Không thể cập nhật thông tin người dùng');
    }
  }

  /**
   * Get user statistics (Admin only)
   */
  async getUserStats(req: IncomingMessage, res: ServerResponse) {
    try {
      await requireAuth(req, res);

      const stats = await this.userManagementService.getUserStats();

      sendJSON(res, 200, { success: true, ...stats });
    } catch (error) {
      console.error('Error in getUserStats:', error);
      sendError(res, 500, 'Không thể tải thống kê người dùng');
    }
  }
}
