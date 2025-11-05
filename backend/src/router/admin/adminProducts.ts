import { Router } from "../../router/Router";
import { AdminProductController } from "../../controllers/AdminProductController";
import { ProductInput } from "../../services/AdminProductService";
import { parseBody } from "../../utils/request-handler";

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
}
