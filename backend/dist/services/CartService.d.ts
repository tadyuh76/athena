import { CartItemWithDetails } from "../models/CartModel";
import { CartItem } from "../types/database.types";
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
export declare class CartService {
    private cartModel;
    private variantModel;
    constructor();
    getCart(userId?: string, sessionId?: string): Promise<CartWithItems | null>;
    addItem(userId: string | undefined, sessionId: string | undefined, productId: string, variantId: string, quantity?: number): Promise<CartItem>;
    updateItemQuantity(itemId: string, quantity: number): Promise<CartItem>;
    removeItem(itemId: string): Promise<void>;
    clearCart(userId?: string, sessionId?: string): Promise<void>;
    getCartSummary(userId?: string, sessionId?: string): Promise<CartSummary>;
    mergeGuestCart(guestSessionId: string, userId: string): Promise<void>;
    releaseExpiredReservations(): Promise<void>;
    verifyCartItemOwnership(itemId: string, userId?: string, sessionId?: string): Promise<boolean>;
}
//# sourceMappingURL=CartService.d.ts.map