"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emailService = exports.EmailService = void 0;
const supabase_1 = require("../utils/supabase");
class EmailService {
  fromEmail = "noreply@athena.com";
  siteName = "Athena";
  siteUrl = process.env.FRONTEND_URL || "http://localhost:3000";
  async sendEmail(to, template) {
    try {
      console.log("📧 Email sent:", {
        to,
        from: this.fromEmail,
        subject: template.subject,
        preview: template.text?.substring(0, 100),
      });
      await supabase_1.supabaseAdmin.from("email_logs").insert({
        to_email: to,
        subject: template.subject,
        sent_at: new Date().toISOString(),
        status: "sent",
      });
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }
  getVerificationEmailTemplate(email, verificationToken, otp) {
    const verificationLink = `${
      this.siteUrl
    }/verify-email?token=${verificationToken}&email=${encodeURIComponent(
      email
    )}`;
    return {
      subject: `Welcome to ${this.siteName} - Verify Your Email`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Work Sans', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { background: white; padding: 40px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 14px 30px; background: #0f4c2f; color: white; 
                     text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .otp-box { background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; 
                      margin: 30px 0; }
            .otp-code { font-size: 32px; letter-spacing: 8px; color: #1f2937; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .divider { border-bottom: 1px solid #e5e7eb; margin: 30px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Athena</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Premium Eco Fashion</p>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; font-weight: 400;">Verify Your Email Address</h2>
              
              <p>Thank you for creating an account with Athena. To complete your registration and access 
              exclusive sustainable luxury fashion, please verify your email address.</p>
              
              <h3 style="color: #1f2937;">Option 1: Click the Verification Link</h3>
              <div style="text-align: center;">
                <a href="${verificationLink}" class="button">Verify Email Address</a>
              </div>
              
              <div class="divider"></div>
              
              <h3 style="color: #1f2937;">Option 2: Enter Verification Code</h3>
              <p>Alternatively, you can enter this 6-digit code on the verification page:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                  This code expires in 1 hour
                </p>
              </div>
              
              <div class="divider"></div>
              
              <h3 style="color: #1f2937;">Why Verify?</h3>
              <ul style="color: #6b7280;">
                <li>Secure your account and protect your personal information</li>
                <li>Access exclusive member benefits and early collection previews</li>
                <li>Save items to your wishlist and track orders</li>
                <li>Receive personalized sustainable fashion recommendations</li>
              </ul>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                If you didn't create an account with Athena, please ignore this email or contact our 
                support team if you have concerns.
              </p>
            </div>
            <div class="footer">
              <p>© 2024 Athena. Designed to Endure.</p>
              <p>Questions? Contact us at support@athena.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Athena - Verify Your Email
        
        Thank you for creating an account. Please verify your email address:
        
        Verification Link: ${verificationLink}
        
        Or use this verification code: ${otp}
        
        This code expires in 1 hour.
        
        If you didn't create an account, please ignore this email.
      `,
    };
  }
  getPasswordResetTemplate(email, resetToken, otp) {
    const resetLink = `${
      this.siteUrl
    }/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    return {
      subject: `${this.siteName} - Reset Your Password`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Work Sans', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 28px; font-weight: 300; }
            .content { background: white; padding: 40px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 14px 30px; background: #0f4c2f; color: white; 
                     text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .otp-box { background: #f1f5f9; padding: 20px; border-radius: 8px; text-align: center; 
                      margin: 30px 0; }
            .otp-code { font-size: 32px; letter-spacing: 8px; color: #1f2937; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
            .warning { background: #fef2f2; border: 1px solid #fee2e2; padding: 15px; 
                      border-radius: 4px; color: #991b1b; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Password Reset Request</h1>
              <p style="margin: 10px 0 0 0; opacity: 0.9;">Athena Account Security</p>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; font-weight: 400;">Reset Your Password</h2>
              
              <p>We received a request to reset the password for your Athena account associated with 
              ${email}.</p>
              
              <h3 style="color: #1f2937;">Option 1: Click the Reset Link</h3>
              <div style="text-align: center;">
                <a href="${resetLink}" class="button">Reset Password</a>
              </div>
              
              <h3 style="color: #1f2937;">Option 2: Use Reset Code</h3>
              <p>You can also use this code on the password reset page:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <p style="margin: 10px 0 0 0; color: #6b7280; font-size: 14px;">
                  This code expires in 30 minutes
                </p>
              </div>
              
              <div class="warning">
                <strong>Security Notice:</strong> If you didn't request this password reset, 
                please secure your account immediately and contact our support team.
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                For security reasons, this link will expire in 30 minutes. If you need a new 
                reset link, please visit the forgot password page again.
              </p>
            </div>
            <div class="footer">
              <p>© 2024 Athena. Secure & Sustainable.</p>
              <p>Need help? Contact support@athena.com</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Password Reset Request - Athena
        
        We received a request to reset your password.
        
        Reset Link: ${resetLink}
        
        Or use this reset code: ${otp}
        
        This code expires in 30 minutes.
        
        If you didn't request this, please secure your account immediately.
      `,
    };
  }
  getWelcomeEmailTemplate(name) {
    return {
      subject: `Welcome to ${this.siteName} - Your Journey Begins`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Work Sans', Arial, sans-serif; line-height: 1.6; color: #1f2937; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #1f2937; color: white; padding: 40px; text-align: center; }
            .header h1 { margin: 0; font-size: 32px; font-weight: 300; }
            .content { background: white; padding: 40px; border: 1px solid #e5e7eb; }
            .button { display: inline-block; padding: 14px 30px; background: #0f4c2f; color: white; 
                     text-decoration: none; border-radius: 4px; margin: 20px 0; }
            .feature { display: flex; align-items: center; margin: 20px 0; }
            .feature-icon { font-size: 24px; margin-right: 15px; color: #0f4c2f; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to Athena</h1>
              <p style="margin: 15px 0 0 0; font-size: 18px; opacity: 0.9;">
                ${name ? `Dear ${name}` : "Dear Valued Member"}
              </p>
            </div>
            <div class="content">
              <h2 style="color: #1f2937; font-weight: 400;">Your Account is Verified!</h2>
              
              <p>Congratulations! Your email has been verified and you now have full access to your 
              Athena account. Welcome to our community of conscious fashion enthusiasts.</p>
              
              <h3 style="color: #1f2937; margin-top: 30px;">What's Next?</h3>
              
              <div class="feature">
                <span class="feature-icon">👗</span>
                <div>
                  <strong>Explore Our Collections</strong><br>
                  Discover our latest sustainable luxury pieces
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">♥️</span>
                <div>
                  <strong>Create Your Wishlist</strong><br>
                  Save your favorite items for later
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">🌿</span>
                <div>
                  <strong>Learn Our Story</strong><br>
                  Read about our commitment to sustainability
                </div>
              </div>
              
              <div class="feature">
                <span class="feature-icon">✨</span>
                <div>
                  <strong>Exclusive Member Benefits</strong><br>
                  Early access to new collections and special offers
                </div>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${
                  this.siteUrl
                }/products.html" class="button">Start Shopping</a>
              </div>
              
              <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                Thank you for choosing Athena. We're excited to be part of your sustainable 
                fashion journey.
              </p>
            </div>
            <div class="footer">
              <p>© 2024 Athena. Premium Eco Fashion.</p>
              <p>Follow us on social media for style inspiration and updates</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Welcome to Athena!
        
        ${name ? `Dear ${name},` : "Dear Valued Member,"}
        
        Your account has been verified! You now have full access to:
        
        - Explore our sustainable luxury collections
        - Create and manage your wishlist
        - Track your orders
        - Access exclusive member benefits
        
        Start shopping: ${this.siteUrl}/products.html
        
        Thank you for joining Athena.
      `,
    };
  }
}
exports.EmailService = EmailService;
exports.emailService = new EmailService();
//# sourceMappingURL=EmailService.js.map
