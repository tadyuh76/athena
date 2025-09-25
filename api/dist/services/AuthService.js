"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const supabase_1 = require("../utils/supabase");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
class AuthService {
    jwtSecret;
    constructor() {
        this.jwtSecret = process.env.JWT_SECRET || 'default-jwt-secret';
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: 'auth' }, this.jwtSecret, { expiresIn: '7d' });
    }
    async register(data) {
        try {
            const { email, password, first_name, last_name, phone } = data;
            const { data: authData, error: authError } = await supabase_1.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${process.env.FRONTEND_URL}/auth-success.html`,
                    data: {
                        first_name,
                        last_name,
                        phone
                    }
                }
            });
            if (authError) {
                throw authError;
            }
            if (!authData.user) {
                throw new Error('Failed to create user');
            }
            const { data: userProfile, error: profileError } = await supabase_1.supabaseAdmin
                .from('users')
                .insert({
                id: authData.user.id,
                email,
                email_verified: false,
                first_name,
                last_name,
                phone,
                status: 'active',
                role: 'customer'
            })
                .select()
                .single();
            if (profileError) {
                console.error('Profile creation error:', profileError);
            }
            const token = this.generateToken(authData.user.id);
            return {
                success: true,
                user: userProfile || undefined,
                token,
                requiresVerification: true,
                message: 'Registration successful! Please check your email to verify your account.'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Registration failed'
            };
        }
    }
    async login(data) {
        try {
            const { email, password } = data;
            const { data: authData, error: authError } = await supabase_1.supabase.auth.signInWithPassword({
                email,
                password
            });
            if (authError) {
                throw authError;
            }
            if (!authData.user) {
                throw new Error('Invalid credentials');
            }
            let userProfile = await this.getUser(authData.user.id);
            if (!userProfile) {
                const { data: newProfile } = await supabase_1.supabaseAdmin
                    .from('users')
                    .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    email_verified: authData.user.email_confirmed_at !== null,
                    first_name: authData.user.user_metadata?.first_name || '',
                    last_name: authData.user.user_metadata?.last_name || '',
                    phone: authData.user.user_metadata?.phone || '',
                    status: 'active',
                    role: 'customer'
                })
                    .select()
                    .single();
                userProfile = newProfile;
            }
            await supabase_1.supabaseAdmin
                .from('users')
                .update({
                last_login_at: new Date().toISOString(),
                email_verified: authData.user.email_confirmed_at !== null
            })
                .eq('id', authData.user.id);
            const token = this.generateToken(authData.user.id);
            return {
                success: true,
                user: userProfile || undefined,
                token
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Login failed'
            };
        }
    }
    async logout() {
        try {
            const { error } = await supabase_1.supabase.auth.signOut();
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: 'Logged out successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Logout failed'
            };
        }
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            return { valid: true, userId: decoded.userId };
        }
        catch {
            return { valid: false };
        }
    }
    async getUser(userId) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();
            if (error) {
                return null;
            }
            return data;
        }
        catch {
            return null;
        }
    }
    async updateUser(userId, updates) {
        try {
            const { data, error } = await supabase_1.supabase
                .from('users')
                .update(updates)
                .eq('id', userId)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return {
                success: true,
                user: data
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Update failed'
            };
        }
    }
    async forgotPassword(email) {
        try {
            const { error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${process.env.FRONTEND_URL}/reset-password.html`,
            });
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: 'If an account exists with this email, you will receive password reset instructions.'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Password reset failed'
            };
        }
    }
    async resetPassword(newPassword) {
        try {
            const { error } = await supabase_1.supabase.auth.updateUser({
                password: newPassword
            });
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: 'Password has been reset successfully'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Password reset failed'
            };
        }
    }
    async resendVerificationEmail(email) {
        try {
            const { error } = await supabase_1.supabase.auth.resend({
                type: 'signup',
                email,
                options: {
                    emailRedirectTo: `${process.env.FRONTEND_URL}/auth-success.html`
                }
            });
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: 'Verification email has been resent'
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to resend verification email'
            };
        }
    }
    async googleAuth() {
        try {
            const { data, error } = await supabase_1.supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${process.env.FRONTEND_URL}/auth-success.html`,
                    scopes: 'email profile'
                }
            });
            if (error) {
                throw error;
            }
            return { url: data.url };
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : 'Google auth failed');
        }
    }
    async handleOAuthCallback() {
        try {
            const { data: { session }, error } = await supabase_1.supabase.auth.getSession();
            if (error || !session) {
                throw new Error('No session found');
            }
            const user = session.user;
            let userProfile = await this.getUser(user.id);
            if (!userProfile) {
                const { data: newProfile } = await supabase_1.supabaseAdmin
                    .from('users')
                    .insert({
                    id: user.id,
                    email: user.email,
                    email_verified: true,
                    first_name: user.user_metadata?.full_name?.split(' ')[0] || '',
                    last_name: user.user_metadata?.full_name?.split(' ').slice(1).join(' ') || '',
                    status: 'active',
                    role: 'customer',
                    metadata: {
                        auth_provider: user.app_metadata?.provider || 'google',
                        avatar_url: user.user_metadata?.avatar_url || null
                    }
                })
                    .select()
                    .single();
                userProfile = newProfile;
            }
            await supabase_1.supabaseAdmin
                .from('users')
                .update({ last_login_at: new Date().toISOString() })
                .eq('id', user.id);
            const token = this.generateToken(user.id);
            return {
                success: true,
                user: userProfile || undefined,
                token
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'OAuth callback failed'
            };
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map