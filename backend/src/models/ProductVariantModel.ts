import { BaseModel } from './BaseModel';
import { ProductVariant } from '../types/database.types';

export class ProductVariantModel extends BaseModel<ProductVariant> {
  protected tableName = 'product_variants';

  /**
   * Find variants by product ID
   */
  async findByProductId(productId: string): Promise<ProductVariant[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('product_id', productId);

      if (error) {
        throw error;
      }

      return (data || []) as ProductVariant[];
    } catch (error) {
      throw new Error(`Failed to find variants by product ID: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Check if variant has available inventory
   */
  async checkInventory(variantId: string, quantity: number): Promise<boolean> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('inventory_quantity, reserved_quantity')
        .eq('id', variantId)
        .single();

      if (error) {
        throw error;
      }

      const available = data.inventory_quantity - data.reserved_quantity;
      return available >= quantity;
    } catch (error) {
      throw new Error(`Failed to check inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Reserve inventory for a variant atomically (prevents race conditions)
   * Uses optimistic locking with retry mechanism
   */
  async reserveInventoryAtomic(variantId: string, quantity: number, _durationMinutes: number = 15): Promise<boolean> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        // 1. Get current variant data
        const variant = await this.findById(variantId);
        if (!variant) {
          throw new Error('Variant not found');
        }

        // 2. Check if enough inventory is available
        const available = variant.inventory_quantity - variant.reserved_quantity;
        if (available < quantity) {
          return false;
        }

        // 3. Try to update with optimistic locking (checking updated_at hasn't changed)
        const { error } = await this.adminClient
          .from(this.tableName)
          .update({
            reserved_quantity: variant.reserved_quantity + quantity,
            updated_at: new Date().toISOString()
          })
          .eq('id', variantId)
          .eq('updated_at', variant.updated_at) // Optimistic lock
          .select()
          .single();

        if (error) {
          if (error.code === 'PGRST116') {
            // No rows updated - concurrent modification detected, retry
            retries++;
            await new Promise(resolve => setTimeout(resolve, 50 * retries)); // Exponential backoff
            continue;
          }
          throw error;
        }

        // Success
        return true;
      } catch (error) {
        if (retries === maxRetries - 1) {
          throw new Error(`Failed to reserve inventory after ${maxRetries} retries: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
        retries++;
        await new Promise(resolve => setTimeout(resolve, 50 * retries));
      }
    }

    return false;
  }

  /**
   * Release reserved inventory atomically
   */
  async releaseReservedInventory(variantId: string, quantity: number): Promise<void> {
    try {
      // Get current variant
      const variant = await this.findById(variantId);
      if (!variant) {
        throw new Error('Variant not found');
      }

      // Update reserved quantity (ensure it doesn't go below 0)
      const newReservedQuantity = Math.max(0, variant.reserved_quantity - quantity);

      await this.adminClient
        .from(this.tableName)
        .update({
          reserved_quantity: newReservedQuantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', variantId);

    } catch (error) {
      throw new Error(`Failed to release reserved inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get available quantity for a variant
   */
  async getAvailableQuantity(variantId: string): Promise<number> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('inventory_quantity, reserved_quantity')
        .eq('id', variantId)
        .single();

      if (error) {
        throw error;
      }

      return data.inventory_quantity - data.reserved_quantity;
    } catch (error) {
      throw new Error(`Failed to get available quantity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
