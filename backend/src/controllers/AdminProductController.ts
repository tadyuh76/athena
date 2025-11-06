import { IncomingMessage, ServerResponse } from "http";
import { AdminProductService, ProductInput } from "../services/AdminProductService";
import { sendJSON } from "../utils/request-handler";

export class AdminProductController {
  private service = new AdminProductService();

  // =============================
  // GET ALL PRODUCTS
  // =============================
  async getAll(_req: IncomingMessage, res: ServerResponse) {
    try {
      const products = await this.service.getAll();
      const mapped = products.map((p) => ({
        ...p,
        collection_name: p.collection?.name || "-",
        final_price: p.base_price,
      }));

      sendJSON(res, 200, { success: true, data: mapped });
    } catch (err: any) {
      sendJSON(res, 500, { success: false, error: err.message || "Failed to load products" });
    }
  }

  // =============================
  // GET PRODUCT BY ID
  // =============================
  async getById(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      const p = await this.service.getById(id);
      if (!p) return sendJSON(res, 404, { success: false, error: "Product not found" });

      const mapped = {
        ...p,
        variants: p.variants || [],
        images: p.images || [],
        collection_name: p.collection?.name || "-",
        final_price: p.base_price,
      };

      sendJSON(res, 200, { success: true, data: mapped });
    } catch (err: any) {
      sendJSON(res, 500, { success: false, error: err.message || "Failed to load product" });
    }
  }

  // =============================
  // CREATE PRODUCT
  // =============================
  async create(_req: IncomingMessage, res: ServerResponse, input: ProductInput) {
    try {
      const product = await this.service.create(input);
      sendJSON(res, 201, { success: true, data: product });
    } catch (err: any) {
      console.error("❌ [create] Error:", err);
      if (err.message.includes("duplicate key")) {
        sendJSON(res, 409, {
          success: false,
          error: "SKU hoặc slug đã tồn tại. Vui lòng nhập giá trị khác.",
        });
      } else {
        sendJSON(res, 500, { success: false, error: err.message || "Failed to create product" });
      }
    }
  }

  // =============================
  // UPDATE PRODUCT
  // =============================
  async update(req: IncomingMessage & { body: Partial<ProductInput> }, res: ServerResponse, id: string) {
    try {
      console.log("🔍 [UPDATE] Product ID:", id);
      console.log("🔍 [UPDATE] Request body received:", JSON.stringify(req.body, null, 2));
      console.log("🔍 [UPDATE] featured_image_url in body:", req.body.featured_image_url);

      const product = await this.service.update(id, req.body);

      console.log("✅ [UPDATE] Product updated successfully");
      console.log("🔍 [UPDATE] Updated product featured_image_url:", product.featured_image_url);

      sendJSON(res, 200, { success: true, data: product });
    } catch (err: any) {
      console.error("❌ [update] Error:", err);
      if (err.message.includes("duplicate key")) {
        sendJSON(res, 409, {
          success: false,
          error: "SKU hoặc slug đã tồn tại. Vui lòng nhập giá trị khác.",
        });
      } else {
        sendJSON(res, 500, { success: false, error: err.message || "Failed to update product" });
      }
    }
  }

  // =============================
  // DELETE PRODUCT
  // =============================
  async remove(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      await this.service.remove(id);
      sendJSON(res, 200, { success: true, message: "Đã xoá sản phẩm thành công" });
    } catch (err: any) {
      console.error("❌ [remove] Error:", err);
      sendJSON(res, 500, { success: false, error: err.message || "Failed to delete product" });
    }
  }
}
