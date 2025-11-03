import fs from "fs";
import path from "path";
import { Router } from "../../router/Router";
import { sendJSON, sendError, parseBody } from "../../utils/request-handler";
import { supabaseAdmin as supabase } from "../../utils/supabase";

export function registerAdminProductImagesRoutes(router: Router) {
  // ======================
  // 🟢 GET: Lấy danh sách ảnh trong /public/images
  // ======================
  router.get("/api/admin/product-images", async (_req, res) => {
    try {
      const dirPath = path.join(process.cwd(), "..", "public", "images");
      console.log("Đường dẫn đang dùng:", dirPath);
      // Kiểm tra thư mục tồn tại
      if (!fs.existsSync(dirPath)) {
        return sendError(res, 404, "Thư mục public/images không tồn tại");
      }

      // Đọc tất cả file ảnh
      const files = fs.readdirSync(dirPath);
      const urls = files
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map((file) => `/images/${file}`);

      sendJSON(res, 200, urls);
    } catch (err: any) {
      console.error("❌ Lỗi đọc thư mục ảnh:", err);
      sendError(res, 500, "Không thể đọc danh sách ảnh từ thư mục public/images");
    }
  });

  // ======================
  // 🟢 POST: Thêm ảnh vào bảng product_images (nếu bạn vẫn cần)
  // ======================
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
