export declare class NotificationService {
    private static transporter;
    static sendSms(phoneNumber: string, message: string): Promise<void>;
    static sendEmail(to: string, subject: string, htmlBody: string): Promise<void>;
    static getVerificationEmailTemplate(otpCode: string, expiryMinutes: number): string;
    static getPasswordResetTemplate(resetUrl: string): string;
}
