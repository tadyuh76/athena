import { IncomingMessage, ServerResponse } from "http";
import { URL } from "url";
import { AuthService } from "../services/AuthService";
import { AuthRequest } from "../middleware/auth";
import { parseBody, sendJSON, sendError } from "../utils/request-handler";

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  async register(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.register(body);
      sendJSON(res, result.success ? 201 : 400, result);
    } catch (error) {
      sendError(res, 500, "Registration failed");
    }
  }

  async login(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.login(body);
      sendJSON(res, result.success ? 200 : 401, result);
    } catch (error) {
      sendError(res, 500, "Login failed");
    }
  }

  async logout(_req: AuthRequest, res: ServerResponse) {
    try {
      const result = await this.authService.logout();
      sendJSON(res, 200, result);
    } catch (error) {
      sendError(res, 500, "Logout failed");
    }
  }

  async forgotPassword(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.forgotPassword(body.email);
      sendJSON(res, result.success ? 200 : 400, result);
    } catch (error) {
      sendError(res, 500, "Password reset request failed");
    }
  }

  async resetPassword(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.resetPassword(body.password);
      sendJSON(res, result.success ? 200 : 400, result);
    } catch (error) {
      sendError(res, 500, "Password reset failed");
    }
  }

  async verifyOTP(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.verifyOTP(body.email, body.otp);
      sendJSON(res, result.success ? 200 : 400, result);
    } catch (error) {
      sendError(res, 500, "OTP verification failed");
    }
  }

  async resendVerification(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.resendVerificationEmail(body.email);
      sendJSON(res, result.success ? 200 : 400, result);
    } catch (error) {
      sendError(res, 500, "Failed to resend verification");
    }
  }

  async googleAuth(req: IncomingMessage, res: ServerResponse) {
    try {
      // Get the frontend URL from environment or use referer header as fallback
      // This handles both dev (port 3000) and production scenarios
      let frontendUrl = process.env.FRONTEND_URL;

      if (!frontendUrl) {
        // In development, use referer to get the actual frontend URL
        const referer = req.headers.referer || req.headers.origin;
        if (referer) {
          const refererUrl = new URL(referer);
          frontendUrl = `${refererUrl.protocol}//${refererUrl.host}`;
        } else {
          // Final fallback for local development
          frontendUrl = "http://localhost:3000";
        }
      }

      const redirectUrl = `${frontendUrl}/auth-callback.html`;

      // Debug logging
      console.log("Google Auth Debug:", {
        frontendUrl,
        redirectUrl,
        envFrontendUrl: process.env.FRONTEND_URL,
        vercelUrl: process.env.VERCEL_URL,
        referer: req.headers.referer,
        origin: req.headers.origin,
        host: req.headers.host,
      });

      const { url } = await this.authService.googleAuth(redirectUrl);
      res.writeHead(302, { Location: url });
      res.end();
    } catch (error) {
      sendError(res, 500, "Google auth failed");
    }
  }

  async createOAuthProfile(req: IncomingMessage, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.createOAuthProfile(
        body.user_id,
        body.email,
        body.metadata
      );
      sendJSON(res, result.success ? 200 : 400, result);
    } catch (error) {
      sendError(res, 500, "Failed to create OAuth profile");
    }
  }

  async getMe(req: AuthRequest, res: ServerResponse) {
    try {
      sendJSON(res, 200, { user: req.user });
    } catch (error) {
      sendError(res, 500, "Failed to get user info");
    }
  }

  async updateMe(req: AuthRequest, res: ServerResponse) {
    try {
      const body = await parseBody(req);
      const result = await this.authService.updateUser(req.userId!, body);
      sendJSON(res, result.success ? 200 : 400, result);
    } catch (error) {
      sendError(res, 500, "Failed to update user");
    }
  }
}
