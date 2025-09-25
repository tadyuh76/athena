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
export declare class ProductService {
    getProducts(filter?: ProductFilter, page?: number, limit?: number): Promise<{
        products: ProductWithVariants[];
        total: number;
        page: number;
        totalPages: number;
    }>;
    getProductById(id: string): Promise<ProductWithVariants | null>;
    getProductBySlug(slug: string): Promise<ProductWithVariants | null>;
    createProduct(product: Partial<Product>): Promise<Product>;
    updateProduct(id: string, updates: Partial<Product>): Promise<Product>;
    deleteProduct(id: string): Promise<boolean>;
    createVariant(variant: Partial<ProductVariant>): Promise<ProductVariant>;
    updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant>;
    getCategories(): Promise<ProductCategory[]>;
    getCollections(): Promise<ProductCollection[]>;
    checkInventory(variantId: string, quantity: number): Promise<boolean>;
    reserveInventory(variantId: string, quantity: number, durationMinutes?: number): Promise<Date>;
}
//# sourceMappingURL=ProductService.d.ts.map