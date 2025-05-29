import { IUser } from '../models/User';
import { AuthTokens, SignUpDto, AuthResponse, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto } from '../types/Auth';
import { OtpType } from '../types/common';
export declare class AuthService {
    private static createAuthTokens;
    private static generateAndSendOtp;
    static signUp(signUpDto: SignUpDto): Promise<AuthResponse>;
    static signIn(email: string, password_field: string): Promise<AuthResponse>;
    static verifyOtp(verifyOtpDto: VerifyOtpDto, otpType: OtpType): Promise<{
        message: string;
        user?: Partial<IUser>;
    }>;
    static resendOtp(identifier: string, otpType: OtpType): Promise<{
        message: string;
    }>;
    static forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    static resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    static refreshToken(oldRefreshToken: string): Promise<AuthTokens>;
    static logout(refreshToken: string, userId: string): Promise<{
        message: string;
    }>;
}
