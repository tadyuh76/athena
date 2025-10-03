import { Wishlist, Product, ProductVariant } from '../types/database.types';
export interface WishlistItem extends Wishlist {
    product?: Product;
    variant?: ProductVariant;
}
export declare class WishlistService {
    getUserWishlist(userId: string): Promise<WishlistItem[]>;
    addToWishlist(userId: string, productId: string, variantId?: string, notes?: string): Promise<Wishlist>;
    removeFromWishlist(userId: string, wishlistId: string): Promise<boolean>;
    updateWishlistItem(userId: string, wishlistId: string, updates: {
        priority?: number;
        notes?: string;
    }): Promise<Wishlist>;
    isInWishlist(userId: string, productId: string, variantId?: string): Promise<boolean>;
    clearWishlist(userId: string): Promise<boolean>;
    getWishlistCount(userId: string): Promise<number>;
    moveToCart(userId: string, wishlistId: string, cartId: string): Promise<boolean>;
}
//# sourceMappingURL=WishlistService.d.ts.map