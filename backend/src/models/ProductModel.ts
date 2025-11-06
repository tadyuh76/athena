import { BaseModel } from './BaseModel';
import { Product, ProductVariant, ProductImage } from '../types/database.types';

export interface ProductWithVariants extends Product {
  variants?: ProductVariant[];
  images?: ProductImage[];
  category?: any;
  collection?: any;
  reviews?: Array<{ rating: number }>;
}

export interface ProductFilter {
  category_id?: string;
  collection_id?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
  search?: string;
  status?: 'draft' | 'active' | 'archived';
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'name' | 'popular';
}

export interface PaginatedProducts {
  products: ProductWithVariants[];
  total: number;
  page: number;
  totalPages: number;
}

export class ProductModel extends BaseModel<Product> {
  protected tableName = 'products';

  /**
   * Get paginated products with filters and relations
   */
  async findWithFilters(
    filter: ProductFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedProducts> {
    try {
      let query = this.client
        .from(this.tableName)
        .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*),
          reviews:product_reviews(rating)
        `, { count: 'exact' })
        .eq('status', filter.status || 'active');

      // Apply sorting
      switch (filter.sort_by) {
        case 'price_low':
          query = query.order('base_price', { ascending: true });
          break;
        case 'price_high':
          query = query.order('base_price', { ascending: false });
          break;
        case 'name':
          query = query.order('name', { ascending: true });
          break;
        case 'popular':
          query = query.order('view_count', { ascending: false });
          break;
        case 'newest':
        default:
          query = query.order('created_at', { ascending: false });
          break;
      }

      // Apply filters
      if (filter.category_id) {
        query = query.eq('category_id', filter.category_id);
      }
      if (filter.collection_id) {
        query = query.eq('collection_id', filter.collection_id);
      }
      if (filter.is_featured !== undefined) {
        query = query.eq('is_featured', filter.is_featured);
      }
      if (filter.min_price !== undefined) {
        query = query.gte('base_price', filter.min_price);
      }
      if (filter.max_price !== undefined) {
        query = query.lte('base_price', filter.max_price);
      }
      if (filter.search) {
        query = query.or(`name.ilike.%${filter.search}%,description.ilike.%${filter.search}%`);
      }

      // Apply pagination
      const start = (page - 1) * limit;
      const end = start + limit - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) {
        throw error;
      }

      // Calculate rating and review_count from reviews array
      const products = (data || []).map((product: any) => {
        const reviews = product.reviews || [];
        const review_count = reviews.length;
        const rating = review_count > 0
          ? parseFloat((reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / review_count).toFixed(1))
          : null;

        // Remove the reviews array and add calculated fields
        const { reviews: _, ...productWithoutReviews } = product;
        return {
          ...productWithoutReviews,
          rating,
          review_count
        };
      });

      return {
        products: products as ProductWithVariants[],
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      throw new Error(`Failed to find products with filters: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single product by ID with relations
   */
  async findByIdWithRelations(id: string): Promise<ProductWithVariants | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*),
          reviews:product_reviews(rating)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Calculate rating and review_count from reviews array
      const product: any = data;
      const reviews = product.reviews || [];
      const review_count = reviews.length;
      const rating = review_count > 0
        ? parseFloat((reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / review_count).toFixed(1))
        : null;

      // Remove the reviews array and add calculated fields
      const { reviews: _, ...productWithoutReviews } = product;
      return {
        ...productWithoutReviews,
        rating,
        review_count
      } as ProductWithVariants;
    } catch (error) {
      throw new Error(`Failed to find product by ID with relations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get a single product by slug with relations
   */
  async findBySlugWithRelations(slug: string): Promise<ProductWithVariants | null> {
    try {
      const { data, error } = await this.client
        .from(this.tableName)
        .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*),
          reviews:product_reviews(rating)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        throw error;
      }

      // Calculate rating and review_count from reviews array
      const product: any = data;
      const reviews = product.reviews || [];
      const review_count = reviews.length;
      const rating = review_count > 0
        ? parseFloat((reviews.reduce((sum: number, r: { rating: number }) => sum + r.rating, 0) / review_count).toFixed(1))
        : null;

      // Remove the reviews array and add calculated fields
      const { reviews: _, ...productWithoutReviews } = product;
      return {
        ...productWithoutReviews,
        rating,
        review_count
      } as ProductWithVariants;
    } catch (error) {
      throw new Error(`Failed to find product by slug with relations: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Increment view count for a product
   */
  async incrementViewCount(id: string): Promise<void> {
    try {
      const { error } = await this.client.rpc('increment_view_count', { product_id: id });

      if (error) {
        // If RPC doesn't exist, fall back to manual increment
        const product = await this.findById(id);
        if (product) {
          await this.update(id, { view_count: product.view_count + 1 } as any);
        }
      }
    } catch (error) {
      // Non-critical operation, log but don't throw
      console.error('Failed to increment view count:', error);
    }
  }

  /**
   * Filter products by available stock
   */
  filterByStock(products: ProductWithVariants[]): ProductWithVariants[] {
    return products.filter((product) => {
      const totalStock = product.variants?.reduce((sum, v) =>
        sum + (v.inventory_quantity - v.reserved_quantity), 0) || 0;
      return totalStock > 0;
    });
  }
}
