import { BaseModel } from './BaseModel';
import { ProductCategory } from '../types/database.types';

export class CategoryModel extends BaseModel<ProductCategory> {
  protected tableName = 'product_categories';

  /**
   * Get all active categories ordered by sort_order
   */
  async findAllActive(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return (data || []) as ProductCategory[];
    } catch (error) {
      throw new Error(`Failed to find active categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Find category by slug
   */
  async findBySlug(slug: string): Promise<ProductCategory | null> {
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

      return data as ProductCategory;
    } catch (error) {
      throw new Error(`Failed to find category by slug: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
