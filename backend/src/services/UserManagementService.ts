import { UserProfileModel } from '../models/UserProfileModel';
import { User } from '../types/database.types';
import { supabase } from '../utils/supabase';

interface UserFilters {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

export class UserManagementService {
  private userProfileModel: UserProfileModel;

  constructor() {
    this.userProfileModel = new UserProfileModel();
  }

  /**
   * Get all users with pagination and filters
   */
  async getAllUsers(filters: UserFilters) {
    try {
      const { page, limit, search, role, status } = filters;
      const offset = (page - 1) * limit;

      // Build query
      let query = supabase
        .from('users')
        .select('*', { count: 'exact' });

      // Apply search filter (email, first_name, last_name)
      if (search) {
        query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`);
      }

      // Apply role filter
      if (role) {
        query = query.eq('role', role);
      }

      // Apply status filter
      if (status) {
        query = query.eq('status', status);
      }

      // Apply pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      return {
        users: data as User[],
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      console.error('Error getting all users:', error);
      throw new Error('Không thể lấy danh sách người dùng');
    }
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string): Promise<User | null> {
    try {
      return await this.userProfileModel.findById(userId);
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Không thể lấy thông tin người dùng');
    }
  }

  /**
   * Update user status
   */
  async updateUserStatus(userId: string, status: string): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error('Error updating user status:', error);
      throw new Error('Không thể cập nhật trạng thái người dùng');
    }
  }

  /**
   * Update user role
   */
  async updateUserRole(userId: string, role: string): Promise<User | null> {
    try {
      const { data, error} = await supabase
        .from('users')
        .update({ role, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error('Error updating user role:', error);
      throw new Error('Không thể cập nhật vai trò người dùng');
    }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId: string, updates: Partial<User>): Promise<User | null> {
    try {
      const { data, error } = await supabase
        .from('users')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as User;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw new Error('Không thể cập nhật thông tin người dùng');
    }
  }

  /**
   * Get user statistics
   */
  async getUserStats() {
    try {
      // Get total users count
      const { count: totalUsers } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });

      // Get users by role
      const { data: roleStats } = await supabase
        .from('users')
        .select('role')
        .then(({ data }) => {
          const stats = {
            customer: 0,
            admin: 0
          };
          data?.forEach((user: any) => {
            if (stats[user.role as keyof typeof stats] !== undefined) {
              stats[user.role as keyof typeof stats]++;
            }
          });
          return { data: stats };
        });

      // Get users by status
      const { data: statusStats } = await supabase
        .from('users')
        .select('status')
        .then(({ data }) => {
          const stats = {
            active: 0,
            suspended: 0,
            inactive: 0
          };
          data?.forEach((user: any) => {
            if (stats[user.status as keyof typeof stats] !== undefined) {
              stats[user.status as keyof typeof stats]++;
            }
          });
          return { data: stats };
        });

      // Get new users this month
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);

      const { count: newUsersThisMonth } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', startOfMonth.toISOString());

      return {
        totalUsers: totalUsers || 0,
        byRole: roleStats || { customer: 0, admin: 0 },
        byStatus: statusStats || { active: 0, suspended: 0, inactive: 0 },
        newUsersThisMonth: newUsersThisMonth || 0
      };
    } catch (error) {
      console.error('Error getting user stats:', error);
      throw new Error('Không thể lấy thống kê người dùng');
    }
  }
}
