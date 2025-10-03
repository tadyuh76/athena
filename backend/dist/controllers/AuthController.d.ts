import { IncomingMessage, ServerResponse } from 'http';
import { AuthRequest } from '../middleware/auth';
export declare class AuthController {
    private authService;
    constructor();
    register(req: IncomingMessage, res: ServerResponse): Promise<void>;
    login(req: IncomingMessage, res: ServerResponse): Promise<void>;
    logout(_req: AuthRequest, res: ServerResponse): Promise<void>;
    forgotPassword(req: IncomingMessage, res: ServerResponse): Promise<void>;
    resetPassword(req: IncomingMessage, res: ServerResponse): Promise<void>;
    verifyOTP(req: IncomingMessage, res: ServerResponse): Promise<void>;
    resendVerification(req: IncomingMessage, res: ServerResponse): Promise<void>;
    googleAuth(req: IncomingMessage, res: ServerResponse): Promise<void>;
    createOAuthProfile(req: IncomingMessage, res: ServerResponse): Promise<void>;
    getMe(req: AuthRequest, res: ServerResponse): Promise<void>;
    updateMe(req: AuthRequest, res: ServerResponse): Promise<void>;
}
//# sourceMappingURL=AuthController.d.ts.map