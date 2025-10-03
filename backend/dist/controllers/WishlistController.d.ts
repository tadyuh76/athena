import { ServerResponse } from 'http';
import { AuthRequest } from '../middleware/auth';
export declare class WishlistController {
    private wishlistService;
    constructor();
    getUserWishlist(req: AuthRequest, res: ServerResponse): Promise<void>;
    addToWishlist(req: AuthRequest, res: ServerResponse): Promise<void>;
    removeFromWishlist(req: AuthRequest, res: ServerResponse, itemId: string): Promise<void>;
    updateWishlistItem(req: AuthRequest, res: ServerResponse, itemId: string): Promise<void>;
    getWishlistCount(req: AuthRequest, res: ServerResponse): Promise<void>;
}
//# sourceMappingURL=WishlistController.d.ts.map