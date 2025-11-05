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
   * Reserve inventory for a variant
   */
  async reserveInventory(variantId: string, quantity: number, durationMinutes: number = 15): Promise<Date> {
    try {
      const { data, error } = await this.adminClient
        .rpc('reserve_inventory', {
          p_variant_id: variantId,
          p_quantity: quantity,
          p_duration_minutes: durationMinutes
        });

      if (error) {
        throw error;
      }

      return new Date(data);
    } catch (error) {
      throw new Error(`Failed to reserve inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
