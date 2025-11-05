import { BaseModel } from './BaseModel';
import { Wishlist, Product } from '../types/database.types';

export interface WishlistItemWithProduct extends Wishlist {
  product?: Product;
}

export class WishlistModel extends BaseModel<Wishlist> {
  protected tableName = 'wishlist_items';

  /**
   * Find wishlist items by user ID with product details
   */
  async findByUserId(userId: string): Promise<WishlistItemWithProduct[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          product:products(*, images:product_images(*))
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return (data || []) as WishlistItemWithProduct[];
    } catch (error) {
      throw new Error(`Failed to find wishlist items by user ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find wishlist item by product ID and user ID
   */
  async findByProductAndUser(
    productId: string,
    userId: string
  ): Promise<Wishlist | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as Wishlist;
    } catch (error) {
      throw new Error(`Failed to find wishlist item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Count wishlist items for a user
   */
  async countByUserId(userId: string): Promise<number> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to count wishlist items: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if product is in user's wishlist
   */
  async isInWishlist(productId: string, userId: string): Promise<boolean> {
    try {
      const { count, error } = await this.client
        .from(this.tableName)
        .select('*', { count: 'exact', head: true })
        .eq('product_id', productId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return (count || 0) > 0;
    } catch (error) {
      throw new Error(`Failed to check wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Delete wishlist item by product and user
   */
  async deleteByProductAndUser(
    productId: string,
    userId: string
  ): Promise<boolean> {
    try {
      const { error } = await this.client
        .from(this.tableName)
        .delete()
        .eq('product_id', productId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete wishlist item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
