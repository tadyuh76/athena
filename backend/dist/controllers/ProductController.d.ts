import { IncomingMessage, ServerResponse } from 'http';
export declare class ProductController {
    private productService;
    constructor();
    getProducts(req: IncomingMessage, res: ServerResponse): Promise<void>;
    getProductById(_req: IncomingMessage, res: ServerResponse, id: string): Promise<void>;
    getProductBySlug(_req: IncomingMessage, res: ServerResponse, slug: string): Promise<void>;
    getCategories(_req: IncomingMessage, res: ServerResponse): Promise<void>;
    getCollections(_req: IncomingMessage, res: ServerResponse): Promise<void>;
}
//# sourceMappingURL=ProductController.d.ts.map