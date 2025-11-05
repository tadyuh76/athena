"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProductService = void 0;
const ProductModel_1 = require("../models/ProductModel");
const ProductVariantModel_1 = require("../models/ProductVariantModel");
const CategoryModel_1 = require("../models/CategoryModel");
const CollectionModel_1 = require("../models/CollectionModel");
class ProductService {
    productModel;
    variantModel;
    categoryModel;
    collectionModel;
    constructor() {
        this.productModel = new ProductModel_1.ProductModel();
        this.variantModel = new ProductVariantModel_1.ProductVariantModel();
        this.categoryModel = new CategoryModel_1.CategoryModel();
        this.collectionModel = new CollectionModel_1.CollectionModel();
    }
    async getProducts(filter = {}, page = 1, limit = 20) {
        try {
            const result = await this.productModel.findWithFilters(filter, page, limit);
            if (filter.in_stock) {
                result.products = this.productModel.filterByStock(result.products);
            }
            return result;
        }
        catch (error) {
            console.error('Error in getProducts:', error);
            throw new Error(`Failed to get products: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getProductById(id) {
        try {
            const product = await this.productModel.findByIdWithRelations(id);
            if (product) {
                await this.productModel.incrementViewCount(id);
            }
            return product;
        }
        catch (error) {
            throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getProductBySlug(slug) {
        try {
            const product = await this.productModel.findBySlugWithRelations(slug);
            if (product) {
                await this.productModel.incrementViewCount(product.id);
            }
            return product;
        }
        catch (error) {
            throw new Error(`Failed to get product: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createProduct(product) {
        return this.productModel.create(product, true);
    }
    async updateProduct(id, updates) {
        return this.productModel.update(id, updates, true);
    }
    async deleteProduct(id) {
        return this.productModel.softDelete(id, true);
    }
    async createVariant(variant) {
        return this.variantModel.create(variant, true);
    }
    async updateVariant(id, updates) {
        return this.variantModel.update(id, updates, true);
    }
    async getCategories() {
        return this.categoryModel.findAllActive();
    }
    async getCollections() {
        return this.collectionModel.findAllActive();
    }
    async checkInventory(variantId, quantity) {
        return this.variantModel.checkInventory(variantId, quantity);
    }
    async reserveInventory(variantId, quantity, durationMinutes = 15) {
        return this.variantModel.reserveInventoryAtomic(variantId, quantity, durationMinutes);
    }
}
exports.ProductService = ProductService;
//# sourceMappingURL=ProductService.js.map