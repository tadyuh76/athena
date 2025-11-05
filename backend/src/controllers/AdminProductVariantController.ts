// src/controllers/AdminProductVariantController.ts
import { AdminProductVariantService, ProductVariantInput } from "../services/AdminProductVariantService";
import { sendJSON, sendError } from "../utils/request-handler";
import { IncomingMessage, ServerResponse } from "http";

const service = new AdminProductVariantService();

export class AdminProductVariantController {
  // Get variants by product
  async getByProduct(_req: IncomingMessage, res: ServerResponse, productId: string) {
    try {
      const variants = await service.getByProduct(productId);
      sendJSON(res, 200, { success: true, data: variants });
    } catch (err: any) {
      console.error('[AdminProductVariantController.getByProduct] Error:', err);
      sendError(res, 500, err.message || 'Failed to get product variants');
    }
  }

  // Upsert multiple variants
  async upsert(_req: IncomingMessage, res: ServerResponse, variants: ProductVariantInput[]) {
    try {
      const result = await service.upsert(variants);
      sendJSON(res, 200, { success: true, data: result });
    } catch (err: any) {
      console.error('[AdminProductVariantController.upsert] Error:', err);
      sendError(res, 500, err.message || 'Failed to upsert variants');
    }
  }

  // Delete variant
  async remove(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      await service.remove(id);
      sendJSON(res, 200, { success: true, message: 'Variant deleted successfully' });
    } catch (err: any) {
      console.error('[AdminProductVariantController.remove] Error:', err);
      sendError(res, 500, err.message || 'Failed to delete variant');
    }
  }
}
