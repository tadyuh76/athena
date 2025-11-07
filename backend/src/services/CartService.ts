import { CartModel, CartItemWithDetails } from "../models/CartModel";
import { ProductVariantModel } from "../models/ProductVariantModel";
import { ProductModel } from "../models/ProductModel";
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
  private productModel: ProductModel;

  constructor() {
    this.cartModel = new CartModel();
    this.variantModel = new ProductVariantModel();
    this.productModel = new ProductModel();
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
        `Không thể tải giỏ hàng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
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

      // Get variant details for pricing
      console.log('[CartService.addItem] Fetching variant details...');
      const variant = await this.variantModel.findById(variantId);

      if (!variant) {
        console.error('[CartService.addItem] Variant not found:', variantId);
        throw new Error("Không tìm thấy phiên bản sản phẩm");
      }

      console.log('[CartService.addItem] Variant found:', { id: variant.id, inventory: variant.inventory_quantity, reserved: variant.reserved_quantity });

      // Get price from variant, fallback to product price if variant price is null
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

      // Atomically reserve inventory (prevents race conditions)
      console.log('[CartService.addItem] Attempting to reserve inventory atomically...');
      const reservationSuccess = await this.variantModel.reserveInventoryAtomic(variantId, quantity, 15);

      if (!reservationSuccess) {
        const available = await this.variantModel.getAvailableQuantity(variantId);
        console.error('[CartService.addItem] Insufficient inventory');
        throw new Error(`Chỉ còn ${available} sản phẩm có sẵn`);
      }

      // Reserve inventory
      const reservationExpiry = new Date(Date.now() + 15 * 60 * 1000);
      console.log('[CartService.addItem] Inventory reserved successfully, adding item to cart...');

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

      console.log('[CartService.addItem] Success! Cart item ID:', cartItem.id);
      return cartItem;
    } catch (error) {
      console.error('[CartService.addItem] Error:', error);
      throw new Error(
        `Không thể thêm sản phẩm vào giỏ hàng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
    }
  }

  async updateItemQuantity(
    itemId: string,
    quantity: number
  ): Promise<CartItem> {
    const maxRetries = 3;
    let retries = 0;

    while (retries < maxRetries) {
      try {
        if (quantity <= 0) {
          await this.removeItem(itemId);
          throw new Error("Đã xóa sản phẩm khỏi giỏ hàng");
        }

        // Get current cart item with variant
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

        // If increasing quantity, check inventory availability
        if (quantityDiff > 0) {
          const available = variant.inventory_quantity - variant.reserved_quantity;
          if (available < quantityDiff) {
            throw new Error(`Chỉ còn thêm ${available} sản phẩm có sẵn`);
          }

          // Try to reserve the additional inventory first
          const reserved = await this.variantModel.reserveInventoryAtomic(
            variant.id,
            quantityDiff,
            15
          );

          if (!reserved) {
            const currentAvailable = await this.variantModel.getAvailableQuantity(variant.id);
            throw new Error(`Chỉ còn thêm ${currentAvailable} sản phẩm có sẵn`);
          }

          // Release the old reservation
          await this.variantModel.releaseReservedInventory(variant.id, currentQuantity);
        } else if (quantityDiff < 0) {
          // Decreasing quantity - release the difference
          await this.variantModel.releaseReservedInventory(variant.id, Math.abs(quantityDiff));
        }

        // Update cart item quantity
        const updatedItem = await this.cartModel.update(itemId, {
          quantity,
          updated_at: new Date().toISOString(),
        } as any);

        return updatedItem;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Lỗi không xác định";

        // Don't retry on user-facing errors
        if (errorMessage.includes("sản phẩm có sẵn") ||
            errorMessage.includes("không tìm thấy") ||
            errorMessage.includes("đã xóa")) {
          throw new Error(`Không thể cập nhật sản phẩm: ${errorMessage}`);
        }

        // Retry on transient errors
        if (retries === maxRetries - 1) {
          throw new Error(`Không thể cập nhật sản phẩm sau ${maxRetries} lần thử: ${errorMessage}`);
        }

        retries++;
        await new Promise(resolve => setTimeout(resolve, 50 * retries));
      }
    }

    throw new Error("Không thể cập nhật sản phẩm: Đã vượt quá số lần thử tối đa");
  }

  async removeItem(itemId: string): Promise<void> {
    try {
      // Get current item to release inventory
      const currentItem = await this.cartModel.findByIdWithVariant(itemId);

      if (!currentItem) {
        throw new Error("Không tìm thấy sản phẩm trong giỏ hàng");
      }

      const variant = currentItem.variant;

      // Remove item from cart
      await this.cartModel.delete(itemId);

      // Release reserved inventory atomically
      if (variant) {
        await this.variantModel.releaseReservedInventory(variant.id, currentItem.quantity);
      }
    } catch (error) {
      throw new Error(
        `Không thể xóa sản phẩm khỏi giỏ hàng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
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
        // Release reserved inventory for all items atomically
        for (const item of items) {
          const variant = item.variant;
          if (variant) {
            await this.variantModel.releaseReservedInventory(variant.id, item.quantity);
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
        `Không thể xóa giỏ hàng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
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
        `Không thể tính tổng giỏ hàng: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
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
        `Không thể hợp nhất giỏ hàng khách: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
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

      // Release reserved inventory for expired items atomically
      for (const item of expiredItems) {
        await this.variantModel.releaseReservedInventory(item.variant_id, item.quantity);
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
        `Không thể giải phóng đặt chỗ hết hạn: ${
          error instanceof Error ? error.message : "Lỗi không xác định"
        }`
      );
    }
  }

  /**
   * Verify that a cart item belongs to the given user or session
   * Returns true if authorized, false otherwise
   */
  async verifyCartItemOwnership(
    itemId: string,
    userId?: string,
    sessionId?: string
  ): Promise<boolean> {
    try {
      const item = await this.cartModel.findById(itemId);

      if (!item) {
        return false;
      }

      // Check if item belongs to the user or session
      if (userId && item.user_id === userId) {
        return true;
      }

      if (sessionId && item.session_id === sessionId) {
        return true;
      }

      return false;
    } catch (error) {
      console.error('[CartService.verifyCartItemOwnership] Error:', error);
      return false;
    }
  }
}
