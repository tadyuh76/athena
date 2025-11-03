import { Router } from "../../router/Router";
import { supabaseAdmin as supabase } from "../../utils/supabase";
import { sendJSON, sendError, parseBody } from "../../utils/request-handler";

export function registerAdminProductImagesRoutes(router: Router) {
  // POST: Thêm ảnh sản phẩm
  router.post("/api/admin/product-images", async (req: any, res: any) => {
    try {
      const body = await parseBody(req);
      const { product_id, url } = body;

      if (!product_id || !url) {
        return sendJSON(res, 400, { success: false, error: "product_id và url là bắt buộc" });
      }

      const { data, error } = await supabase
        .from("product_images")
        .insert([{ product_id, url }])
        .select()
        .single();

      if (error) throw error;

      sendJSON(res, 201, { success: true, data });
    } catch (err: any) {
      sendError(res, 500, err.message || "Failed to insert product image");
    }
  });
}
