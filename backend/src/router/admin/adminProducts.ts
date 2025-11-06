import { Router } from "../../router/Router";
import { AdminProductController } from "../../controllers/AdminProductController";
import { ProductInput } from "../../services/AdminProductService";
import { parseBody, sendJSON } from "../../utils/request-handler";
import { MultipartParser } from "../../utils/multipart-parser";
import { StorageService } from "../../utils/storage";
import { IncomingMessage, ServerResponse } from "http";

const controller = new AdminProductController();

export function registerAdminProductRoutes(router: Router): void {
  // GET all products
  router.get("/api/admin/products", (req, res) => {
    return controller.getAll(req, res);
  }, [Router.requireRole(['admin', 'staff'])]);

  // GET product by ID
  router.get("/api/admin/products/:id", (req, res, params) => {
    return controller.getById(req, res, params.id);
  }, [Router.requireRole(['admin', 'staff'])]);

  // POST create product
  router.post("/api/admin/products", async (req: any, res: any) => {
    try {
      const inputRaw = await parseBody(req);
      const input = inputRaw as ProductInput; // ép kiểu ProductInput
      return controller.create(req, res, input);
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Failed to parse body" }));
    }
  }, [Router.requireRole(['admin', 'staff'])]);

  // PUT update product
  router.put("/api/admin/products/:id", async (req: any, res: any, params: any) => {
    try {
      const inputRaw = await parseBody(req);
      const input = inputRaw as Partial<ProductInput>; // ép kiểu Partial<ProductInput>
      return controller.update({ ...req, body: input }, res, params.id);
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message || "Failed to parse body" }));
    }
  }, [Router.requireRole(['admin', 'staff'])]);

  // DELETE product
  router.delete("/api/admin/products/:id", (req, res, params) => {
    return controller.remove(req, res, params.id);
  }, [Router.requireRole(['admin', 'staff'])]);

  // POST upload product image
  router.post("/api/admin/products/upload-image", async (req: IncomingMessage, res: ServerResponse) => {
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
      const imageUrl = await StorageService.uploadProductImage(
        file.data,
        file.filename,
        file.mimeType
      );

      sendJSON(res, 200, { success: true, url: imageUrl });
    } catch (err: any) {
      console.error('Error uploading product image:', err);
      sendJSON(res, 500, { success: false, error: err.message || 'Failed to upload image' });
    }
  }, [Router.requireRole(['admin', 'staff'])]);
}
