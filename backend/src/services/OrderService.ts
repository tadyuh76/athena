import { supabase, supabaseAdmin } from "../utils/supabase";
import { Order, OrderItem, CartItem, ProductVariant, UserAddress } from "../types/database.types";

export class OrderService {
    // Phương thức giả định để lấy tất cả đơn hàng (dùng cho Admin)
    async getAllOrders(): Promise<Order[]> {
        try {
            // Admin truy cập có thể bỏ qua RLS nên dùng supabaseAdmin
            const { data, error } = await supabaseAdmin
                .from('orders')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                throw error;
            }
            return data || [];
        } catch (error) {
            throw new Error(`Failed to get all orders: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    
    // Phương thức giả định để tạo đơn hàng (Chúng ta sẽ thêm logic chi tiết sau)
    async createOrder(userId: string): Promise<any> {
        // ... logic tạo đơn hàng ...
        return { 
            id: 'mock-order-id-123', 
            user_id: userId, 
            total_amount: 100, 
            order_number: 'ATH-MOCK-001' 
        };
    }

    // Phương thức mới: Lấy tổng số lượng đơn hàng (chỉ dành cho Admin)
    async getOrderCount(): Promise<number> {
        try {
            // Sử dụng supabaseAdmin để lấy count tổng (không bị RLS hạn chế)
            const { count, error } = await supabaseAdmin
                .from('orders')
                .select('*', { count: 'exact', head: true });

            if (error) {
                throw error;
            }
            return count || 0;
        } catch (error) {
            throw new Error(`Failed to get order count: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}