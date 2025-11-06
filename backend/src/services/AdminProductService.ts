import { ProductModel, ProductWithVariants } from '../models/ProductModel';
import { Product } from '../types/database.types';

export interface ProductInput {
  name: string;
  sku: string;
  slug?: string;
  description?: string;
  short_description?: string;
  category_id?: string;
  collection_id?: string;
  base_price: number;
  compare_price?: number;
  weight_value?: number;
  weight_unit?: string;
  material_composition?: Record<string, number>;
  care_instructions?: string;
  sustainability_notes?: string;
  production_method?: string;
  certification_labels?: string[];
  featured_image_url?: string;
  status?: 'active' | 'inactive';
  is_featured?: boolean;
  low_stock_threshold?: number;
}

export class AdminProductService {
  private productModel: ProductModel;

  constructor() {
    this.productModel = new ProductModel();
  }

  async create(input: ProductInput): Promise<Product> {
    const sanitizedInput = {
      name: input.name,
      sku: input.sku || '',
      slug: input.slug ?? null,
      description: input.description ?? null,
      short_description: input.short_description ?? null,
      category_id: input.category_id ?? null,
      collection_id: input.collection_id ?? null,
      base_price: input.base_price,
      compare_price: input.compare_price ?? null,
      weight_value: input.weight_value ?? null,
      weight_unit: input.weight_unit ?? null,
      material_composition:
        input.material_composition && Object.keys(input.material_composition).length > 0
          ? input.material_composition
          : null,
      care_instructions: input.care_instructions ?? null,
      sustainability_notes: input.sustainability_notes ?? null,
      production_method: input.production_method ?? null,
      certification_labels:
        input.certification_labels && input.certification_labels.length > 0
          ? input.certification_labels
          : null,
      featured_image_url: input.featured_image_url ?? null,
      status: input.status ?? 'active',
      is_featured: input.is_featured ?? false,
      low_stock_threshold: input.low_stock_threshold ?? null,
    } as Partial<Product>;

    const product = await this.productModel.create(sanitizedInput);
    return product;
  }

  async update(id: string, input: Partial<ProductInput>): Promise<Product> {
    console.log("🔍 [SERVICE] Update input featured_image_url:", input.featured_image_url);

    const sanitizedInput = {
      ...input,
      sku: input.sku ?? '',
      description: input.description ?? null,
      short_description: input.short_description ?? null,
      category_id: input.category_id ?? null,
      collection_id: input.collection_id ?? null,
      compare_price: input.compare_price ?? null,
      weight_value: input.weight_value ?? null,
      weight_unit: input.weight_unit ?? null,
      material_composition:
        input.material_composition && Object.keys(input.material_composition).length > 0
          ? input.material_composition
          : null,
      care_instructions: input.care_instructions ?? null,
      sustainability_notes: input.sustainability_notes ?? null,
      production_method: input.production_method ?? null,
      certification_labels:
        input.certification_labels && input.certification_labels.length > 0
          ? input.certification_labels
          : null,
      featured_image_url: input.featured_image_url ?? null,
      status: input.status ?? 'active',
      is_featured: input.is_featured ?? false,
      low_stock_threshold: input.low_stock_threshold ?? null,
    } as Partial<Product>;

    console.log("🔍 [SERVICE] Sanitized input featured_image_url:", sanitizedInput.featured_image_url);

    const product = await this.productModel.update(id, sanitizedInput);

    console.log("🔍 [SERVICE] Updated product from DB featured_image_url:", product.featured_image_url);

    return product;
  }

  async getAll(): Promise<ProductWithVariants[]> {
    // Use ProductModel's findWithFilters to get all products with relations
    const result = await this.productModel.findWithFilters(
      { status: undefined }, // Get all statuses for admin
      1,
      1000 // Large limit for admin view
    );
    return result.products;
  }

  async getById(id: string): Promise<ProductWithVariants | null> {
    const product = await this.productModel.findByIdWithRelations(id);
    return product;
  }

  async remove(id: string): Promise<void> {
    await this.productModel.delete(id, true); // Use admin client
  }
}
