"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const supabase_1 = require("../utils/supabase");
class ProductService {
    async getProducts(filter = {}, page = 1, limit = 20) {
        try {
            let query = supabase_1.supabase
                .from('products')
                .select(`
          *,
          variants:product_variants(*),
          images:product_images(*),
          category:product_categories(*),
          collection:product_collections(*)
        `, { count: 'exact' })
                .eq('status', filter.status || 'active');
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
            const start = (page - 1) * limit;
            const end = start + limit - 1;
            query = query.range(start, end);
            const { data, error, count } = await query;
            if (error) {
                throw error;
            }
            let products = data || [];
            if (filter.in_stock) {
                products = products.filter((product) => {
                    const totalStock = product.variants?.reduce((sum, v) => sum + (v.inventory_quantity - v.reserved_quantity), 0) || 0;
                    return totalStock > 0;
                });
            }
            return {
                products,
                total: count || 0,
                page,
                totalPages: Math.ceil((count || 0) / limit)
            };
        }
        catch (error) {
            throw new Error(`Failed to get products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getProductById(id) {
        try {
            const { data, error } = await supabase_1.supabase
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
                    return null;
                }
                throw error;
            }
            await supabase_1.supabase
                .from('products')
                .update({ view_count: data.view_count + 1 })
                .eq('id', id);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getProductBySlug(slug) {
        try {
            const { data, error } = await supabase_1.supabase
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
                    return null;
                }
                throw error;
            }
            await supabase_1.supabase
                .from('products')
                .update({ view_count: data.view_count + 1 })
                .eq('id', data.id);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createProduct(product) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('products')
                .insert(product)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateProduct(id, updates) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async deleteProduct(id) {
        try {
            const { error } = await supabase_1.supabaseAdmin
                .from('products')
                .update({ deleted_at: new Date().toISOString() })
                .eq('id', id);
            if (error) {
                throw error;
            }
            return true;
        }
        catch (error) {
            throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createVariant(variant) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('product_variants')
                .insert(variant)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateVariant(id, updates) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from('product_variants')
                .update(updates)
                .eq('id', id)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update variant: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getCategories() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('product_categories')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Failed to get categories: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getCollections() {
        try {
            const { data, error } = await supabase_1.supabase
                .from('product_collections')
                .select('*')
                .eq('is_active', true)
                .order('sort_order', { ascending: true });
            if (error) {
                throw error;
            }
            return data || [];
        }
        catch (error) {
            throw new Error(`Failed to get collections: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async checkInventory(variantId, quantity) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('product_variants')
                .select('inventory_quantity, reserved_quantity')
                .eq('id', variantId)
                .single();
            if (error) {
                throw error;
            }
            const available = data.inventory_quantity - data.reserved_quantity;
            return available >= quantity;
        }
        catch (error) {
            throw new Error(`Failed to check inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async reserveInventory(variantId, quantity, durationMinutes = 15) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .rpc('reserve_inventory', {
                p_variant_id: variantId,
                p_quantity: quantity,
                p_duration_minutes: durationMinutes
            });
            if (error) {
                throw error;
            }
            return new Date(data);
        }
        catch (error) {
            throw new Error(`Failed to reserve inventory: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=ProductService.js.map