import crypto from 'crypto';
import mongoose from 'mongoose';
import AuthTokenModel from '../models/AuthToken';
import OtpModel from '../models/Otp';
import UserModel, { IUser } from '../models/User';
import WalletModel from '../models/Wallet';
import { AuthTokens, SignUpDto, AuthResponse, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto } from '../types/Auth';
import { OtpType, UserRole } from '../types/common';
import AppError from '../utils/AppError';
import { signToken, signRefreshToken } from '../utils/Jwt';
import { NotificationService } from './notification';

const OTP_EXPIRY_MINUTES = 5;

// Generates a secure 6-digit OTP code as a string using crypto
function generateOtpCode(): string {
  return crypto.randomInt(100000, 999999).toString().padStart(6, '0');
}

export class AuthService {
  private static async createAuthTokens(user: IUser): Promise<AuthTokens> {
    const userId = (user._id as mongoose.Types.ObjectId).toString();
    const accessTokenPayload = { userId, role: user.role };
    const refreshTokenPayload = { userId };
    
    const accessToken = signToken(accessTokenPayload);
    const refreshToken = signRefreshToken(refreshTokenPayload);

    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    const expiresAt = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);

    await AuthTokenModel.create({
      userId: user._id,
      token: hashedRefreshToken,
      expiresAt,
    });

    return { accessToken, refreshToken };
  }
  private static async generateAndSendOtp(identifier: string, type: OtpType, userId?: string): Promise<void> {
    console.log(`[OTP] Generating OTP for ${type} - Identifier: ${identifier}, UserId: ${userId || 'none'}`);
    
    const otpCode = generateOtpCode();
    console.log(`[OTP] Generated code for ${identifier}`);
    
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    console.log(`[OTP] Expiry set to ${expiresAt.toISOString()}`);

    try {
      const otp = await OtpModel.create({
        identifier,
        code: otpCode,
        type: type,
        expiresAt,
        userId: userId ? new mongoose.Types.ObjectId(userId) : undefined,
      });
      console.log(`[OTP] Saved to database with ID: ${otp._id}`);

      if (type === OtpType.EMAIL_VERIFICATION) {
        console.log(`[OTP] Sending verification email to ${identifier}`);
        await NotificationService.sendEmail(
          identifier,
          'Verify Your Email - FAAN Parking',
          NotificationService.getVerificationEmailTemplate(otpCode, OTP_EXPIRY_MINUTES)
        );
        console.log(`[OTP] Verification email sent successfully to ${identifier}`);
      }
    } catch (error) {
      console.error(`[OTP] Error in generateAndSendOtp:`, error);
      throw error;
    }
  }

  static async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { name, email, phoneNumber, password_field, registrationLocation } = signUpDto;

    const existingUserByEmail = await UserModel.findOne({ email });
    if (existingUserByEmail) {
      throw new AppError('User with this email already exists', 409);
    }

    const newUser = await UserModel.create({
      name,
      email,
      phoneNumber: phoneNumber || undefined,
      password: password_field,
      registrationLocation,
      role: UserRole.USER,
      isVerified: false,
    });

    // Create a wallet for the new user
    const wallet = await WalletModel.create({ userId: newUser._id, balance: 0, currency: 'NGN' });
    newUser.walletId = wallet._id as mongoose.Types.ObjectId;
    await newUser.save();

    // Send email verification OTP
    await this.generateAndSendOtp(email, OtpType.EMAIL_VERIFICATION, (newUser._id as mongoose.Types.ObjectId).toString());
    
    const tokens = await this.createAuthTokens(newUser);
    
    const { password, ...userResponse } = newUser.toObject();
    return { user: userResponse, tokens };
  }

  static async signIn(email: string, password_field: string): Promise<AuthResponse> {
    const user: any = await UserModel.findOne({ email }).select('+password');
    if (!user || !(await user.comparePassword(password_field))) {
      throw new AppError('Incorrect email or password', 401);
    }

    if (!user.isVerified) {
      // Resend OTP if not verified
      await this.generateAndSendOtp(user.email, OtpType.EMAIL_VERIFICATION, user._id.toString());
      throw new AppError('Account not verified. A verification code has been sent to your email.', 403);
    }

    if (!user.isActive) {
      throw new AppError('Your account is inactive. Please contact support.', 403);
    }

    const tokens = await this.createAuthTokens(user);
    user.lastLogin = new Date();
    await user.save();

    const { password, ...userResponse } = user.toObject();
    return { user: userResponse, tokens };
  }
    static async verifyOtp(verifyOtpDto: VerifyOtpDto, otpType: OtpType): Promise<{ message: string; user?: Partial<IUser> }> {
    const { identifier, otpCode } = verifyOtpDto;
    console.log(`[OTP Verify] Attempting to verify OTP for ${otpType} - Identifier: ${identifier}`);

    const otpEntry = await OtpModel.findOne({
      identifier,
      code: otpCode,
      type: otpType,
      isUsed: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpEntry) {
      console.log(`[OTP Verify] Invalid or expired OTP attempt for ${identifier}`);
      // Find the OTP to provide more specific debugging information
      const existingOtp = await OtpModel.findOne({ identifier, code: otpCode });
      if (existingOtp) {
        console.log(`[OTP Verify] Found matching OTP but:
          Used: ${existingOtp.isUsed}
          Expired: ${existingOtp.expiresAt < new Date()}
          Type matches: ${existingOtp.type === otpType}`);
      } else {
        console.log(`[OTP Verify] No matching OTP found for the given code`);
      }
      throw new AppError('Invalid or expired verification code.', 400);
    }

    console.log(`[OTP Verify] Valid OTP found for ${identifier}, marking as used`);
    otpEntry.isUsed = true;
    await otpEntry.save();

    if (otpType === OtpType.EMAIL_VERIFICATION && otpEntry.userId) {
      const user = await UserModel.findById(otpEntry.userId);
      if (user) {
        user.isVerified = true;
        await user.save();
        const { password, ...userResponse } = user.toObject();
        return { message: 'Email verified successfully.', user: userResponse };
      }
    }

    return { message: 'Verification successful.' };
  }
  static async resendOtp(identifier: string, otpType: OtpType): Promise<{ message: string }> {
    console.log(`[OTP Resend] Request to resend OTP for ${otpType} to ${identifier}`);
    
    // Check for recent OTPs to implement basic rate limiting
    const recentOtp = await OtpModel.findOne({
      identifier,
      type: otpType,
      createdAt: { $gt: new Date(Date.now() - 60 * 1000) } // Last minute
    });
    
    if (recentOtp) {
      console.log(`[OTP Resend] Rate limit: Recent OTP found for ${identifier}, created at ${recentOtp.createdAt}`);
      throw new AppError('Please wait 1 minute before requesting another code.', 429);
    }

    const user: any = await UserModel.findOne({ email: identifier }) as IUser | null;
    if (!user) {
      console.log(`[OTP Resend] User not found for identifier: ${identifier}`);
      throw new AppError('User not found.', 404);
    }

    console.log(`[OTP Resend] User found, generating new OTP for ${identifier}`);
    await this.generateAndSendOtp(identifier, otpType, user._id.toString());
    console.log(`[OTP Resend] Successfully generated and sent new OTP to ${identifier}`);
    
    return { message: `A new verification code has been sent to ${identifier}.` };
  }

  static async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await UserModel.findOne({ email: forgotPasswordDto.email });
    if (!user) {
      // Still send a success-like message to prevent email enumeration
      return { message: 'If your email is registered, you will receive a password reset link.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes
    await user.save();

    try {
      // Send email with resetToken (the unhashed one)
      const resetURL = `http://localhost:3000/reset-password/${resetToken}`;      await NotificationService.sendEmail(
          user.email, 
          'Password Reset Request - FAAN Parking', 
          NotificationService.getPasswordResetTemplate(resetURL)
      );
      return { message: 'If your email is registered, you will receive a password reset link.' };
    } catch (error) {
      console.error("Error sending password reset email:", error);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
      throw new AppError('There was an error sending the password reset email. Please try again.', 500);
    }
  }
    static async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{ message: string }> {
    const { token, newPassword_field } = resetPasswordDto;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await UserModel.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    }).select('+password'); 
    if (!user) {
      throw new AppError('Password reset token is invalid or has expired.', 400);
    }

    user.password = newPassword_field;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.isVerified = true; // Often, resetting password implies verification
    await user.save();

    return { message: 'Password has been reset successfully.' };
  }

  static async refreshToken(oldRefreshToken: string): Promise<AuthTokens> {
    const hashedOldRefreshToken = crypto.createHash('sha256').update(oldRefreshToken).digest('hex');
    const tokenDoc = await AuthTokenModel.findOneAndDelete({ token: hashedOldRefreshToken });

    if (!tokenDoc || tokenDoc.expiresAt < new Date()) {
        throw new AppError('Invalid or expired refresh token', 401);
    }

    const user = await UserModel.findById(tokenDoc.userId);
    if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
    }
    
    return this.createAuthTokens(user);
  }

  static async logout(refreshToken: string, userId: string): Promise<{ message: string }> {
    const hashedRefreshToken = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await AuthTokenModel.deleteOne({ userId, token: hashedRefreshToken });
    // Optional: Invalidate access token on an allow-list/deny-list if using one.
    return { message: 'Logged out successfully' };
  }
}