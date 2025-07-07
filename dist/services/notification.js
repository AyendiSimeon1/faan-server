"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const nodemailer_1 = __importDefault(require("nodemailer"));
class NotificationService {
    static sendSms(phoneNumber, message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[SMS] To: ${phoneNumber}, Message: ${message}`);
            // TODO: Integrate with SMS Gateway (Twilio, Termii, etc.)
        });
    }
    static sendEmail(to, subject, htmlBody) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const mailOptions = {
                    from: process.env.EMAIL_FROM || 'aqqutelabs@gmail.com',
                    to,
                    subject,
                    html: htmlBody,
                };
                yield this.transporter.sendMail(mailOptions);
                console.log(`[Email] Successfully sent to: ${to}`);
            }
            catch (error) {
                console.error('[Email] Error sending email:', error);
                throw error;
            }
        });
    }
    static getVerificationEmailTemplate(otpCode, expiryMinutes) {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Verify Your Email Address</h2>
        <p>Thank you for registering with FAAN Parking. Please use the verification code below to complete your registration:</p>
        <div style="background-color: #f4f4f4; padding: 15px; text-align: center; font-size: 24px; letter-spacing: 5px; margin: 20px 0;">
          <strong>${otpCode}</strong>
        </div>
        <p>This code will expire in ${expiryMinutes} minutes.</p>
        <p>If you did not request this verification, please ignore this email.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `;
    }
    static getPasswordResetTemplate(resetUrl) {
        return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Reset Your Password</h2>
        <p>You have requested to reset your password. Click the button below to set a new password:</p>
        <div style="text-align: center; margin: 20px 0;">
          <a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
            Reset Password
          </a>
        </div>
        <p>If you did not request this password reset, please ignore this email.</p>
        <p>This link will expire in 10 minutes.</p>
        <hr style="margin: 20px 0;">
        <p style="color: #666; font-size: 12px;">This is an automated message, please do not reply.</p>
      </div>
    `;
    }
}
exports.NotificationService = NotificationService;
NotificationService.transporter = nodemailer_1.default.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
        user: process.env.SMTP_USER || 'aqqutelabs@gmail.com',
        pass: process.env.SMTP_PASS || 'nimoepfczcgawawf',
    },
});
//# sourceMappingURL=notification.js.map