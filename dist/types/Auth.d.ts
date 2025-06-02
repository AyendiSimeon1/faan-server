import { IUser } from "../models/User";
export interface SignUpDto {
    name: string;
    email: string;
    phoneNumber?: string;
    password_field: string;
    registrationLocation?: string;
}
export interface SignInDto {
    email: string;
    password_field: string;
}
export interface VerifyOtpDto {
    identifier: string;
    otpCode: string;
}
export interface ForgotPasswordDto {
    email: string;
}
export interface ResetPasswordDto {
    token: string;
    newPassword_field: string;
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface AuthResponse {
    user: Partial<IUser>;
    tokens: AuthTokens;
}
