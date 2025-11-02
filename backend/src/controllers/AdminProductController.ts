import { IncomingMessage, ServerResponse } from 'http';
import { AdminProductService, ProductInput } from '../services/AdminProductService';
import { sendJSON, sendError, parseUrl } from '../utils/request-handler';

export class AdminProductController {
  private service = new AdminProductService();

  // Lấy toàn bộ sản phẩm
    async getAll(_req: IncomingMessage, res: ServerResponse) {
    try {
        const products = await this.service.getAll();

        // Map lại để frontend dùng trực tiếp
        const mapped = products.map(p => ({
        ...p,
        collection_name: p.collection?.name || "-",       // thêm tên collection
        final_price: p.base_price                    // hoặc tính sau khi áp dụng discount
        }));

        sendJSON(res, 200, { success: true, data: mapped });
    } catch (err: any) {
        sendJSON(res, 500, { success: false, error: err.message || "Failed to load products" });
    }
    }


  // Lấy chi tiết sản phẩm theo ID
  async getById(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
        const p = await this.service.getById(id);
        if (!p) return sendJSON(res, 404, { success: false, error: "Product not found" });

        // Map thêm fields
        const mapped = {
        ...p,
        variants: p.variants || [],
        images: p.images || [],
        collection_name: p.collection?.name || "-",
        final_price: p.base_price
        };

        sendJSON(res, 200, { success: true, data: mapped });
    } catch (err: any) {
        sendJSON(res, 500, { success: false, error: err.message || "Failed to load product" });
    }
}


  // Tạo sản phẩm mới
  async create(_req: IncomingMessage, res: ServerResponse, input: ProductInput) {
    try {
      const product = await this.service.create(input);
      sendJSON(res, 201, product);
    } catch (error: any) {
      sendError(res, 500, error.message || 'Failed to create product');
    }
  }

  // Cập nhật sản phẩm theo ID
    async update(req: IncomingMessage & { body: Partial<ProductInput> }, res: ServerResponse, id: string) {
    try {
        const product = await this.service.update(id, req.body);
        sendJSON(res, 200, product);
    } catch (error: any) {
        sendError(res, 500, error.message || 'Failed to update product');
    }
    }


  // Xóa sản phẩm theo ID
  async remove(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      await this.service.remove(id);
      sendJSON(res, 200, { message: 'Product deleted successfully' });
    } catch (error: any) {
      sendError(res, 500, error.message || 'Failed to delete product');
    }
  }
}
