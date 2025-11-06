// src/router/admin/adminProductVariant.ts
import { Router } from "../../router/Router";
import { AdminProductVariantController } from "../../controllers/AdminProductVariantController";
import { parseBody, sendJSON } from "../../utils/request-handler";
import { MultipartParser } from "../../utils/multipart-parser";
import { StorageService } from "../../utils/storage";
import { IncomingMessage, ServerResponse } from "http";

const controller = new AdminProductVariantController();

export function registerAdminProductVariantRoutes(router: Router) {
  // GET variants by product
  router.get("/api/admin/products/:id/variants", (req, res, params) => {
    return controller.getByProduct(req, res, params.id);
  }, [Router.requireRole(['admin', 'staff'])]);

  // POST upsert variants
  router.post("/api/admin/products/:id/variants", async (req: any, res: any) => {
    try {
      const inputRaw = await parseBody(req);
      const variants = inputRaw as any[]; // mảng ProductVariantInput
      return controller.upsert(req, res, variants);
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Failed to parse body" }));
    }
  }, [Router.requireRole(['admin', 'staff'])]);

  // DELETE variant
  router.delete("/api/admin/products/:productId/variants/:id", (req, res, params) => {
    return controller.remove(req, res, params.id);
  }, [Router.requireRole(['admin', 'staff'])]);

  // POST upload variant image
  router.post("/api/admin/products/variants/upload-image", async (req: IncomingMessage, res: ServerResponse) => {
    try {
      // Parse multipart form data
      const { files } = await MultipartParser.parse(req);

      if (!files || files.length === 0) {
        return sendJSON(res, 400, { success: false, error: 'No image file provided' });
      }

      const file = files[0];

      // Validate image
      StorageService.validateProductImage(file.mimeType, file.data.length);

      // Upload to storage
      const imageUrl = await StorageService.uploadVariantImage(
        file.data,
        file.filename,
        file.mimeType
      );

      sendJSON(res, 200, { success: true, url: imageUrl });
    } catch (err: any) {
      console.error('Error uploading variant image:', err);
      sendJSON(res, 500, { success: false, error: err.message || 'Failed to upload image' });
    }
  }, [Router.requireRole(['admin', 'staff'])]);
}
