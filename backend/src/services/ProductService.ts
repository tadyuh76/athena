import { ProductModel, ProductFilter, ProductWithVariants, PaginatedProducts } from '../models/ProductModel';
import { ProductVariantModel } from '../models/ProductVariantModel';
import { CategoryModel } from '../models/CategoryModel';
import { CollectionModel } from '../models/CollectionModel';
import { Product, ProductVariant, ProductCategory, ProductCollection } from '../types/database.types';

export { ProductFilter, ProductWithVariants };

export class ProductService {
  private productModel: ProductModel;
  private variantModel: ProductVariantModel;
  private categoryModel: CategoryModel;
  private collectionModel: CollectionModel;

  constructor() {
    this.productModel = new ProductModel();
    this.variantModel = new ProductVariantModel();
    this.categoryModel = new CategoryModel();
    this.collectionModel = new CollectionModel();
  }
  async getProducts(filter: ProductFilter = {}, page: number = 1, limit: number = 20): Promise<PaginatedProducts> {
    try {
      const result = await this.productModel.findWithFilters(filter, page, limit);

      // Filter by stock if needed
      if (filter.in_stock) {
        result.products = this.productModel.filterByStock(result.products);
      }

      return result;
    } catch (error) {
      console.error('Error in getProducts:', error);
      throw new Error(`Không thể lấy danh sách sản phẩm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  async getProductById(id: string): Promise<ProductWithVariants | null> {
    try {
      const product = await this.productModel.findByIdWithRelations(id);

      if (product) {
        // Increment view count
        await this.productModel.incrementViewCount(id);
      }

      return product;
    } catch (error) {
      throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductBySlug(slug: string): Promise<ProductWithVariants | null> {
    try {
      const product = await this.productModel.findBySlugWithRelations(slug);

      if (product) {
        // Increment view count
        await this.productModel.incrementViewCount(product.id);
      }

      return product;
    } catch (error) {
      throw new Error(`Không thể lấy thông tin sản phẩm: ${error instanceof Error ? error.message : 'Lỗi không xác định'}`);
    }
  }

  async createProduct(product: Partial<Product>): Promise<Product> {
    return this.productModel.create(product, true);
  }

  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    return this.productModel.update(id, updates, true);
  }

  async deleteProduct(id: string): Promise<boolean> {
    return this.productModel.softDelete(id, true);
  }

  async createVariant(variant: Partial<ProductVariant>): Promise<ProductVariant> {
    return this.variantModel.create(variant, true);
  }

  async updateVariant(id: string, updates: Partial<ProductVariant>): Promise<ProductVariant> {
    return this.variantModel.update(id, updates, true);
  }

  async getCategories(): Promise<ProductCategory[]> {
    return this.categoryModel.findAllActive();
  }

  async getCollections(): Promise<ProductCollection[]> {
    return this.collectionModel.findAllActive();
  }

  async checkInventory(variantId: string, quantity: number): Promise<boolean> {
    return this.variantModel.checkInventory(variantId, quantity);
  }

  async reserveInventory(variantId: string, quantity: number, durationMinutes: number = 15): Promise<boolean> {
    return this.variantModel.reserveInventoryAtomic(variantId, quantity, durationMinutes);
  }
}