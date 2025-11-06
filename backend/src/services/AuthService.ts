import { supabase, supabaseAdmin } from "../utils/supabase";
import { User } from "../types/database.types";
import jwt from "jsonwebtoken";

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

export class AuthService {
  private readonly jwtSecret: string;
  private readonly frontendUrl: string;

  constructor() {
    // Determine frontend URL based on environment
    // VERCEL_URL is automatically set by Vercel in production
    this.frontendUrl =
      process.env.FRONTEND_URL ||
      (process.env.NODE_ENV === "development"
        ? "http://localhost:3000"
        : "https://ueh-athena.vercel.app");

    // JWT_SECRET is required - fail fast if not provided
    if (!process.env.JWT_SECRET) {
      throw new Error(
        'JWT_SECRET environment variable is required but not set. ' +
        'Please set a strong random secret in your .env file.'
      );
    }
    this.jwtSecret = process.env.JWT_SECRET;
  }

  private generateToken(userId: string): string {
    return jwt.sign({ userId, type: "auth" }, this.jwtSecret, {
      expiresIn: "7d",
    });
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      const { email, password, first_name, last_name, phone } = data;

      // Create user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
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
        throw new Error("Không thể tạo người dùng");
      }

      // Create user profile in public.users table
      const { data: userProfile, error: profileError } = await supabaseAdmin
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
        // Don't rollback - Supabase will send verification email
      }

      // Generate JWT token
      const token = this.generateToken(authData.user.id);

      return {
        success: true,
        user: userProfile || undefined,
        token,
        requiresVerification: true,
        message:
          "Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản của bạn.",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đăng ký thất bại",
      };
    }
  }

  async login(data: LoginData): Promise<AuthResponse> {
    try {
      const { email, password } = data;

      // Sign in with Supabase Auth
      const { data: authData, error: authError } =
        await supabaseAdmin.auth.signInWithPassword({
          email,
          password,
        });

      if (authError) {
        console.error("Supabase login error:", authError);
        // Provide more specific error messages
        if (authError.message.includes("Invalid login credentials")) {
          throw new Error("Email hoặc mật khẩu không hợp lệ");
        }
        throw authError;
      }

      if (!authData.user) {
        throw new Error("Thông tin đăng nhập không hợp lệ");
      }

      // Get or create user profile
      let userProfile = await this.getUser(authData.user.id);

      if (!userProfile) {
        // Create profile if it doesn't exist (for users who signed up via OAuth)
        const { data: newProfile } = await supabaseAdmin
          .from("users")
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
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

      // Update last login timestamp
      await supabaseAdmin
        .from("users")
        .update({
          last_login_at: new Date().toISOString(),
          email_verified: authData.user.email_confirmed_at !== null,
        })
        .eq("id", authData.user.id);

      // Generate JWT token
      const token = this.generateToken(authData.user.id);

      return {
        success: true,
        user: userProfile || undefined,
        token,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đăng nhập thất bại",
      };
    }
  }

  async logout(): Promise<AuthResponse> {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: "Đăng xuất thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đăng xuất thất bại",
      };
    }
  }

  async verifyToken(
    token: string
  ): Promise<{ valid: boolean; userId?: string }> {
    try {
      const decoded = jwt.verify(token, this.jwtSecret) as { userId: string };
      console.log("Token verified successfully for userId:", decoded.userId);
      return { valid: true, userId: decoded.userId };
    } catch (error) {
      console.error("Token verification failed:", error);
      return { valid: false };
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      // Get user from public.users table (has role field)
      const { data: publicUser, error: publicError } =
        await supabaseAdmin
          .from("users")
          .select("*")
          .eq("id", userId)
          .single();

      if (!publicError && publicUser) {
        console.log("User fetched from public.users:", publicUser.email, "role:", publicUser.role);
        return publicUser;
      }

      // Fallback: Try to get from auth.users if not found in public.users
      const { data: authUser, error: authError } =
        await supabaseAdmin.auth.admin.getUserById(userId);

      if (!authError && authUser?.user) {
        // Create a user object from auth data with default customer role
        const user: any = {
          id: authUser.user.id,
          email: authUser.user.email!,
          email_verified: authUser.user.email_confirmed_at !== null,
          first_name: authUser.user.user_metadata?.first_name || "",
          last_name: authUser.user.user_metadata?.last_name || "",
          phone:
            authUser.user.phone || authUser.user.user_metadata?.phone || null,
          status: "active",
          role: "customer", // Always default to customer for auth-only users
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
    } catch (err) {
      console.error("Exception fetching user:", err);
      return null;
    }
  }

  async updateUser(
    userId: string,
    updates: Partial<User>
  ): Promise<AuthResponse> {
    try {
      const { data, error } = await supabaseAdmin
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
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Cập nhật thất bại",
      };
    }
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    try {
      // Use Supabase's built-in password reset
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${this.frontendUrl}/reset-password.html`,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message:
          "Nếu tài khoản với email này tồn tại, bạn sẽ nhận được hướng dẫn đặt lại mật khẩu.",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại",
      };
    }
  }

  async resetPassword(newPassword: string): Promise<AuthResponse> {
    try {
      // This will be called after user clicks the link in email
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw error;
      }

      return {
        success: true,
        message: "Mật khẩu đã được đặt lại thành công",
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Đặt lại mật khẩu thất bại",
      };
    }
  }

  async resendVerificationEmail(email: string): Promise<AuthResponse> {
    try {
      // Resend verification email using Supabase
      const { error } = await supabase.auth.resend({
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
        message: "Email xác thực đã được gửi lại",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Gửi lại email xác thực thất bại",
      };
    }
  }

  async verifyOTP(email: string, otp: string): Promise<AuthResponse> {
    try {
      // Verify OTP using Supabase
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: "email",
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        // Update user as verified in our database
        await supabaseAdmin
          .from("users")
          .update({
            email_verified: true,
            status: "active",
          })
          .eq("id", data.user.id);

        // Get user profile
        const userProfile = await this.getUser(data.user.id);
        const token = this.generateToken(data.user.id);

        return {
          success: true,
          user: userProfile || undefined,
          token,
          message: "Email đã được xác thực thành công",
        };
      }

      return {
        success: false,
        error: "Mã OTP không hợp lệ",
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Xác thực OTP thất bại",
      };
    }
  }

  async googleAuth(redirectUrl?: string): Promise<{ url: string }> {
    try {
      // Use provided redirect URL or fall back to default
      const finalRedirectUrl =
        redirectUrl || `${this.frontendUrl}/auth-callback.html`;

      console.log("AuthService.googleAuth Debug:", {
        providedRedirectUrl: redirectUrl,
        thisFrontendUrl: this.frontendUrl,
        finalRedirectUrl,
        envFrontendUrl: process.env.FRONTEND_URL,
        envVercelUrl: process.env.VERCEL_URL,
        envNodeEnv: process.env.NODE_ENV,
      });

      const { data, error } = await supabase.auth.signInWithOAuth({
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
    } catch (error) {
      throw new Error(
        error instanceof Error ? error.message : "Xác thực Google thất bại"
      );
    }
  }

  async createOAuthProfile(
    userId: string,
    email: string,
    metadata: any
  ): Promise<AuthResponse> {
    try {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      let userProfile;

      if (existingUser) {
        // User exists - only update login timestamp and metadata, preserve role
        const { data, error: updateError } = await supabaseAdmin
          .from("users")
          .update({
            email_verified: true, // OAuth emails are pre-verified
            last_login_at: new Date().toISOString(),
            metadata: {
              ...existingUser.metadata,
              auth_provider: "google",
              avatar_url: metadata?.avatar_url || metadata?.picture || null,
              full_name: metadata?.name || metadata?.full_name || null,
            },
          })
          .eq("id", userId)
          .select()
          .single();

        if (updateError) {
          console.error("Failed to update OAuth profile:", updateError);
          throw updateError;
        }

        userProfile = data;
      } else {
        // New user - create profile with customer role
        const { data, error: insertError } = await supabaseAdmin
          .from("users")
          .insert({
            id: userId,
            email: email,
            email_verified: true, // OAuth emails are pre-verified
            first_name:
              metadata?.name?.split(" ")[0] || metadata?.given_name || "",
            last_name:
              metadata?.name?.split(" ").slice(1).join(" ") ||
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
          })
          .select()
          .single();

        if (insertError) {
          console.error("Failed to create OAuth profile:", insertError);
          throw insertError;
        }

        userProfile = data;
      }

      const token = this.generateToken(userId);

      return {
        success: true,
        user: userProfile || undefined,
        token,
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Không thể tạo hồ sơ OAuth",
      };
    }
  }
}
