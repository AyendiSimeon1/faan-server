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
exports.authorize = exports.protect = void 0;
const asyncHandler_1 = __importDefault(require("./asyncHandler"));
const AppError_1 = __importDefault(require("../utils/AppError"));
const User_1 = __importDefault(require("../models/User")); // Adjust path to your User model
const Jwt_1 = require("../utils/Jwt");
exports.protect = (0, asyncHandler_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    let token;
    if (req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    // else if (req.cookies.token) { // Optional: check for token in cookies
    //   token = req.cookies.token;
    // }
    if (!token) {
        return next(new AppError_1.default('Not authorized, no token provided', 401));
    }
    try {
        const decoded = (0, Jwt_1.verifyToken)(token);
        // Check if user still exists and is active
        const currentUser = yield User_1.default.findById(decoded.userId);
        if (!currentUser) {
            return next(new AppError_1.default('The user belonging to this token no longer exists.', 401));
        }
        if (!currentUser.isActive) {
            return next(new AppError_1.default('User account is inactive.', 403));
        }
        // Grant access to protected route
        req.user = currentUser;
        next();
    }
    catch (error) {
        // verifyToken already throws AppError for common JWT issues
        if (error instanceof AppError_1.default) {
            return next(error);
        }
        return next(new AppError_1.default('Not authorized, token failed', 401));
    }
}));
// Role-based authorization
const authorize = (...roles) => {
    return (req, res, next) => {
        if (!req.user) { // Should be caught by protect middleware first
            return next(new AppError_1.default('User not found on request. Ensure protect middleware runs first.', 500));
        }
        if (!roles.includes(req.user.role)) {
            return next(new AppError_1.default(`User role '${req.user.role}' is not authorized to access this route`, 403));
        }
        next();
    };
};
exports.authorize = authorize;
//# sourceMappingURL=auth.js.map