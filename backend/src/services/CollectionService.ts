import { supabase } from "../utils/supabase";
import { slugify } from "../utils/slugify";

export class CollectionService {
  static async getAll() {
    const { data, error } = await supabase
      .from("product_collections")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw new Error(error.message);
    return data;
  }

  static async create(collection: { name: string; description?: string; image_url?: string }) {
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

  static async update(
    id: string,
    updates: Partial<{ name: string; description: string; image_url: string }>
  ) {
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
