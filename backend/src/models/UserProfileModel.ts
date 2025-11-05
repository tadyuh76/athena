import { BaseModel } from './BaseModel';
import { User } from '../types/database.types';

// Use User type from database.types
export type UserProfile = User;

export class UserProfileModel extends BaseModel<User> {
  protected tableName = 'users';

  /**
   * Find user profile by email
   */
  async findByEmail(email: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as User;
    } catch (error) {
      throw new Error(`Failed to find user by email: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find active user profile by ID
   */
  async findActiveById(id: string): Promise<User | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('id', id)
        .eq('status', 'active')
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as User;
    } catch (error) {
      throw new Error(`Failed to find active user by ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user's last login timestamp
   */
  async updateLastLogin(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({ last_login_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to update last login: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if email exists
   */
  async emailExists(email: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('email', email);

      if (error) {
        throw error;
      }

      return (count || 0) > 0;
    } catch (error) {
      throw new Error(`Failed to check email existence: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Update user profile fields
   */
  async updateProfile(
    id: string,
    updates: Partial<User>
  ): Promise<User> {
    try {
      // Remove protected fields that shouldn't be updated directly
      const { id: _, email: __, role: ___, status: ____, created_at: _____, ...safeUpdates } = updates as any;

      const { data, error } = await this.client
        .from(this.tableName)
        .update({
          ...safeUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data as User;
    } catch (error) {
      throw new Error(`Failed to update user profile: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Deactivate user account (soft delete)
   */
  async deactivate(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({ status: 'inactive' })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to deactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reactivate user account
   */
  async reactivate(id: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({ status: 'active' })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to reactivate user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
