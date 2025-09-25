import { supabase, supabaseAdmin } from '../utils/supabase';
import { Product, ProductVariant, ProductImage, ProductCategory, ProductCollection } from '../types/database.types';

export interface ProductFilter {
  category_id?: string;
  collection_id?: string;
  min_price?: number;
  max_price?: number;
  in_stock?: boolean;
  is_featured?: boolean;
  search?: string;
  status?: 'draft' | 'active' | 'archived';
}

export interface ProductWithVariants extends Product {
  variants?: ProductVariant[];
  images?: ProductImage[];
  category?: ProductCategory;
  collection?: ProductCollection;
}

export class ProductService {
  async getProducts(filter: ProductFilter = {}, page: number = 1, limit: number = 20): Promise<{
    products: ProductWithVariants[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    try {
      let query = supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*)
        `, { count: 'exact' })
        .eq('status', filter.status || 'active')
        .order('created_at', { ascending: false });

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

      // Filter by stock if needed
      let products = data || [];
      if (filter.in_stock) {
        products = products.filter((product: any) => {
          const totalStock = product.variants?.reduce((sum: number, v: ProductVariant) => 
            sum + (v.inventory_quantity - v.reserved_quantity), 0) || 0;
          return totalStock > 0;
        });
      }

      return {
        products,
        total: count || 0,
        page,
        totalPages: Math.ceil((count || 0) / limit)
      };
    } catch (error) {
      throw new Error(`Failed to get products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductById(id: string): Promise<ProductWithVariants | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        throw error;
      }

      // Increment view count
      await supabase
        .from('products')
        .update({ view_count: data.view_count + 1 })
        .eq('id', id);

      return data;
    } catch (error) {
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*)
        `)
        .eq('slug', slug)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Product not found
        }
        throw error;
      }

      // Increment view count
      await supabase
        .from('products')
        .update({ view_count: data.view_count + 1 })
        .eq('id', data.id);

      return data;
    } catch (error) {
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    try {
      const { data, error } = await supabaseAdmin
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProduct(id: string): Promise<boolean> {
    try {
      // Soft delete by setting deleted_at timestamp
      const { error } = await supabaseAdmin
        .from('products')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createVariant(variant: Partial<ProductVariant>): Promise<ProductVariant> {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .insert(variant)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to create variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      throw new Error(`Failed to update variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCategories(): Promise<ProductCategory[]> {
    try {
      const { data, error } = await supabase
        .from('product_categories')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCollections(): Promise<ProductCollection[]> {
    try {
      const { data, error } = await supabase
        .from('product_collections')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      throw new Error(`Failed to get collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async checkInventory(variantId: string, quantity: number): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('product_variants')
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

  async reserveInventory(variantId: string, quantity: number, durationMinutes: number = 15): Promise<Date> {
    try {
      const { data, error } = await supabaseAdmin
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
}