import { BaseModel } from './BaseModel';
import { CartItem, Product, ProductVariant } from '../types/database.types';

export interface CartItemWithDetails extends CartItem {
  product?: Product;
  variant?: ProductVariant;
}

export class CartModel extends BaseModel<CartItem> {
  protected tableName = 'cart_items';

  /**
   * Find cart items by user ID with product and variant details
   */
  async findByUserId(userId: string): Promise<CartItemWithDetails[]> {
    try {
      console.log('[CartModel.findByUserId] Finding cart items for user:', userId);
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          product:products(*, images:product_images(*)),
          variant:product_variants(*)
        `)
        .eq('user_id', userId);

      if (error) {
        console.error('[CartModel.findByUserId] Database error:', error);
        throw error;
      }

      console.log('[CartModel.findByUserId] Found cart items:', data?.length || 0);
      return (data || []) as CartItemWithDetails[];
    } catch (error) {
      console.error('[CartModel.findByUserId] Fatal error:', error);
      throw new Error(`Failed to find cart items by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find cart items by session ID with product and variant details
   */
  async findBySessionId(sessionId: string): Promise<CartItemWithDetails[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          product:products(*, images:product_images(*)),
          variant:product_variants(*)
        `)
        .eq('session_id', sessionId);

      if (error) {
        throw error;
      }

      return (data || []) as CartItemWithDetails[];
    } catch (error) {
      throw new Error(`Failed to find cart items by session ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find existing cart item by variant and user/session
   */
  async findExistingItem(
    variantId: string,
    userId?: string,
    sessionId?: string
  ): Promise<CartItem | null> {
    try {
      let query = this.client
        .from(this.tableName)
        .select('*')
        .eq('variant_id', variantId);

      if (userId) {
        query = query.eq('user_id', userId);
      } else if (sessionId) {
        query = query.eq('session_id', sessionId);
      }

      const { data, error } = await query.single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as CartItem;
    } catch (error) {
      throw new Error(`Failed to find existing cart item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get cart item by ID with variant details
   */
  async findByIdWithVariant(id: string): Promise<CartItemWithDetails | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*, variant:product_variants(*)')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as CartItemWithDetails;
    } catch (error) {
      throw new Error(`Failed to find cart item by ID with variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all cart items for a user
   */
  async deleteByUserId(userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete cart items by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete all cart items for a session
   */
  async deleteBySessionId(sessionId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('session_id', sessionId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete cart items by session ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Transfer cart items from session to user (merge guest cart on login)
   */
  async transferToUser(sessionId: string, userId: string): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .update({ user_id: userId, session_id: null })
        .eq('session_id', sessionId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to transfer cart items to user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find expired cart items (for cleanup)
   */
  async findExpiredReservations(): Promise<CartItem[]> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .lt('inventory_reserved_until', now);

      if (error) {
        throw error;
      }

      return (data || []) as CartItem[];
    } catch (error) {
      throw new Error(`Failed to find expired reservations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete expired cart items
   */
  async deleteExpiredReservations(): Promise<number> {
    try {
      const now = new Date().toISOString();
      const { data, error } = await this.client
        .from(this.tableName)
        .delete()
        .lt('inventory_reserved_until', now)
        .select();

      if (error) {
        throw error;
      }

      return data?.length || 0;
    } catch (error) {
      throw new Error(`Failed to delete expired reservations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
