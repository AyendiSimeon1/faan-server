"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.signRefreshToken = exports.signToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const AppError_1 = __importDefault(require("./AppError"));
const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '180d';
const signToken = (payload, expiresIn = JWT_EXPIRES_IN) => {
    const options = { expiresIn: expiresIn };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.signToken = signToken;
const signRefreshToken = (payload) => {
    const options = { expiresIn: JWT_REFRESH_EXPIRES_IN };
    return jsonwebtoken_1.default.sign(payload, JWT_SECRET, options);
};
exports.signRefreshToken = signRefreshToken;
const verifyToken = (token) => {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        return decoded;
    }
    catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new AppError_1.default('Token has expired', 401);
        }
        if (error.name === 'JsonWebTokenError') {
            throw new AppError_1.default('Invalid token', 401);
        }
        throw new AppError_1.default('Token verification failed', 401);
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=Jwt.js.map