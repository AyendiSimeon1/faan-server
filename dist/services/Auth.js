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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const crypto_1 = __importDefault(require("crypto"));
const mongoose_1 = __importDefault(require("mongoose"));
const AuthToken_1 = __importDefault(require("../models/AuthToken"));
const Otp_1 = __importDefault(require("../models/Otp"));
const User_1 = __importDefault(require("../models/User"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const common_1 = require("../types/common");
const AppError_1 = __importDefault(require("../utils/AppError"));
const Jwt_1 = require("../utils/Jwt");
const notification_1 = require("./notification");
const OTP_EXPIRY_MINUTES = 5;
// Generates a secure 6-digit OTP code as a string using crypto
function generateOtpCode() {
    return crypto_1.default.randomInt(100000, 999999).toString().padStart(6, '0');
}
class AuthService {
    static createAuthTokens(user) {
        return __awaiter(this, void 0, void 0, function* () {
            const userId = user._id.toString();
            const accessTokenPayload = { userId, role: user.role };
            const refreshTokenPayload = { userId };
            const accessToken = (0, Jwt_1.signToken)(accessTokenPayload);
            const refreshToken = (0, Jwt_1.signRefreshToken)(refreshTokenPayload);
            const hashedRefreshToken = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
            yield AuthToken_1.default.create({
                userId: user._id,
                token: hashedRefreshToken,
                expiresAt,
            });
            return { accessToken, refreshToken };
        });
    }
    static generateAndSendOtp(identifier, type, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[OTP] Generating OTP for ${type} - Identifier: ${identifier}, UserId: ${userId || 'none'}`);
            const otpCode = generateOtpCode();
            console.log(`[OTP] Generated code for ${identifier}`);
            const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
            console.log(`[OTP] Expiry set to ${expiresAt.toISOString()}`);
            try {
                const otp = yield Otp_1.default.create({
                    identifier,
                    code: otpCode,
                    type: type,
                    expiresAt,
                    userId: userId ? new mongoose_1.default.Types.ObjectId(userId) : undefined,
                });
                console.log(`[OTP] Saved to database with ID: ${otp._id}`);
                if (type === common_1.OtpType.EMAIL_VERIFICATION) {
                    console.log(`[OTP] Sending verification email to ${identifier}`);
                    yield notification_1.NotificationService.sendEmail(identifier, 'Verify Your Email - FAAN Parking', notification_1.NotificationService.getVerificationEmailTemplate(otpCode, OTP_EXPIRY_MINUTES));
                    console.log(`[OTP] Verification email sent successfully to ${identifier}`);
                }
            }
            catch (error) {
                console.error(`[OTP] Error in generateAndSendOtp:`, error);
                throw error;
            }
        });
    }
    static signUp(signUpDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { name, email, phoneNumber, password_field, registrationLocation } = signUpDto;
            const existingUserByEmail = yield User_1.default.findOne({ email });
            if (existingUserByEmail) {
                throw new AppError_1.default('User with this email already exists', 409);
            }
            const newUser = yield User_1.default.create({
                name,
                email,
                phoneNumber: phoneNumber || undefined,
                password: password_field,
                registrationLocation,
                role: common_1.UserRole.USER,
                isVerified: false,
            });
            // Create a wallet for the new user
            const wallet = yield Wallet_1.default.create({ userId: newUser._id, balance: 0, currency: 'NGN' });
            newUser.walletId = wallet._id;
            yield newUser.save();
            // Send email verification OTP
            yield this.generateAndSendOtp(email, common_1.OtpType.EMAIL_VERIFICATION, newUser._id.toString());
            const tokens = yield this.createAuthTokens(newUser);
            const _a = newUser.toObject(), { password } = _a, userResponse = __rest(_a, ["password"]);
            return { user: userResponse, tokens };
        });
    }
    static signIn(email, password_field) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne({ email }).select('+password');
            if (!user || !(yield user.comparePassword(password_field))) {
                throw new AppError_1.default('Incorrect email or password', 401);
            }
            if (!user.isVerified) {
                // Resend OTP if not verified
                yield this.generateAndSendOtp(user.email, common_1.OtpType.EMAIL_VERIFICATION, user._id.toString());
                throw new AppError_1.default('Account not verified. A verification code has been sent to your email.', 403);
            }
            if (!user.isActive) {
                throw new AppError_1.default('Your account is inactive. Please contact support.', 403);
            }
            const tokens = yield this.createAuthTokens(user);
            user.lastLogin = new Date();
            yield user.save();
            const _a = user.toObject(), { password } = _a, userResponse = __rest(_a, ["password"]);
            return { user: userResponse, tokens };
        });
    }
    static verifyOtp(verifyOtpDto, otpType) {
        return __awaiter(this, void 0, void 0, function* () {
            const { identifier, otpCode } = verifyOtpDto;
            console.log(`[OTP Verify] Attempting to verify OTP for ${otpType} - Identifier: ${identifier}`);
            const otpEntry = yield Otp_1.default.findOne({
                identifier,
                code: otpCode,
                type: otpType,
                isUsed: false,
                expiresAt: { $gt: new Date() },
            });
            if (!otpEntry) {
                console.log(`[OTP Verify] Invalid or expired OTP attempt for ${identifier}`);
                // Find the OTP to provide more specific debugging information
                const existingOtp = yield Otp_1.default.findOne({ identifier, code: otpCode });
                if (existingOtp) {
                    console.log(`[OTP Verify] Found matching OTP but:
          Used: ${existingOtp.isUsed}
          Expired: ${existingOtp.expiresAt < new Date()}
          Type matches: ${existingOtp.type === otpType}`);
                }
                else {
                    console.log(`[OTP Verify] No matching OTP found for the given code`);
                }
                throw new AppError_1.default('Invalid or expired verification code.', 400);
            }
            console.log(`[OTP Verify] Valid OTP found for ${identifier}, marking as used`);
            otpEntry.isUsed = true;
            yield otpEntry.save();
            if (otpType === common_1.OtpType.EMAIL_VERIFICATION && otpEntry.userId) {
                const user = yield User_1.default.findById(otpEntry.userId);
                if (user) {
                    user.isVerified = true;
                    yield user.save();
                    const _a = user.toObject(), { password } = _a, userResponse = __rest(_a, ["password"]);
                    return { message: 'Email verified successfully.', user: userResponse };
                }
            }
            return { message: 'Verification successful.' };
        });
    }
    static resendOtp(identifier, otpType) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[OTP Resend] Request to resend OTP for ${otpType} to ${identifier}`);
            // Check for recent OTPs to implement basic rate limiting
            const recentOtp = yield Otp_1.default.findOne({
                identifier,
                type: otpType,
                createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Last minute
            });
            if (recentOtp) {
                console.log(`[OTP Resend] Rate limit: Recent OTP found for ${identifier}, created at ${recentOtp.createdAt}`);
                throw new AppError_1.default('Please wait 1 minute before requesting another code.', 429);
            }
            const user = yield User_1.default.findOne({ email: identifier });
            if (!user) {
                console.log(`[OTP Resend] User not found for identifier: ${identifier}`);
                throw new AppError_1.default('User not found.', 404);
            }
            console.log(`[OTP Resend] User found, generating new OTP for ${identifier}`);
            yield this.generateAndSendOtp(identifier, otpType, user._id.toString());
            console.log(`[OTP Resend] Successfully generated and sent new OTP to ${identifier}`);
            return { message: `A new verification code has been sent to ${identifier}.` };
        });
    }
    static forgotPassword(forgotPasswordDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield User_1.default.findOne({ email: forgotPasswordDto.email });
            if (!user) {
                // Still send a success-like message to prevent email enumeration
                return { message: 'If your email is registered, you will receive a password reset link.' };
            }
            const resetToken = crypto_1.default.randomBytes(32).toString('hex');
            user.passwordResetToken = crypto_1.default.createHash('sha256').update(resetToken).digest('hex');
            user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
            yield user.save();
            try {
                // Send email with resetToken (the unhashed one)
                const resetURL = `http://localhost:3000/reset-password/${resetToken}`;
                yield notification_1.NotificationService.sendEmail(user.email, 'Password Reset Request - FAAN Parking', notification_1.NotificationService.getPasswordResetTemplate(resetURL));
                return { message: 'If your email is registered, you will receive a password reset link.' };
            }
            catch (error) {
                console.error("Error sending password reset email:", error);
                user.passwordResetToken = undefined;
                user.passwordResetExpires = undefined;
                yield user.save();
                throw new AppError_1.default('There was an error sending the password reset email. Please try again.', 500);
            }
        });
    }
    static resetPassword(resetPasswordDto) {
        return __awaiter(this, void 0, void 0, function* () {
            const { token, newPassword_field } = resetPasswordDto;
            const hashedToken = crypto_1.default.createHash('sha256').update(token).digest('hex');
            const user = yield User_1.default.findOne({
                passwordResetToken: hashedToken,
                passwordResetExpires: { $gt: Date.now() },
            }).select('+password');
            if (!user) {
                throw new AppError_1.default('Password reset token is invalid or has expired.', 400);
            }
            user.password = newPassword_field;
            user.passwordResetToken = undefined;
            user.passwordResetExpires = undefined;
            user.isVerified = true; // Often, resetting password implies verification
            yield user.save();
            return { message: 'Password has been reset successfully.' };
        });
    }
    static refreshToken(oldRefreshToken) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedOldRefreshToken = crypto_1.default.createHash('sha256').update(oldRefreshToken).digest('hex');
            const tokenDoc = yield AuthToken_1.default.findOneAndDelete({ token: hashedOldRefreshToken });
            if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
                throw new AppError_1.default('Invalid or expired refresh token', 401);
            }
            const user = yield User_1.default.findById(tokenDoc.userId);
            if (!user || !user.isActive) {
                throw new AppError_1.default('User not found or inactive', 401);
            }
            return this.createAuthTokens(user);
        });
    }
    static logout(refreshToken, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const hashedRefreshToken = crypto_1.default.createHash('sha256').update(refreshToken).digest('hex');
            yield AuthToken_1.default.deleteOne({ userId, token: hashedRefreshToken });
            // Optional: Invalidate access token on an allow-list/deny-list if using one.
            return { message: 'Logged out successfully' };
        });
    }
}
exports.AuthService = AuthService;
//# sourceMappingURL=Auth.js.map