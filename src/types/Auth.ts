import { IUser } from "../models/User";

export interface SignUpDto {
  name: string;
  email: string;
  phoneNumber?: string; // Made optional
  password_field: string; // From UI
  role?: string; // Optional, defaults to 'USER' in service
  registrationLocation?: string;
}

export interface SignInDto {
  email: string;
  password_field: string;
}

export interface VerifyOtpDto {
  identifier: string; // Phone number or email
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
  user: Partial<IUser>; // Or a specific UserResponseDto
  tokens: AuthTokens;
}