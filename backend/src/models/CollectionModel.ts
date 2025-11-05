import { BaseModel } from './BaseModel';
import { ProductCollection } from '../types/database.types';

export class CollectionModel extends BaseModel<ProductCollection> {
  protected tableName = 'product_collections';

  /**
   * Get all active collections ordered by sort_order
   */
  async findAllActive(): Promise<ProductCollection[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as ProductCollection[];
    } catch (error) {
      throw new Error(`Failed to find active collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find collection by slug
   */
  async findBySlug(slug: string): Promise<ProductCollection | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      return data as ProductCollection;
    } catch (error) {
      throw new Error(`Failed to find collection by slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
