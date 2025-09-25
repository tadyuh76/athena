import { CartItem, Product, ProductVariant } from "../types/database.types";
export interface CartItemWithDetails extends CartItem {
    product?: Product;
    variant?: ProductVariant;
}
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
export declare class CartService {
    getCart(userId?: string, sessionId?: string): Promise<CartWithItems | null>;
    addItem(userId: string | undefined, sessionId: string | undefined, productId: string, variantId: string, quantity?: number): Promise<CartItem>;
    updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>;
    removeItem(itemId: string): Promise<void>;
    clearCart(userId?: string, sessionId?: string): Promise<void>;
    getCartSummary(userId?: string, sessionId?: string): Promise<CartSummary>;
    mergeGuestCart(guestSessionId: string, userId: string): Promise<void>;
    releaseExpiredReservations(): Promise<void>;
}
//# sourceMappingURL=CartService.d.ts.map