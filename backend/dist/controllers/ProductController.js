"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductController = void 0;
const ProductService_1 = require("../services/ProductService");
const request_handler_1 = require("../utils/request-handler");
class ProductController {
    productService;
    constructor() {
        this.productService = new ProductService_1.ProductService();
    }
    async getProducts(req, res) {
        try {
            const { query } = (0, request_handler_1.parseUrl)(req);
            const page = parseInt(query.get('page') || '1');
            const limit = parseInt(query.get('limit') || '20');
            const filter = {
                category_id: query.get('category_id') || undefined,
                collection_id: query.get('collection_id') || undefined,
                min_price: query.get('min_price') ? parseFloat(query.get('min_price')) : undefined,
                max_price: query.get('max_price') ? parseFloat(query.get('max_price')) : undefined,
                in_stock: query.get('in_stock') === 'true',
                is_featured: query.get('featured') === 'true',
                search: query.get('search') || undefined,
                status: (query.get('status') || 'active'),
                sort_by: (query.get('sort_by') || 'newest')
            };
            const result = await this.productService.getProducts(filter, page, limit);
            (0, request_handler_1.sendJSON)(res, 200, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải danh sách sản phẩm');
        }
    }
    async getProductById(_req, res, id) {
        try {
            const product = await this.productService.getProductById(id);
            if (!product) {
                (0, request_handler_1.sendError)(res, 404, 'Không tìm thấy sản phẩm');
                return;
            }
            (0, request_handler_1.sendJSON)(res, 200, product);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải thông tin sản phẩm');
        }
    }
    async getProductBySlug(_req, res, slug) {
        try {
            const product = await this.productService.getProductBySlug(slug);
            if (!product) {
                (0, request_handler_1.sendError)(res, 404, 'Không tìm thấy sản phẩm');
                return;
            }
            (0, request_handler_1.sendJSON)(res, 200, product);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải thông tin sản phẩm');
        }
    }
    async getCategories(_req, res) {
        try {
            const categories = await this.productService.getCategories();
            (0, request_handler_1.sendJSON)(res, 200, categories);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải danh mục');
        }
    }
    async getCollections(_req, res) {
        try {
            const collections = await this.productService.getCollections();
            (0, request_handler_1.sendJSON)(res, 200, collections);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, 'Không thể tải bộ sưu tập');
        }
    }
}
exports.ProductController = ProductController;
//# sourceMappingURL=ProductController.js.map