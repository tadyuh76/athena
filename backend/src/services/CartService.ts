import { supabaseAdmin } from "../utils/supabase";
import { CartModel, CartItemWithDetails } from "../models/CartModel";
import { ProductVariantModel } from "../models/ProductVariantModel";
import { CartItem } from "../types/database.types";
import { v4 as uuidv4 } from "uuid";

export { CartItemWithDetails };

export interface CartWithItems {
  id: string;
  user_id?: string;
  session_id?: string;
  items: CartItemWithDetails[];
  created_at: string;
  updated_at: string;
}

export interface CartSummary {
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  itemCount: number;
}

export class CartService {
  private cartModel: CartModel;
  private variantModel: ProductVariantModel;

  constructor() {
    this.cartModel = new CartModel();
    this.variantModel = new ProductVariantModel();
  }

  async getCart(
    userId?: string,
    sessionId?: string
  ): Promise<CartWithItems | null> {
    try {
      console.log('[CartService.getCart] Called with userId:', userId, 'sessionId:', sessionId);

      if (!userId && !sessionId) {
        sessionId = uuidv4();
        console.log('[CartService.getCart] Generated new sessionId:', sessionId);
      }

      let items: CartItemWithDetails[];

      if (userId) {
        console.log('[CartService.getCart] Querying by userId:', userId);
        items = await this.cartModel.findByUserId(userId);
      } else if (sessionId) {
        console.log('[CartService.getCart] Querying by sessionId:', sessionId);
        items = await this.cartModel.findBySessionId(sessionId);
      } else {
        items = [];
      }

      console.log('[CartService.getCart] Items found:', items.length);

      // Create a virtual cart object
      const cart: CartWithItems = {
        id: userId || sessionId || "anonymous",
        user_id: userId,
        session_id: sessionId,
        items,
        created_at: items[0]?.created_at?.toString() || new Date().toISOString(),
        updated_at: items[0]?.updated_at?.toString() || new Date().toISOString(),
      };

      console.log('[CartService.getCart] Returning cart with', cart.items.length, 'items');
      return cart;
    } catch (error) {
      console.error('[CartService.getCart] Error:', error);
      throw new Error(
        `Failed to get cart: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async addItem(
    userId: string | undefined,
    sessionId: string | undefined,
    productId: string,
    variantId: string,
    quantity: number = 1
  ): Promise<CartItem> {
    try {
      console.log('[CartService.addItem] Called with:', { userId, sessionId, productId, variantId, quantity });

      if (!userId && !sessionId) {
        sessionId = uuidv4();
        console.log('[CartService.addItem] Generated new sessionId:', sessionId);
      }

      // Check existing item
      console.log('[CartService.addItem] Checking for existing item...');
      const existing = await this.cartModel.findExistingItem(variantId, userId, sessionId);

      if (existing) {
        console.log('[CartService.addItem] Item already exists, updating quantity');
        // Update quantity if item exists
        return this.updateItemQuantity(
          existing.id,
          existing.quantity + quantity
        );
      }

      // Get variant details for pricing and inventory check
      console.log('[CartService.addItem] Fetching variant details...');
      const variant = await this.variantModel.findById(variantId);

      if (!variant) {
        console.error('[CartService.addItem] Variant not found:', variantId);
        throw new Error("Variant not found");
      }

      console.log('[CartService.addItem] Variant found:', { id: variant.id, inventory: variant.inventory_quantity, reserved: variant.reserved_quantity });

      const price = variant.price || 0;

      // Check inventory
      const available = variant.inventory_quantity - variant.reserved_quantity;
      console.log('[CartService.addItem] Available inventory:', available);
      if (available < quantity) {
        console.error('[CartService.addItem] Insufficient inventory');
        throw new Error(`Only ${available} items available`);
      }

      // Reserve inventory
      const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
      console.log('[CartService.addItem] Adding item to cart...');

      // Add item to cart
      const cartItem = await this.cartModel.create({
        user_id: userId,
        session_id: sessionId,
        product_id: productId,
        variant_id: variantId,
        quantity,
        price_at_time: price,
        inventory_reserved_until: reservationExpiry as any,
      });

      console.log('[CartService.addItem] Item added, updating reserved quantity...');
      // Update variant reserved quantity
      await this.variantModel.update(variantId, {
        reserved_quantity: variant.reserved_quantity + quantity,
      } as any, true);

      console.log('[CartService.addItem] Success! Cart item ID:', cartItem.id);
      return cartItem;
    } catch (error) {
      console.error('[CartService.addItem] Error:', error);
      throw new Error(
        `Failed to add item to cart: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<CartItem> {
    try {
      if (quantity <= 0) {
        await this.removeItem(itemId);
        throw new Error("Item removed from cart");
      }

      // Get current item to check inventory
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

      // Check inventory if increasing quantity
      if (quantityDiff > 0) {
        const available =
          variant.inventory_quantity - variant.reserved_quantity;
        if (available < quantityDiff) {
          throw new Error(`Only ${available} additional items available`);
        }
      }

      // Update cart item
      const updatedItem = await this.cartModel.update(itemId, {
        quantity,
        updated_at: new Date().toISOString(),
      } as any);

      // Update variant reserved quantity
      await this.variantModel.update(variant.id, {
        reserved_quantity: variant.reserved_quantity + quantityDiff,
      } as any, true);

      return updatedItem;
    } catch (error) {
      throw new Error(
        `Failed to update cart item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async removeItem(itemId: string): Promise<void> {
    try {
      // Get current item to release inventory
      const currentItem = await this.cartModel.findByIdWithVariant(itemId);

      if (!currentItem) {
        throw new Error("Cart item not found");
      }

      const variant = currentItem.variant;

      // Remove item from cart
      await this.cartModel.delete(itemId);

      // Release reserved inventory
      if (variant) {
        await this.variantModel.update(variant.id, {
          reserved_quantity: Math.max(
            0,
            variant.reserved_quantity - currentItem.quantity
          ),
        } as any, true);
      }
    } catch (error) {
      throw new Error(
        `Failed to remove cart item: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async clearCart(userId?: string, sessionId?: string): Promise<void> {
    try {
      if (!userId && !sessionId) {
        return;
      }

      // Get all cart items to release inventory
      let items: CartItemWithDetails[];

      if (userId) {
        items = await this.cartModel.findByUserId(userId);
      } else if (sessionId) {
        items = await this.cartModel.findBySessionId(sessionId);
      } else {
        return;
      }

      if (items && items.length > 0) {
        // Release reserved inventory for all items
        for (const item of items) {
          const variant = item.variant;
          if (variant) {
            await this.variantModel.update(variant.id, {
              reserved_quantity: Math.max(
                0,
                variant.reserved_quantity - item.quantity
              ),
            } as any, true);
          }
        }

        // Remove all cart items
        if (userId) {
          await this.cartModel.deleteByUserId(userId);
        } else if (sessionId) {
          await this.cartModel.deleteBySessionId(sessionId);
        }
      }
    } catch (error) {
      throw new Error(
        `Failed to clear cart: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async getCartSummary(
    userId?: string,
    sessionId?: string
  ): Promise<CartSummary> {
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

      const itemCount = cart.items.reduce(
        (sum, item) => sum + item.quantity,
        0
      );

      // Calculate tax (8.5% for example)
      const tax = subtotal * 0.085;

      // Free shipping over $150
      const shipping = subtotal >= 150 ? 0 : 15;

      const discount = 0; // No discounts for now
      const total = subtotal + tax + shipping - discount;

      return {
        subtotal: Math.round(subtotal * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        shipping,
        discount,
        total: Math.round(total * 100) / 100,
        itemCount,
      };
    } catch (error) {
      throw new Error(
        `Failed to calculate cart summary: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async mergeGuestCart(guestSessionId: string, userId: string): Promise<void> {
    try {
      // Get guest cart items
      const guestItems = await this.cartModel.findBySessionId(guestSessionId);

      if (!guestItems || guestItems.length === 0) {
        return;
      }

      // Get user cart items
      const userItems = await this.cartModel.findByUserId(userId);

      const userVariantIds = new Set(
        userItems?.map((item) => item.variant_id) || []
      );

      // Merge items
      for (const guestItem of guestItems) {
        if (userVariantIds.has(guestItem.variant_id)) {
          // Update existing user item quantity
          const userItem = userItems?.find(
            (item) => item.variant_id === guestItem.variant_id
          );
          if (userItem) {
            await this.updateItemQuantity(
              userItem.id,
              userItem.quantity + guestItem.quantity
            );
          }
          // Delete guest item after merging
          await this.cartModel.delete(guestItem.id);
        } else {
          // Move guest item to user
          await this.cartModel.update(guestItem.id, {
            user_id: userId,
            session_id: null,
          } as any);
        }
      }

      // Remove any remaining guest items
      await this.cartModel.deleteBySessionId(guestSessionId);
    } catch (error) {
      throw new Error(
        `Failed to merge guest cart: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async releaseExpiredReservations(): Promise<void> {
    try {
      // Get all expired cart items using the model
      const expiredItems = await this.cartModel.findExpiredReservations();

      if (!expiredItems || expiredItems.length === 0) {
        return;
      }

      // Release reserved inventory for expired items
      for (const item of expiredItems) {
        // Get fresh variant data to ensure accuracy
        const variant = await this.variantModel.findById(item.variant_id);
        if (variant) {
          await supabaseAdmin
            .from("product_variants")
            .update({
              reserved_quantity: Math.max(
                0,
                variant.reserved_quantity - item.quantity
              ),
            })
            .eq("id", variant.id);
        }
      }

      // Clear the reservation timestamp on expired items
      const expiredItemIds = expiredItems.map(item => item.id);
      for (const id of expiredItemIds) {
        await this.cartModel.update(id, {
          inventory_reserved_until: null
        } as any);
      }

    } catch (error) {
      throw new Error(
        `Failed to release expired reservations: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }
}
