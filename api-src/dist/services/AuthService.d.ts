import { User } from '../types/database.types';
export interface RegisterData {
    email: string;
    password: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
}
export interface LoginData {
    email: string;
    password: string;
}
export interface AuthResponse {
    success: boolean;
    user?: User;
    token?: string;
    error?: string;
    requiresVerification?: boolean;
    message?: string;
}
export declare class AuthService {
    private readonly jwtSecret;
    private readonly frontendUrl;
    constructor();
    private generateToken;
    register(data: RegisterData): Promise<AuthResponse>;
    login(data: LoginData): Promise<AuthResponse>;
    logout(): Promise<AuthResponse>;
    verifyToken(token: string): Promise<{
        valid: boolean;
        userId?: string;
    }>;
    getUser(userId: string): Promise<User | null>;
    updateUser(userId: string, updates: Partial<User>): Promise<AuthResponse>;
    forgotPassword(email: string): Promise<AuthResponse>;
    resetPassword(newPassword: string): Promise<AuthResponse>;
    resendVerificationEmail(email: string): Promise<AuthResponse>;
    verifyOTP(email: string, otp: string): Promise<AuthResponse>;
    googleAuth(): Promise<{
        url: string;
    }>;
    createOAuthProfile(userId: string, email: string, metadata: any): Promise<AuthResponse>;
}
//# sourceMappingURL=AuthService.d.ts.map