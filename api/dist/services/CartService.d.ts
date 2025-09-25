import { Cart, CartItem, Product, ProductVariant } from '../types/database.types';
export interface CartItemWithDetails extends CartItem {
    product?: Product;
    variant?: ProductVariant;
}
export interface CartWithItems extends Cart {
    items?: CartItemWithDetails[];
}
export interface CartSummary {
    subtotal: number;
    tax: number;
    shipping: number;
    discount: number;
    total: number;
    itemCount: number;
}
export declare class CartService {
    getCart(userId?: string, sessionId?: string): Promise<CartWithItems | null>;
    createCart(userId?: string, sessionId?: string): Promise<Cart>;
    addItem(cartId: string, productId: string, variantId: string, quantity?: number): Promise<CartItem>;
    updateItemQuantity(cartId: string, itemId: string, quantity: number): Promise<CartItem>;
    removeItem(cartId: string, itemId: string): Promise<boolean>;
    clearCart(cartId: string): Promise<boolean>;
    mergeGuestCart(sessionId: string, userId: string): Promise<Cart>;
    getCartSummary(cartId: string): Promise<CartSummary>;
    private touchCart;
    releaseExpiredReservations(): Promise<void>;
}
//# sourceMappingURL=CartService.d.ts.map