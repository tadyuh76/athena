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
    frontendUrl;
    constructor() {
        this.frontendUrl =
            process.env.FRONTEND_URL ||
                (process.env.NODE_ENV === "development"
                    ? "http://localhost:3000"
                    : "https://ueh-athena.vercel.app");
        this.jwtSecret = process.env.JWT_SECRET || "default-jwt-secret";
    }
    generateToken(userId) {
        return jsonwebtoken_1.default.sign({ userId, type: "auth" }, this.jwtSecret, {
            expiresIn: "7d",
        });
    }
    async register(data) {
        try {
            const { email, password, first_name, last_name, phone } = data;
            const { data: authData, error: authError } = await supabase_1.supabase.auth.signUp({
                email,
                password,
                options: {
                    emailRedirectTo: `${this.frontendUrl}/auth-success.html`,
                    data: {
                        first_name,
                        last_name,
                        phone,
                    },
                },
            });
            if (authError) {
                throw authError;
            }
            if (!authData.user) {
                throw new Error("Failed to create user");
            }
            const { data: userProfile, error: profileError } = await supabase_1.supabaseAdmin
                .from("users")
                .insert({
                id: authData.user.id,
                email,
                email_verified: false,
                first_name,
                last_name,
                phone,
                status: "active",
                role: "customer",
            })
                .select()
                .single();
            if (profileError) {
                console.error("Profile creation error:", profileError);
            }
            const token = this.generateToken(authData.user.id);
            return {
                success: true,
                user: userProfile || undefined,
                token,
                requiresVerification: true,
                message: "Registration successful! Please check your email to verify your account.",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Registration failed",
            };
        }
    }
    async login(data) {
        try {
            const { email, password } = data;
            const { data: authData, error: authError } = await supabase_1.supabaseAdmin.auth.signInWithPassword({
                email,
                password,
            });
            if (authError) {
                console.error("Supabase login error:", authError);
                if (authError.message.includes("Invalid login credentials")) {
                    throw new Error("Invalid email or password");
                }
                throw authError;
            }
            if (!authData.user) {
                throw new Error("Invalid credentials");
            }
            let userProfile = await this.getUser(authData.user.id);
            if (!userProfile) {
                const { data: newProfile } = await supabase_1.supabaseAdmin
                    .from("users")
                    .insert({
                    id: authData.user.id,
                    email: authData.user.email,
                    email_verified: authData.user.email_confirmed_at !== null,
                    first_name: authData.user.user_metadata?.first_name || "",
                    last_name: authData.user.user_metadata?.last_name || "",
                    phone: authData.user.user_metadata?.phone || "",
                    status: "active",
                    role: "customer",
                })
                    .select()
                    .single();
                userProfile = newProfile;
            }
            await supabase_1.supabaseAdmin
                .from("users")
                .update({
                last_login_at: new Date().toISOString(),
                email_verified: authData.user.email_confirmed_at !== null,
            })
                .eq("id", authData.user.id);
            const token = this.generateToken(authData.user.id);
            return {
                success: true,
                user: userProfile || undefined,
                token,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Login failed",
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
                message: "Logged out successfully",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Logout failed",
            };
        }
    }
    async verifyToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.jwtSecret);
            console.log("Token verified successfully for userId:", decoded.userId);
            return { valid: true, userId: decoded.userId };
        }
        catch (error) {
            console.error("Token verification failed:", error);
            return { valid: false };
        }
    }
    async getUser(userId) {
        try {
            const { data: publicUser, error: publicError } = await supabase_1.supabaseAdmin
                .from("users")
                .select("*")
                .eq("id", userId)
                .single();
            if (!publicError && publicUser) {
                console.log("User fetched from public.users:", publicUser.email, "role:", publicUser.role);
                return publicUser;
            }
            const { data: authUser, error: authError } = await supabase_1.supabaseAdmin.auth.admin.getUserById(userId);
            if (!authError && authUser?.user) {
                const user = {
                    id: authUser.user.id,
                    email: authUser.user.email,
                    email_verified: authUser.user.email_confirmed_at !== null,
                    first_name: authUser.user.user_metadata?.first_name || "",
                    last_name: authUser.user.user_metadata?.last_name || "",
                    phone: authUser.user.phone || authUser.user.user_metadata?.phone || null,
                    status: "active",
                    role: "customer",
                    created_at: authUser.user.created_at,
                    updated_at: authUser.user.updated_at,
                    last_login_at: authUser.user.last_sign_in_at,
                    metadata: authUser.user.user_metadata || {},
                };
                console.log("User fetched from auth.users (fallback):", user.email, "role:", user.role);
                return user;
            }
            console.error("Failed to fetch user from both public.users and auth.users");
            return null;
        }
        catch (err) {
            console.error("Exception fetching user:", err);
            return null;
        }
    }
    async updateUser(userId, updates) {
        try {
            const { data, error } = await supabase_1.supabaseAdmin
                .from("users")
                .update(updates)
                .eq("id", userId)
                .select()
                .single();
            if (error) {
                throw error;
            }
            return {
                success: true,
                user: data,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Update failed",
            };
        }
    }
    async forgotPassword(email) {
        try {
            const { error } = await supabase_1.supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${this.frontendUrl}/reset-password.html`,
            });
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: "If an account exists with this email, you will receive password reset instructions.",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Password reset failed",
            };
        }
    }
    async resetPassword(newPassword) {
        try {
            const { error } = await supabase_1.supabase.auth.updateUser({
                password: newPassword,
            });
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: "Password has been reset successfully",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "Password reset failed",
            };
        }
    }
    async resendVerificationEmail(email) {
        try {
            const { error } = await supabase_1.supabase.auth.resend({
                type: "signup",
                email,
                options: {
                    emailRedirectTo: `${this.frontendUrl}/auth-success.html`,
                },
            });
            if (error) {
                throw error;
            }
            return {
                success: true,
                message: "Verification email has been resent",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to resend verification email",
            };
        }
    }
    async verifyOTP(email, otp) {
        try {
            const { data, error } = await supabase_1.supabase.auth.verifyOtp({
                email,
                token: otp,
                type: "email",
            });
            if (error) {
                throw error;
            }
            if (data.user) {
                await supabase_1.supabaseAdmin
                    .from("users")
                    .update({
                    email_verified: true,
                    status: "active",
                })
                    .eq("id", data.user.id);
                const userProfile = await this.getUser(data.user.id);
                const token = this.generateToken(data.user.id);
                return {
                    success: true,
                    user: userProfile || undefined,
                    token,
                    message: "Email verified successfully",
                };
            }
            return {
                success: false,
                error: "Invalid OTP",
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : "OTP verification failed",
            };
        }
    }
    async googleAuth(redirectUrl) {
        try {
            const finalRedirectUrl = redirectUrl || `${this.frontendUrl}/auth-callback.html`;
            console.log("AuthService.googleAuth Debug:", {
                providedRedirectUrl: redirectUrl,
                thisFrontendUrl: this.frontendUrl,
                finalRedirectUrl,
                envFrontendUrl: process.env.FRONTEND_URL,
                envVercelUrl: process.env.VERCEL_URL,
                envNodeEnv: process.env.NODE_ENV,
            });
            const { data, error } = await supabase_1.supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: finalRedirectUrl,
                    scopes: "email profile",
                },
            });
            if (error) {
                throw error;
            }
            return { url: data.url };
        }
        catch (error) {
            throw new Error(error instanceof Error ? error.message : "Google auth failed");
        }
    }
    async createOAuthProfile(userId, email, metadata) {
        try {
            const { data: userProfile, error: upsertError } = await supabase_1.supabaseAdmin
                .from("users")
                .upsert({
                id: userId,
                email: email,
                email_verified: true,
                first_name: metadata?.name?.split(" ")[0] || metadata?.given_name || "",
                last_name: metadata?.name?.split(" ").slice(1).join(" ") ||
                    metadata?.family_name ||
                    "",
                status: "active",
                role: "customer",
                last_login_at: new Date().toISOString(),
                metadata: {
                    auth_provider: "google",
                    avatar_url: metadata?.avatar_url || metadata?.picture || null,
                    full_name: metadata?.name || metadata?.full_name || null,
                },
            }, {
                onConflict: "id",
            })
                .select()
                .single();
            if (upsertError) {
                console.error("Failed to upsert OAuth profile:", upsertError);
                throw upsertError;
            }
            const token = this.generateToken(userId);
            return {
                success: true,
                user: userProfile || undefined,
                token,
            };
        }
        catch (error) {
            return {
                success: false,
                error: error instanceof Error
                    ? error.message
                    : "Failed to create OAuth profile",
            };
        }
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=AuthService.js.map