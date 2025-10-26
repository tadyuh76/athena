import { IncomingMessage, ServerResponse } from 'http';
import { ProductService } from '../services/ProductService';
import { sendJSON, sendError, parseUrl } from '../utils/request-handler';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async getProducts(req: IncomingMessage, res: ServerResponse) {
    try {
      const { query } = parseUrl(req);
      const page = parseInt(query.get('page') || '1');
      const limit = parseInt(query.get('limit') || '20');
      const filter = {
        category_id: query.get('category_id') || undefined,
        collection_id: query.get('collection_id') || undefined,
        min_price: query.get('min_price') ? parseFloat(query.get('min_price')!) : undefined,
        max_price: query.get('max_price') ? parseFloat(query.get('max_price')!) : undefined,
        in_stock: query.get('in_stock') === 'true',
        is_featured: query.get('featured') === 'true',
        search: query.get('search') || undefined,
        status: (query.get('status') || 'active') as any,
        sort_by: (query.get('sort_by') || 'newest') as any
      };

      const result = await this.productService.getProducts(filter, page, limit);
      sendJSON(res, 200, result);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch products');
    }
  }

  async getProductById(_req: IncomingMessage, res: ServerResponse, id: string) {
    try {
      const product = await this.productService.getProductById(id);
      if (!product) {
        sendError(res, 404, 'Product not found');
        return;
      }
      sendJSON(res, 200, product);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch product');
    }
  }

  async getProductBySlug(_req: IncomingMessage, res: ServerResponse, slug: string) {
    try {
      const product = await this.productService.getProductBySlug(slug);
      if (!product) {
        sendError(res, 404, 'Product not found');
        return;
      }
      sendJSON(res, 200, product);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch product');
    }
  }

  async getCategories(_req: IncomingMessage, res: ServerResponse) {
    try {
      const categories = await this.productService.getCategories();
      sendJSON(res, 200, categories);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch categories');
    }
  }

  async getCollections(_req: IncomingMessage, res: ServerResponse) {
    try {
      const collections = await this.productService.getCollections();
      sendJSON(res, 200, collections);
    } catch (error) {
      sendError(res, 500, 'Failed to fetch collections');
    }
  }
}
