"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const supabase_1 = require("../utils/supabase");
const CartModel_1 = require("../models/CartModel");
const ProductVariantModel_1 = require("../models/ProductVariantModel");
const uuid_1 = require("uuid");
class CartService {
    cartModel;
    variantModel;
    constructor() {
        this.cartModel = new CartModel_1.CartModel();
        this.variantModel = new ProductVariantModel_1.ProductVariantModel();
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
            throw new Error(`Failed to get cart: ${error instanceof Error ? error.message : "Unknown error"}`);
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
                throw new Error("Variant not found");
            }
            console.log('[CartService.addItem] Variant found:', { id: variant.id, inventory: variant.inventory_quantity, reserved: variant.reserved_quantity });
            const price = variant.price || 0;
            const available = variant.inventory_quantity - variant.reserved_quantity;
            console.log('[CartService.addItem] Available inventory:', available);
            if (available < quantity) {
                console.error('[CartService.addItem] Insufficient inventory');
                throw new Error(`Only ${available} items available`);
            }
            const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
            console.log('[CartService.addItem] Adding item to cart...');
            const cartItem = await this.cartModel.create({
                user_id: userId,
                session_id: sessionId,
                product_id: productId,
                variant_id: variantId,
                quantity,
                price_at_time: price,
                inventory_reserved_until: reservationExpiry,
            });
            console.log('[CartService.addItem] Item added, updating reserved quantity...');
            await this.variantModel.update(variantId, {
                reserved_quantity: variant.reserved_quantity + quantity,
            }, true);
            console.log('[CartService.addItem] Success! Cart item ID:', cartItem.id);
            return cartItem;
        }
        catch (error) {
            console.error('[CartService.addItem] Error:', error);
            throw new Error(`Failed to add item to cart: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async updateItemQuantity(itemId, quantity) {
        try {
            if (quantity <= 0) {
                await this.removeItem(itemId);
                throw new Error("Item removed from cart");
            }
            const currentItem = await this.cartModel.findByIdWithVariant(itemId);
            if (!currentItem) {
                throw new Error("Cart item not found");
            }
            const variant = currentItem.variant;
            if (!variant) {
                throw new Error("Variant not found");
            }
            const currentQuantity = currentItem.quantity;
            const quantityDiff = quantity - currentQuantity;
            if (quantityDiff > 0) {
                const available = variant.inventory_quantity - variant.reserved_quantity;
                if (available < quantityDiff) {
                    throw new Error(`Only ${available} additional items available`);
                }
            }
            const updatedItem = await this.cartModel.update(itemId, {
                quantity,
                updated_at: new Date().toISOString(),
            });
            await this.variantModel.update(variant.id, {
                reserved_quantity: variant.reserved_quantity + quantityDiff,
            }, true);
            return updatedItem;
        }
        catch (error) {
            throw new Error(`Failed to update cart item: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async removeItem(itemId) {
        try {
            const currentItem = await this.cartModel.findByIdWithVariant(itemId);
            if (!currentItem) {
                throw new Error("Cart item not found");
            }
            const variant = currentItem.variant;
            await this.cartModel.delete(itemId);
            if (variant) {
                await this.variantModel.update(variant.id, {
                    reserved_quantity: Math.max(0, variant.reserved_quantity - currentItem.quantity),
                }, true);
            }
        }
        catch (error) {
            throw new Error(`Failed to remove cart item: ${error instanceof Error ? error.message : "Unknown error"}`);
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
                        await this.variantModel.update(variant.id, {
                            reserved_quantity: Math.max(0, variant.reserved_quantity - item.quantity),
                        }, true);
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
            throw new Error(`Failed to clear cart: ${error instanceof Error ? error.message : "Unknown error"}`);
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
            throw new Error(`Failed to calculate cart summary: ${error instanceof Error ? error.message : "Unknown error"}`);
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
            throw new Error(`Failed to merge guest cart: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async releaseExpiredReservations() {
        try {
            const expiredItems = await this.cartModel.findExpiredReservations();
            if (!expiredItems || expiredItems.length === 0) {
                return;
            }
            for (const item of expiredItems) {
                const variant = await this.variantModel.findById(item.variant_id);
                if (variant) {
                    await supabase_1.supabaseAdmin
                        .from("product_variants")
                        .update({
                        reserved_quantity: Math.max(0, variant.reserved_quantity - item.quantity),
                    })
                        .eq("id", variant.id);
                }
            }
            const expiredItemIds = expiredItems.map(item => item.id);
            for (const id of expiredItemIds) {
                await this.cartModel.update(id, {
                    inventory_reserved_until: null
                });
            }
        }
        catch (error) {
            throw new Error(`Failed to release expired reservations: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map