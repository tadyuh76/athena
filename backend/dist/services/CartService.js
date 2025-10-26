"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const supabase_1 = require("../utils/supabase");
const uuid_1 = require("uuid");
class CartService {
    async getCart(userId, sessionId) {
        try {
            console.log('[CartService.getCart] Called with userId:', userId, 'sessionId:', sessionId);
            if (!userId && !sessionId) {
                sessionId = (0, uuid_1.v4)();
                console.log('[CartService.getCart] Generated new sessionId:', sessionId);
            }
            let query = supabase_1.supabase.from("cart_items").select(`
          *,
          product:products(*, images:product_images(*)),
          variant:product_variants(*)
        `);
            if (userId) {
                console.log('[CartService.getCart] Querying by userId:', userId);
                query = query.eq("user_id", userId);
            }
            else if (sessionId) {
                console.log('[CartService.getCart] Querying by sessionId:', sessionId);
                query = query.eq("session_id", sessionId);
            }
            console.log('[CartService.getCart] Executing Supabase query...');
            const { data, error } = await query;
            console.log('[CartService.getCart] Query complete. Items found:', data?.length || 0);
            if (error) {
                console.error('[CartService.getCart] Supabase error:', error);
                throw error;
            }
            const cart = {
                id: userId || sessionId || "anonymous",
                user_id: userId,
                session_id: sessionId,
                items: data || [],
                created_at: data?.[0]?.created_at || new Date().toISOString(),
                updated_at: data?.[0]?.updated_at || new Date().toISOString(),
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
            let existingQuery = supabase_1.supabase
                .from("cart_items")
                .select("*")
                .eq("variant_id", variantId);
            if (userId) {
                existingQuery = existingQuery.eq("user_id", userId);
            }
            else {
                existingQuery = existingQuery.eq("session_id", sessionId);
            }
            const { data: existing } = await existingQuery.single();
            if (existing) {
                console.log('[CartService.addItem] Item already exists, updating quantity');
                return this.updateItemQuantity(existing.id, existing.quantity + quantity);
            }
            console.log('[CartService.addItem] Fetching variant details...');
            const { data: variant } = await supabase_1.supabase
                .from("product_variants")
                .select("*, product:products(base_price)")
                .eq("id", variantId)
                .single();
            if (!variant) {
                console.error('[CartService.addItem] Variant not found:', variantId);
                throw new Error("Variant not found");
            }
            console.log('[CartService.addItem] Variant found:', { id: variant.id, inventory: variant.inventory_quantity, reserved: variant.reserved_quantity });
            const price = variant.price || variant.product?.base_price || 0;
            const available = variant.inventory_quantity - variant.reserved_quantity;
            console.log('[CartService.addItem] Available inventory:', available);
            if (available < quantity) {
                console.error('[CartService.addItem] Insufficient inventory');
                throw new Error(`Only ${available} items available`);
            }
            const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
            console.log('[CartService.addItem] Adding item to cart...');
            const { data, error } = await supabase_1.supabase
                .from("cart_items")
                .insert({
                user_id: userId,
                session_id: sessionId,
                product_id: productId,
                variant_id: variantId,
                quantity,
                price_at_time: price,
                inventory_reserved_until: reservationExpiry.toISOString(),
            })
                .select()
                .single();
            if (error) {
                console.error('[CartService.addItem] Error inserting cart item:', error);
                throw error;
            }
            console.log('[CartService.addItem] Item added, updating reserved quantity...');
            await supabase_1.supabaseAdmin
                .from("product_variants")
                .update({
                reserved_quantity: variant.reserved_quantity + quantity,
            })
                .eq("id", variantId);
            console.log('[CartService.addItem] Success! Cart item ID:', data.id);
            return data;
        }
        catch (error) {
            console.error('[CartService.addItem] Error:', error);
            throw new Error(`Failed to add item to cart: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async updateItemQuantity(itemId, quantity) {
        try {
            if (quantity <= 0) {
                this.removeItem(itemId);
            }
            const { data: currentItem } = await supabase_1.supabase
                .from("cart_items")
                .select("*, variant:product_variants(*)")
                .eq("id", itemId)
                .single();
            if (!currentItem) {
                throw new Error("Cart item not found");
            }
            const variant = currentItem.variant;
            const currentQuantity = currentItem.quantity;
            const quantityDiff = quantity - currentQuantity;
            if (quantityDiff > 0) {
                const available = variant.inventory_quantity - variant.reserved_quantity;
                if (available < quantityDiff) {
                    throw new Error(`Only ${available} additional items available`);
                }
            }
            const { data, error } = await supabase_1.supabase
                .from("cart_items")
                .update({
                quantity,
                updated_at: new Date().toISOString(),
            })
                .eq("id", itemId)
                .select()
                .single();
            if (error) {
                throw error;
            }
            await supabase_1.supabaseAdmin
                .from("product_variants")
                .update({
                reserved_quantity: variant.reserved_quantity + quantityDiff,
            })
                .eq("id", variant.id);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update cart item: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async removeItem(itemId) {
        try {
            const { data: currentItem } = await supabase_1.supabase
                .from("cart_items")
                .select("*, variant:product_variants(*)")
                .eq("id", itemId)
                .single();
            if (!currentItem) {
                throw new Error("Cart item not found");
            }
            const { error } = await supabase_1.supabase
                .from("cart_items")
                .delete()
                .eq("id", itemId);
            if (error) {
                throw error;
            }
            const variant = currentItem.variant;
            await supabase_1.supabaseAdmin
                .from("product_variants")
                .update({
                reserved_quantity: Math.max(0, variant.reserved_quantity - currentItem.quantity),
            })
                .eq("id", variant.id);
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
            let query = supabase_1.supabase
                .from("cart_items")
                .select("*, variant:product_variants(*)");
            if (userId) {
                query = query.eq("user_id", userId);
            }
            else {
                query = query.eq("session_id", sessionId);
            }
            const { data: items } = await query;
            if (items && items.length > 0) {
                for (const item of items) {
                    const variant = item.variant;
                    await supabase_1.supabaseAdmin
                        .from("product_variants")
                        .update({
                        reserved_quantity: Math.max(0, variant.reserved_quantity - item.quantity),
                    })
                        .eq("id", variant.id);
                }
                let deleteQuery = supabase_1.supabase.from("cart_items").delete();
                if (userId) {
                    deleteQuery = deleteQuery.eq("user_id", userId);
                }
                else {
                    deleteQuery = deleteQuery.eq("session_id", sessionId);
                }
                const { error } = await deleteQuery;
                if (error) {
                    throw error;
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
            const { data: guestItems } = await supabase_1.supabase
                .from("cart_items")
                .select("*")
                .eq("session_id", guestSessionId);
            if (!guestItems || guestItems.length === 0) {
                return;
            }
            const { data: userItems } = await supabase_1.supabase
                .from("cart_items")
                .select("*")
                .eq("user_id", userId);
            const userVariantIds = new Set(userItems?.map((item) => item.variant_id) || []);
            for (const guestItem of guestItems) {
                if (userVariantIds.has(guestItem.variant_id)) {
                    const userItem = userItems?.find((item) => item.variant_id === guestItem.variant_id);
                    if (userItem) {
                        await this.updateItemQuantity(userItem.id, userItem.quantity + guestItem.quantity);
                    }
                }
                else {
                    await supabase_1.supabase
                        .from("cart_items")
                        .update({
                        user_id: userId,
                        session_id: null,
                    })
                        .eq("id", guestItem.id);
                }
            }
            await supabase_1.supabase
                .from("cart_items")
                .delete()
                .eq("session_id", guestSessionId);
        }
        catch (error) {
            throw new Error(`Failed to merge guest cart: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
    async releaseExpiredReservations() {
        try {
            const now = new Date().toISOString();
            const { data: expiredItems } = await supabase_1.supabase
                .from("cart_items")
                .select("*, variant:product_variants(*)")
                .lt("inventory_reserved_until", now)
                .not("inventory_reserved_until", "is", null);
            if (!expiredItems || expiredItems.length === 0) {
                return;
            }
            for (const item of expiredItems) {
                const variant = item.variant;
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
            await supabase_1.supabase
                .from("cart_items")
                .update({ inventory_reserved_until: null })
                .in("id", expiredItemIds);
        }
        catch (error) {
            throw new Error(`Failed to release expired reservations: ${error instanceof Error ? error.message : "Unknown error"}`);
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map