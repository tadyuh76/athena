// src/router/admin/adminProductVariant.ts
import { Router } from "../../router/Router";
import { AdminProductVariantController } from "../../controllers/AdminProductVariantController";
import { parseBody } from "../../utils/request-handler";

const controller = new AdminProductVariantController();

export function registerAdminProductVariantRoutes(router: Router) {
  // GET variants by product
  router.get("/api/admin/products/:id/variants", (req, res, params) => {
    return controller.getByProduct(req, res, params.id);
  });

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
  });

  // DELETE variant
  router.delete("/api/admin/products/:productId/variants/:id", (req, res, params) => {
    return controller.remove(req, res, params.id);
  });
}
