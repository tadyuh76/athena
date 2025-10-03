"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const url_1 = require("url");
const AuthService_1 = require("../services/AuthService");
const request_handler_1 = require("../utils/request-handler");
class AuthController {
    authService;
    constructor() {
        this.authService = new AuthService_1.AuthService();
    }
    async register(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.register(body);
            (0, request_handler_1.sendJSON)(res, result.success ? 201 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Registration failed");
        }
    }
    async login(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.login(body);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 401, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Login failed");
        }
    }
    async logout(_req, res) {
        try {
            const result = await this.authService.logout();
            (0, request_handler_1.sendJSON)(res, 200, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Logout failed");
        }
    }
    async forgotPassword(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.forgotPassword(body.email);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Password reset request failed");
        }
    }
    async resetPassword(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.resetPassword(body.password);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Password reset failed");
        }
    }
    async verifyOTP(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.verifyOTP(body.email, body.otp);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "OTP verification failed");
        }
    }
    async resendVerification(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.resendVerificationEmail(body.email);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Failed to resend verification");
        }
    }
    async googleAuth(req, res) {
        try {
            let frontendUrl = process.env.FRONTEND_URL;
            if (!frontendUrl) {
                const referer = req.headers.referer || req.headers.origin;
                if (referer) {
                    const refererUrl = new url_1.URL(referer);
                    frontendUrl = `${refererUrl.protocol}//${refererUrl.host}`;
                }
                else {
                    frontendUrl = "http://localhost:3000";
                }
            }
            const redirectUrl = `${frontendUrl}/auth-callback.html`;
            console.log('Google Auth Debug:', {
                frontendUrl,
                redirectUrl,
                envFrontendUrl: process.env.FRONTEND_URL,
                vercelUrl: process.env.VERCEL_URL,
                referer: req.headers.referer,
                origin: req.headers.origin,
                host: req.headers.host
            });
            const { url } = await this.authService.googleAuth(redirectUrl);
            res.writeHead(302, { Location: url });
            res.end();
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Google auth failed");
        }
    }
    async createOAuthProfile(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.createOAuthProfile(body.user_id, body.email, body.metadata);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Failed to create OAuth profile");
        }
    }
    async getMe(req, res) {
        try {
            (0, request_handler_1.sendJSON)(res, 200, { user: req.user });
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Failed to get user info");
        }
    }
    async updateMe(req, res) {
        try {
            const body = await (0, request_handler_1.parseBody)(req);
            const result = await this.authService.updateUser(req.userId, body);
            (0, request_handler_1.sendJSON)(res, result.success ? 200 : 400, result);
        }
        catch (error) {
            (0, request_handler_1.sendError)(res, 500, "Failed to update user");
        }
    }
}
exports.AuthController = AuthController;
//# sourceMappingURL=AuthController.js.map