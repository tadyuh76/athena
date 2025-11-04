// src/controllers/AdminProductVariantController.ts
import { AdminProductVariantService, ProductVariantInput } from "../services/AdminProductVariantService";

const service = new AdminProductVariantService();

export class AdminProductVariantController {
  // Lấy variants theo product
  async getByProduct(req: any, res: any, productId: string) {
    try {
      const variants = await service.getByProduct(productId);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: variants }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Upsert nhiều variants
  async upsert(req: any, res: any, variants: ProductVariantInput[]) {
    try {
      const result = await service.upsert(variants);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: result }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  }

  // Xóa variant
  async remove(req: any, res: any, id: string) {
    try {
      const result = await service.remove(id);
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ data: result }));
    } catch (err: any) {
      res.writeHead(500, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ error: err.message }));
    }
  }
}
