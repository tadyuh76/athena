import { ServerResponse } from 'http';
import { sendJSON, sendError } from '../utils/request-handler';
import { AuthRequest } from '../middleware/auth';
import { getAdminDashboard } from '../router/admin/dashboard';

export class AdminController {
    async getDashboardSummary(_req: AuthRequest, res: ServerResponse) {
        try {
            const result = await getAdminDashboard(); // ✅ Gọi hàm thật từ Supabase

            // Trả về JSON đúng format cho frontend
            sendJSON(res, result.status, result.body);
        } catch (error) {
            console.error('Get Dashboard Summary Error:', error);
            sendError(res, 500, 'Failed to fetch dashboard summary');
        }
    }


}
