// src/middlewares/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import asyncHandler from './asyncHandler';
import AppError from '../utils/AppError';

import UserModel, { IUser } from '../models/User';
import { UserRole } from '../types/common';
import { verifyToken } from '../utils/Jwt';

// Extend Express Request type to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const protect = asyncHandler(
  async (req: Request, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // else if (req.cookies.token) { // Optional: check for token in cookies
    //   token = req.cookies.token;
    // }

    if (!token) {
      return next(new AppError('Not authorized, no token provided', 401));
    }

    try {
      const decoded = verifyToken(token);
      
      // Check if user still exists and is active
      const currentUser = await UserModel.findById(decoded.userId);

      if (!currentUser) {
        return next(
          new AppError(
            'The user belonging to this token no longer exists.',
            401
          )
        );
      }

      if (!currentUser.isActive) {
        return next(new AppError('User account is inactive.', 403));
      }

      // Grant access to protected route
      req.user = currentUser;
      next();
    } catch (error) {
      // verifyToken already throws AppError for common JWT issues
      if (error instanceof AppError) {
        return next(error);
      }
      return next(new AppError('Not authorized, token failed', 401));
    }
  }
);

// Role-based authorization
export const authorize = (...roles: UserRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) { // Should be caught by protect middleware first
        return next(new AppError('User not found on request. Ensure protect middleware runs first.', 500));
    }
    if (!roles.includes(req.user.role as UserRole)) {
      return next(
        new AppError(
          `User role '${req.user.role}' is not authorized to access this route`,
          403
        )
      );
    }
    next();
  };
};