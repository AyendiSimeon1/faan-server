import { Request, Response } from 'express';
import { OtpType } from '../types/common';
import { AuthService } from '../services/Auth';
import asyncHandler from '../middlewares/asyncHandler';
import { SignUpDto, SignInDto, VerifyOtpDto, ForgotPasswordDto, ResetPasswordDto } from '../types/Auth';

export const signUp = asyncHandler(async (req: Request, res: Response) => {
  const signUpDto: SignUpDto = req.body;
  const result = await AuthService.signUp(signUpDto);
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 180 * 24 * 60 * 60 * 1000
  });
  res.status(201).json({
    status: 'success',
    message: 'User registered successfully. Please check your email for verification.',
    data: { user: result.user, accessToken: result.tokens.accessToken },
  });
});

export const signIn = asyncHandler(async (req: Request, res: Response) => {
  const { email, password_field }: SignInDto = req.body;
  const result = await AuthService.signIn(email, password_field);
  res.cookie('refreshToken', result.tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 180 * 24 * 60 * 60 * 1000
  });
  res.status(200).json({
    status: 'success',
    message: 'Logged in successfully.',
    data: { user: result.user, accessToken: result.tokens.accessToken },
  });
});

export const verifyEmail = asyncHandler(async (req: Request, res: Response) => {
  const verifyOtpDto: VerifyOtpDto = req.body;
  const result = await AuthService.verifyOtp(verifyOtpDto, OtpType.EMAIL_VERIFICATION);
  res.status(200).json({ status: 'success', data: result });
});

export const resendVerificationEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email } = req.body;
  const result = await AuthService.resendOtp(email, OtpType.EMAIL_VERIFICATION);
  res.status(200).json({ status: 'success', message: 'Verification email sent successfully' });
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
  const forgotPasswordDto: ForgotPasswordDto = req.body;
  const result = await AuthService.forgotPassword(forgotPasswordDto);
  res.status(200).json({ status: 'success', data: result });
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
  const resetPasswordDto: ResetPasswordDto = { ...req.body, resetToken: req.params.token };
  const result = await AuthService.resetPassword(resetPasswordDto);
  res.status(200).json({ status: 'success', data: result });
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
  const oldRefreshToken = req.cookies.refreshToken;
  if (!oldRefreshToken) {
    return res.status(401).json({ status: 'fail', message: 'Refresh token not found' });
  }
  const newTokens = await AuthService.refreshToken(oldRefreshToken);
  res.cookie('refreshToken', newTokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 180 * 24 * 60 * 60 * 1000
  });
  res.status(200).json({
    status: 'success',
    data: { accessToken: newTokens.accessToken }
  });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken;
  const userId = (req.user && typeof (req.user as { _id: { toString: () => string } })._id?.toString === 'function')
    ? (req.user as { _id: { toString: () => string } })._id.toString()
    : undefined;

  if (refreshToken && userId) {
    await AuthService.logout(refreshToken, userId);
  }
  res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
  res.status(200).json({ status: 'success', message: 'Logged out successfully' });
});

