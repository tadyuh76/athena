import { IncomingMessage, ServerResponse } from "http";
export interface ParsedRequest extends IncomingMessage {
    body?: any;
    params?: Record<string, string>;
    query?: URLSearchParams;
}
export declare function parseBody(req: IncomingMessage): Promise<any>;
export declare function setCorsHeaders(res: ServerResponse): void;
export declare function sendJSON(res: ServerResponse, statusCode: number, data: any): void;
export declare function sendError(res: ServerResponse, statusCode: number, message: string): void;
export declare function parseUrl(req: IncomingMessage): {
    pathname: string;
    query: URLSearchParams;
};
export declare function matchRoute(pathname: string, pattern: string): Record<string, string> | null;
//# sourceMappingURL=request-handler.d.ts.map