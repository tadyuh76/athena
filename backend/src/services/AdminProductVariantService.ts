// src/services/AdminProductVariantService.ts
import { ProductVariantModel } from "../models/ProductVariantModel";
import { ProductVariant } from "../types/database.types";
import { supabaseAdmin } from "../utils/supabase";

export interface ProductVariantInput {
  id?: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
}

export class AdminProductVariantService {
  private variantModel: ProductVariantModel;

  constructor() {
    this.variantModel = new ProductVariantModel();
  }

  // Get all variants by product
  async getByProduct(productId: string): Promise<ProductVariant[]> {
    const variants = await this.variantModel.findByProductId(productId);
    return variants;
  }

  // Upsert variants - uses admin client for bulk operations
  async upsert(variants: ProductVariantInput[]): Promise<ProductVariant[]> {
    // For bulk upsert, we still need to use direct Supabase call
    // as BaseModel doesn't have a bulk upsert method yet
    const { data, error } = await supabaseAdmin
      .from("product_variants")
      .upsert(variants, { onConflict: "id" })
      .select();

    if (error) throw error;
    return (data ?? []) as ProductVariant[];
  }

  // Delete variant by id
  async remove(id: string): Promise<void> {
    await this.variantModel.delete(id, true); // Use admin client
  }
}
