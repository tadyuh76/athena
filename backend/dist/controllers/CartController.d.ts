import { ServerResponse } from 'http';
import { AuthRequest } from '../middleware/auth';
export declare class CartController {
    private cartService;
    constructor();
    getCart(req: AuthRequest, res: ServerResponse): Promise<void>;
    addItem(req: AuthRequest, res: ServerResponse): Promise<void>;
    updateItemQuantity(req: AuthRequest, res: ServerResponse, itemId: string): Promise<void>;
    removeItem(req: AuthRequest, res: ServerResponse, itemId: string): Promise<void>;
    getCartSummary(req: AuthRequest, res: ServerResponse): Promise<void>;
    clearCart(req: AuthRequest, res: ServerResponse): Promise<void>;
    mergeGuestCart(req: AuthRequest, res: ServerResponse): Promise<void>;
}
//# sourceMappingURL=CartController.d.ts.map