import { supabaseAdmin as supabase } from '../utils/supabase';

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
  private table = 'products';

  async create(input: ProductInput): Promise<any> {
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
    };

    const { data, error } = await supabase
      .from(this.table)
      .insert([sanitizedInput])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async update(id: string, input: Partial<ProductInput>): Promise<any> {
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
    };

    const { data: productData, error: productError } = await supabase
      .from(this.table)
      .update(sanitizedInput)
      .eq('id', id)
      .select()
      .single();

    if (productError) throw new Error(productError.message);

    return productData;
  }

  async getAll(): Promise<any[]> {
    const { data, error } = await supabase
      .from(this.table)
      .select(`*, category:product_categories(*), collection:product_collections(*), images:product_images(*)`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  async getById(id: string): Promise<any | null> {
    const { data, error } = await supabase
      .from(this.table)
      .select(`*, category:product_categories(*), collection:product_collections(*), images:product_images(*)`)
      .eq('id', id)
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  async remove(id: string): Promise<void> {
    const { error } = await supabase.from(this.table).delete().eq('id', id);
    if (error) throw new Error(error.message);
  }
}
