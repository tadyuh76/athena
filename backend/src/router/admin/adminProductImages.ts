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
      // Use environment variable for images path, with fallback
      const imagesPath = process.env.IMAGES_PATH || path.join(process.cwd(), "public", "images");

      // Kiểm tra thư mục tồn tại
      if (!fs.existsSync(imagesPath)) {
        console.warn(`Images directory not found at: ${imagesPath}`);
        return sendJSON(res, 200, []); // Return empty array instead of error
      }

      // Đọc tất cả file ảnh
      const files = fs.readdirSync(imagesPath);
      const urls = files
        .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
        .map((file) => `/images/${file}`);

      sendJSON(res, 200, urls);
    } catch (err: any) {
      console.error("Error reading images directory:", err);
      sendError(res, 500, "Failed to read images directory");
    }
  }, [Router.requireRole(['admin', 'staff'])]);

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
  }, [Router.requireRole(['admin', 'staff'])]);
}
