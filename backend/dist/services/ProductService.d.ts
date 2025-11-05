import { ProductFilter, ProductWithVariants, PaginatedProducts } from '../models/ProductModel';
import { Product, ProductVariant, ProductCategory, ProductCollection } from '../types/database.types';
export { ProductFilter, ProductWithVariants };
export declare class ProductService {
    private productModel;
    private variantModel;
    private categoryModel;
    private collectionModel;
    constructor();
    getProducts(filter?: ProductFilter, page?: number, limit?: number): Promise<PaginatedProducts>;
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
    reserveInventory(variantId: string, quantity: number, durationMinutes?: number): Promise<boolean>;
}
//# sourceMappingURL=ProductService.d.ts.map