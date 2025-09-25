import { supabase } from '../utils/supabase';
import { Wishlist, Product, ProductVariant } from '../types/database.types';

export interface WishlistItem extends Wishlist {
  product?: Product;
  variant?: ProductVariant;
}

export class WishlistService {
  async getUserWishlist(userId: string): Promise<WishlistItem[]> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(*),
          variant:product_variants(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async addToWishlist(userId: string, productId: string, variantId?: string, notes?: string): Promise<Wishlist> {
    try {
      // Check if item already exists in wishlist
      const { data: existing } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId || null)
        .single();

      if (existing) {
        throw new Error('Item already in wishlist');
      }

      const { data, error } = await supabase
        .from('wishlists')
        .insert({
          user_id: userId,
          product_id: productId,
          variant_id: variantId,
          notes,
          priority: 0
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to add to wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async removeFromWishlist(userId: string, wishlistId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId)
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to remove from wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateWishlistItem(userId: string, wishlistId: string, updates: { priority?: number; notes?: string }): Promise<Wishlist> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .update(updates)
        .eq('id', wishlistId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to update wishlist item: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async isInWishlist(userId: string, productId: string, variantId?: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('wishlists')
        .select('id')
        .eq('user_id', userId)
        .eq('product_id', productId)
        .eq('variant_id', variantId || null)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      return !!data;
    } catch (error) {
      throw new Error(`Failed to check wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async clearWishlist(userId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('wishlists')
        .delete()
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to clear wishlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getWishlistCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('wishlists')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      throw new Error(`Failed to get wishlist count: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async moveToCart(userId: string, wishlistId: string, cartId: string): Promise<boolean> {
    try {
      // Get wishlist item details
      const { data: wishlistItem, error: wishlistError } = await supabase
        .from('wishlists')
        .select(`
          *,
          product:products(base_price),
          variant:product_variants(price)
        `)
        .eq('id', wishlistId)
        .eq('user_id', userId)
        .single();

      if (wishlistError) {
        throw wishlistError;
      }

      // Add to cart
      const price = wishlistItem.variant?.price || wishlistItem.product?.base_price || 0;
      const { error: cartError } = await supabase
        .from('cart_items')
        .insert({
          cart_id: cartId,
          product_id: wishlistItem.product_id,
          variant_id: wishlistItem.variant_id || wishlistItem.product_id,
          quantity: 1,
          price_at_time: price
        });

      if (cartError) {
        throw cartError;
      }

      // Remove from wishlist
      const { error: deleteError } = await supabase
        .from('wishlists')
        .delete()
        .eq('id', wishlistId)
        .eq('user_id', userId);

      if (deleteError) {
        throw deleteError;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to move to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}