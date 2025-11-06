import { supabase } from "../utils/supabase";
import { slugify } from "../utils/slugify";

interface CollectionCreateInput {
  name: string;
  description?: string;
  theme_name?: string;
  hero_image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
  starts_at?: string;
  ends_at?: string;
}

interface CollectionUpdateInput {
  name?: string;
  description?: string;
  theme_name?: string;
  hero_image_url?: string;
  is_featured?: boolean;
  is_active?: boolean;
  sort_order?: number;
  starts_at?: string;
  ends_at?: string;
}

export class CollectionService {
  static async getAll() {
    const { data, error } = await supabase
      .from("product_collections")
      .select(`
        *,
        product_count:products(count)
      `)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);

    // Transform the product_count from nested array to number
    return data?.map((collection: any) => ({
      ...collection,
      product_count: collection.product_count?.[0]?.count || 0
    })) || [];
  }

  static async create(collection: CollectionCreateInput) {
    // ✅ Tự động tạo slug
    const slug = slugify(collection.name);

    const { data, error } = await supabase
      .from("product_collections")
      .insert([
        {
          ...collection,
          slug,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async update(id: string, updates: CollectionUpdateInput) {
    // ✅ Nếu có cập nhật tên, thì cập nhật luôn slug
    let finalUpdates: Record<string, any> = { ...updates };
    if (updates.name) {
      finalUpdates.slug = slugify(updates.name);
    }

    const { data, error } = await supabase
      .from("product_collections")
      .update(finalUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);
    return data;
  }

  static async delete(id: string) {
    const { error } = await supabase.from("product_collections").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { success: true };
  }
}
