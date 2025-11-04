import { supabaseAdmin } from "../utils/supabase";

export interface OrderFilterOptions {
  q?: string;
  status?: string;
  limit?: number;
  offset?: number;
}

export class AdminOrderService {
  private table = "orders";

  async list(opts: OrderFilterOptions = {}) {
    const { q, status, limit = 50, offset = 0 } = opts;

    let query = supabaseAdmin
      .from(this.table)
      .select(`id, order_number, customer_email, customer_phone, status, total_amount, created_at`)
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) query = query.eq("status", status);
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      query = query.or(
        `order_number.ilike.${term},customer_email.ilike.${term},customer_phone.ilike.${term}`
      );
    }

    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  async getById(orderId: string) {
    const { data, error } = await supabaseAdmin
      .from(this.table)
      .select(
        `*, 
         order_items(id, order_id, product_id, variant_id, product_name, product_sku, variant_title, product_image_url, quantity, unit_price, total_price, discount_amount, tax_amount, fulfilled_quantity, returned_quantity),
         order_addresses(*)`
      )
      .eq("id", orderId)
      .single();

    if (error && error.code !== "PGRST116") throw error;
    return data ?? null;
  }

  async update(orderId: string, payload: Partial<Record<string, any>>) {
    payload.updated_at = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from(this.table)
      .update(payload)
      .eq("id", orderId)
      .select()
      .single();

    if (error) throw error;
    return data ?? null;
  }

  async countsByStatus() {
    try {
      const { data, error } = await supabaseAdmin.rpc("get_order_status_counts");
      if (error) throw error;
      return data ?? [];
    } catch (err) {
      console.error("RPC get_order_status_counts failed:", err);
      return [];
    }
  }
}
