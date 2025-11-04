// src/services/AdminProductVariantService.ts
import { supabase } from "../utils/supabase";

export interface ProductVariantInput {
  id?: string;
  product_id: string;
  name: string;
  price: number;
  stock: number;
}

export class AdminProductVariantService {
  private table = "product_variants";

  // Lấy tất cả variant theo product
  async getByProduct(productId: string) {
    const { data, error } = await supabase
      .from(this.table)
      .select("*")
      .eq("product_id", productId);

    if (error) throw error;
    return data ?? [];
  }

  // Upsert variants
  async upsert(variants: ProductVariantInput[]) {
    const { data, error } = await supabase
      .from(this.table)
      .upsert(variants, { onConflict: "id" }); // chỉ truyền string
    if (error) throw error;
    return data ?? [];
  }

  // Xóa variant theo id
  async remove(id: string) {
    const { data, error } = await supabase
      .from(this.table)
      .delete()
      .eq("id", id);
    if (error) throw error;
    return data ?? [];
  }
}
