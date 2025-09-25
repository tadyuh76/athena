interface EmailTemplate {
    subject: string;
    html: string;
    text?: string;
}
export declare class EmailService {
    private readonly fromEmail;
    private readonly siteName;
    private readonly siteUrl;
    sendEmail(to: string, template: EmailTemplate): Promise<boolean>;
    getVerificationEmailTemplate(email: string, verificationToken: string, otp: string): EmailTemplate;
    getPasswordResetTemplate(email: string, resetToken: string, otp: string): EmailTemplate;
    getWelcomeEmailTemplate(name: string): EmailTemplate;
}
export declare const emailService: EmailService;
export {};
//# sourceMappingURL=EmailService.d.ts.map