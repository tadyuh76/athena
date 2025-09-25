"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CartService = void 0;
const supabase_1 = require("../utils/supabase");
const uuid_1 = require("uuid");
class CartService {
    async getCart(userId, sessionId) {
        try {
            let query = supabase_1.supabase
                .from('carts')
                .select(`
          *,
          items:cart_items(
            *,
            product:products(*),
            variant:product_variants(*)
          )
        `)
                .eq('status', 'active');
            if (userId) {
                query = query.eq('user_id', userId);
            }
            else if (sessionId) {
                query = query.eq('session_id', sessionId);
            }
            else {
                return null;
            }
            const { data, error } = await query.single();
            if (error) {
                if (error.code === 'PGRST116') {
                    return this.createCart(userId, sessionId);
                }
                throw error;
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to get cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async createCart(userId, sessionId) {
        try {
            if (!userId && !sessionId) {
                sessionId = (0, uuid_1.v4)();
            }
            const { data, error } = await supabase_1.supabase
                .from('carts')
                .insert({
                user_id: userId,
                session_id: sessionId,
                status: 'active',
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
            })
                .select()
                .single();
            if (error) {
                throw error;
            }
            return data;
        }
        catch (error) {
            throw new Error(`Failed to create cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async addItem(cartId, productId, variantId, quantity = 1) {
        try {
            const { data: existing } = await supabase_1.supabase
                .from('cart_items')
                .select('*')
                .eq('cart_id', cartId)
                .eq('variant_id', variantId)
                .single();
            if (existing) {
                return this.updateItemQuantity(cartId, existing.id, existing.quantity + quantity);
            }
            const { data: variant } = await supabase_1.supabase
                .from('product_variants')
                .select('*, product:products(base_price)')
                .eq('id', variantId)
                .single();
            if (!variant) {
                throw new Error('Variant not found');
            }
            const price = variant.price || variant.product?.base_price || 0;
            const available = variant.inventory_quantity - variant.reserved_quantity;
            if (available < quantity) {
                throw new Error(`Only ${available} items available`);
            }
            const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
            const { data, error } = await supabase_1.supabase
                .from('cart_items')
                .insert({
                cart_id: cartId,
                product_id: productId,
                variant_id: variantId,
                quantity,
                price_at_time: price,
                inventory_reserved_until: reservationExpiry.toISOString()
            })
                .select()
                .single();
            if (error) {
                throw error;
            }
            await supabase_1.supabaseAdmin
                .from('product_variants')
                .update({
                reserved_quantity: variant.reserved_quantity + quantity
            })
                .eq('id', variantId);
            await this.touchCart(cartId);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to add item to cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async updateItemQuantity(cartId, itemId, quantity) {
        try {
            if (quantity <= 0) {
                await this.removeItem(cartId, itemId);
                throw new Error('Item removed from cart');
            }
            const { data: currentItem } = await supabase_1.supabase
                .from('cart_items')
                .select('*, variant:product_variants(*)')
                .eq('id', itemId)
                .eq('cart_id', cartId)
                .single();
            if (!currentItem) {
                throw new Error('Item not found in cart');
            }
            const available = currentItem.variant.inventory_quantity - currentItem.variant.reserved_quantity + currentItem.quantity;
            if (available < quantity) {
                throw new Error(`Only ${available} items available`);
            }
            const quantityDiff = quantity - currentItem.quantity;
            if (quantityDiff !== 0) {
                await supabase_1.supabaseAdmin
                    .from('product_variants')
                    .update({
                    reserved_quantity: currentItem.variant.reserved_quantity + quantityDiff
                })
                    .eq('id', currentItem.variant_id);
            }
            const { data, error } = await supabase_1.supabase
                .from('cart_items')
                .update({
                quantity,
                inventory_reserved_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
            })
                .eq('id', itemId)
                .eq('cart_id', cartId)
                .select()
                .single();
            if (error) {
                throw error;
            }
            await this.touchCart(cartId);
            return data;
        }
        catch (error) {
            throw new Error(`Failed to update item quantity: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async removeItem(cartId, itemId) {
        try {
            const { data: item } = await supabase_1.supabase
                .from('cart_items')
                .select('*')
                .eq('id', itemId)
                .eq('cart_id', cartId)
                .single();
            if (!item) {
                throw new Error('Item not found in cart');
            }
            const { data: variant } = await supabase_1.supabaseAdmin
                .from('product_variants')
                .select('reserved_quantity')
                .eq('id', item.variant_id)
                .single();
            if (variant) {
                await supabase_1.supabaseAdmin
                    .from('product_variants')
                    .update({
                    reserved_quantity: (variant.reserved_quantity || 0) - item.quantity
                })
                    .eq('id', item.variant_id);
            }
            const { error } = await supabase_1.supabase
                .from('cart_items')
                .delete()
                .eq('id', itemId)
                .eq('cart_id', cartId);
            if (error) {
                throw error;
            }
            await this.touchCart(cartId);
            return true;
        }
        catch (error) {
            throw new Error(`Failed to remove item from cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async clearCart(cartId) {
        try {
            const { data: items } = await supabase_1.supabase
                .from('cart_items')
                .select('variant_id, quantity')
                .eq('cart_id', cartId);
            if (items && items.length > 0) {
                for (const item of items) {
                    const { data: variant } = await supabase_1.supabaseAdmin
                        .from('product_variants')
                        .select('reserved_quantity')
                        .eq('id', item.variant_id)
                        .single();
                    if (variant) {
                        await supabase_1.supabaseAdmin
                            .from('product_variants')
                            .update({
                            reserved_quantity: Math.max(0, (variant.reserved_quantity || 0) - item.quantity)
                        })
                            .eq('id', item.variant_id);
                    }
                }
                const { error } = await supabase_1.supabase
                    .from('cart_items')
                    .delete()
                    .eq('cart_id', cartId);
                if (error) {
                    throw error;
                }
            }
            await this.touchCart(cartId);
            return true;
        }
        catch (error) {
            throw new Error(`Failed to clear cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async mergeGuestCart(sessionId, userId) {
        try {
            const { data: guestCart } = await supabase_1.supabase
                .from('carts')
                .select('*, items:cart_items(*)')
                .eq('session_id', sessionId)
                .eq('status', 'active')
                .single();
            let userCart = await this.getCart(userId);
            if (!userCart) {
                userCart = await this.createCart(userId);
            }
            if (guestCart && guestCart.items && guestCart.items.length > 0) {
                for (const item of guestCart.items) {
                    try {
                        await this.addItem(userCart.id, item.product_id, item.variant_id, item.quantity);
                    }
                    catch (error) {
                        console.error(`Failed to merge item: ${error}`);
                    }
                }
                await supabase_1.supabase
                    .from('carts')
                    .update({ status: 'merged' })
                    .eq('id', guestCart.id);
            }
            return userCart;
        }
        catch (error) {
            throw new Error(`Failed to merge cart: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getCartSummary(cartId) {
        try {
            const { data: cart } = await supabase_1.supabase
                .from('carts')
                .select('*, items:cart_items(*)')
                .eq('id', cartId)
                .single();
            if (!cart || !cart.items) {
                return {
                    subtotal: 0,
                    tax: 0,
                    shipping: 0,
                    discount: 0,
                    total: 0,
                    itemCount: 0
                };
            }
            const subtotal = cart.items.reduce((sum, item) => sum + (item.price_at_time * item.quantity), 0);
            const itemCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
            const taxRate = 0.0875;
            const tax = subtotal * taxRate;
            const freeShippingThreshold = 150;
            const shipping = subtotal >= freeShippingThreshold ? 0 : 15;
            const discount = 0;
            const total = subtotal + tax + shipping - discount;
            return {
                subtotal,
                tax,
                shipping,
                discount,
                total,
                itemCount
            };
        }
        catch (error) {
            throw new Error(`Failed to get cart summary: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async touchCart(cartId) {
        await supabase_1.supabase
            .from('carts')
            .update({ updated_at: new Date().toISOString() })
            .eq('id', cartId);
    }
    async releaseExpiredReservations() {
        try {
            await supabase_1.supabaseAdmin.rpc('release_expired_reservations');
        }
        catch (error) {
            console.error('Failed to release expired reservations:', error);
        }
    }
}
exports.CartService = CartService;
//# sourceMappingURL=CartService.js.map