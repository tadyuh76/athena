"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const CartModel_1 = require("../models/CartModel");
const ProductVariantModel_1 = require("../models/ProductVariantModel");
const ProductModel_1 = require("../models/ProductModel");
const uuid_1 = require("uuid");
class CartService {
    cartModel;
    variantModel;
    productModel;
    constructor() {
        this.cartModel = new CartModel_1.CartModel();
        this.variantModel = new ProductVariantModel_1.ProductVariantModel();
        this.productModel = new ProductModel_1.ProductModel();
    }
    async getCart(userId, sessionId) {
        try {
            console.log('[CartService.getCart] Called with userId:', userId, 'sessionId:', sessionId);
            if (!userId && !sessionId) {
                sessionId = (0, uuid_1.v4)();
                console.log('[CartService.getCart] Generated new sessionId:', sessionId);
            }
            let items;
            if (userId) {
                console.log('[CartService.getCart] Querying by userId:', userId);
                items = await this.cartModel.findByUserId(userId);
            }
            else if (sessionId) {
                console.log('[CartService.getCart] Querying by sessionId:', sessionId);
                items = await this.cartModel.findBySessionId(sessionId);
            }
            else {
                items = [];
            }
            console.log('[CartService.getCart] Items found:', items.length);
            const cart = {
                id: userId || sessionId || "anonymous",
                user_id: userId,
                session_id: sessionId,
                items,
                created_at: items[0]?.created_at?.toString() || new Date().toISOString(),
                updated_at: items[0]?.updated_at?.toString() || new Date().toISOString(),
            };
            console.log('[CartService.getCart] Returning cart with', cart.items.length, 'items');
            return cart;
        }
        catch (error) {
            console.error('[CartService.getCart] Error:', error);
            throw new Error(`Không thể tải giỏ hàng: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async addItem(userId, sessionId, productId, variantId, quantity = 1) {
        try {
            console.log('[CartService.addItem] Called with:', { userId, sessionId, productId, variantId, quantity });
            if (!userId && !sessionId) {
                sessionId = (0, uuid_1.v4)();
                console.log('[CartService.addItem] Generated new sessionId:', sessionId);
            }
            console.log('[CartService.addItem] Checking for existing item...');
            const existing = await this.cartModel.findExistingItem(variantId, userId, sessionId);
            if (existing) {
                console.log('[CartService.addItem] Item already exists, updating quantity');
                return this.updateItemQuantity(existing.id, existing.quantity + quantity);
            }
            console.log('[CartService.addItem] Fetching variant details...');
            const variant = await this.variantModel.findById(variantId);
            if (!variant) {
                console.error('[CartService.addItem] Variant not found:', variantId);
                throw new Error("Không tìm thấy phiên bản sản phẩm");
            }
            console.log('[CartService.addItem] Variant found:', { id: variant.id, inventory: variant.inventory_quantity, reserved: variant.reserved_quantity });
            let price = variant.price;
            if (price == null || price === 0) {
                console.log('[CartService.addItem] Variant price is null/0, fetching product price...');
                const product = await this.productModel.findById(productId);
                if (!product) {
                    console.error('[CartService.addItem] Product not found:', productId);
                    throw new Error("Không tìm thấy sản phẩm");
                }
                price = product.base_price || 0;
                console.log('[CartService.addItem] Using product base_price:', price);
            }
            console.log('[CartService.addItem] Attempting to reserve inventory atomically...');
            const reservationSuccess = await this.variantModel.reserveInventoryAtomic(variantId, quantity, 15);
            if (!reservationSuccess) {
                const available = await this.variantModel.getAvailableQuantity(variantId);
                console.error('[CartService.addItem] Insufficient inventory');
                throw new Error(`Chỉ còn ${available} sản phẩm có sẵn`);
            }
            const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
            console.log('[CartService.addItem] Inventory reserved successfully, adding item to cart...');
            const cartItem = await this.cartModel.create({
                user_id: userId,
                session_id: sessionId,
                product_id: productId,
                variant_id: variantId,
                quantity,
                price_at_time: price,
                inventory_reserved_until: reservationExpiry,
            });
            console.log('[CartService.addItem] Success! Cart item ID:', cartItem.id);
            return cartItem;
        }
        catch (error) {
            console.error('[CartService.addItem] Error:', error);
            throw new Error(`Không thể thêm sản phẩm vào giỏ hàng: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async updateItemQuantity(itemId, quantity) {
        const maxRetries = 3;
        let retries = 0;
        while (retries < maxRetries) {
            try {
                if (quantity <= 0) {
                    await this.removeItem(itemId);
                    throw new Error("Đã xóa sản phẩm khỏi giỏ hàng");
                }
                const currentItem = await this.cartModel.findByIdWithVariant(itemId);
                if (!currentItem) {
                    throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
                }
                const variant = currentItem.variant;
                if (!variant) {
                    throw new Error("Không tìm thấy phiên bản sản phẩm");
                }
                const currentQuantity = currentItem.quantity;
                const quantityDiff = quantity - currentQuantity;
                if (quantityDiff > 0) {
                    const available = variant.inventory_quantity - variant.reserved_quantity;
                    if (available < quantityDiff) {
                        throw new Error(`Chỉ còn thêm ${available} sản phẩm có sẵn`);
                    }
                    const reserved = await this.variantModel.reserveInventoryAtomic(variant.id, quantityDiff, 15);
                    if (!reserved) {
                        const currentAvailable = await this.variantModel.getAvailableQuantity(variant.id);
                        throw new Error(`Chỉ còn thêm ${currentAvailable} sản phẩm có sẵn`);
                    }
                    await this.variantModel.releaseReservedInventory(variant.id, currentQuantity);
                }
                else if (quantityDiff < 0) {
                    await this.variantModel.releaseReservedInventory(variant.id, Math.abs(quantityDiff));
                }
                const updatedItem = await this.cartModel.update(itemId, {
                    quantity,
                    updated_at: new Date().toISOString(),
                });
                return updatedItem;
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";
                if (errorMessage.includes("sản phẩm có sẵn") ||
                    errorMessage.includes("không tìm thấy") ||
                    errorMessage.includes("đã xóa")) {
                    throw new Error(`Không thể cập nhật sản phẩm: ${errorMessage}`);
                }
                if (retries === maxRetries - 1) {
                    throw new Error(`Không thể cập nhật sản phẩm sau ${maxRetries} lần thử: ${errorMessage}`);
                }
                retries++;
                await new Promise(resolve => setTimeout(resolve, 50 * retries));
            }
        }
        throw new Error("Không thể cập nhật sản phẩm: Đã vượt quá số lần thử tối đa");
    }
    async removeItem(itemId) {
        try {
            const currentItem = await this.cartModel.findByIdWithVariant(itemId);
            if (!currentItem) {
                throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
            }
            const variant = currentItem.variant;
            await this.cartModel.delete(itemId);
            if (variant) {
                await this.variantModel.releaseReservedInventory(variant.id, currentItem.quantity);
            }
        }
        catch (error) {
            throw new Error(`Không thể xóa sản phẩm khỏi giỏ hàng: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async clearCart(userId, sessionId) {
        try {
            if (!userId && !sessionId) {
                return;
            }
            let items;
            if (userId) {
                items = await this.cartModel.findByUserId(userId);
            }
            else if (sessionId) {
                items = await this.cartModel.findBySessionId(sessionId);
            }
            else {
                return;
            }
            if (items && items.length > 0) {
                for (const item of items) {
                    const variant = item.variant;
                    if (variant) {
                        await this.variantModel.releaseReservedInventory(variant.id, item.quantity);
                    }
                }
                if (userId) {
                    await this.cartModel.deleteByUserId(userId);
                }
                else if (sessionId) {
                    await this.cartModel.deleteBySessionId(sessionId);
                }
            }
        }
        catch (error) {
            throw new Error(`Không thể xóa giỏ hàng: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async getCartSummary(userId, sessionId) {
        try {
            const cart = await this.getCart(userId, sessionId);
            if (!cart || !cart.items.length) {
                return {
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                    itemCount: 0,
                };
            }
            const subtotal = cart.items.reduce((sum, item) => {
                return sum + item.price_at_time * item.quantity;
            }, 0);
            const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            const tax = subtotal * 0.085;
            const shipping = subtotal >= 150 ? 0 : 15;
            const discount = 0;
            const total = subtotal + tax + shipping - discount;
            return {
                subtotal: Math.round(subtotal * 100) / 100,
                tax: Math.round(tax * 100) / 100,
                shipping,
                discount,
                total: Math.round(total * 100) / 100,
                itemCount,
            };
        }
        catch (error) {
            throw new Error(`Không thể tính tổng giỏ hàng: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async mergeGuestCart(guestSessionId, userId) {
        try {
            const guestItems = await this.cartModel.findBySessionId(guestSessionId);
            if (!guestItems || guestItems.length === 0) {
                return;
            }
            const userItems = await this.cartModel.findByUserId(userId);
            const userVariantIds = new Set(userItems?.map((item) => item.variant_id) || []);
            for (const guestItem of guestItems) {
                if (userVariantIds.has(guestItem.variant_id)) {
                    const userItem = userItems?.find((item) => item.variant_id === guestItem.variant_id);
                    if (userItem) {
                        await this.updateItemQuantity(userItem.id, userItem.quantity + guestItem.quantity);
                    }
                    await this.cartModel.delete(guestItem.id);
                }
                else {
                    await this.cartModel.update(guestItem.id, {
                        user_id: userId,
                        session_id: null,
                    });
                }
            }
            await this.cartModel.deleteBySessionId(guestSessionId);
        }
        catch (error) {
            throw new Error(`Không thể hợp nhất giỏ hàng khách: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async releaseExpiredReservations() {
        try {
            const expiredItems = await this.cartModel.findExpiredReservations();
            if (!expiredItems || expiredItems.length === 0) {
                return;
            }
            for (const item of expiredItems) {
                await this.variantModel.releaseReservedInventory(item.variant_id, item.quantity);
            }
            const expiredItemIds = expiredItems.map(item => item.id);
            for (const id of expiredItemIds) {
                await this.cartModel.update(id, {
                    inventory_reserved_until: null
                });
            }
        }
        catch (error) {
            throw new Error(`Không thể giải phóng đặt chỗ hết hạn: ${error instanceof Error ? error.message : "Lỗi không xác định"}`);
        }
    }
    async verifyCartItemOwnership(itemId, userId, sessionId) {
        try {
            const item = await this.cartModel.findById(itemId);
            if (!item) {
                return false;
            }
            if (userId && item.user_id === userId) {
                return true;
            }
            if (sessionId && item.session_id === sessionId) {
                return true;
            }
            return false;
        }
        catch (error) {
            console.error('[CartService.verifyCartItemOwnership] Error:', error);
            return false;
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map