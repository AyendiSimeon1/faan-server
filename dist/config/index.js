"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
exports.config = {
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://localhost:27017',
    DB_NAME: process.env.DB_NAME || 'faan_parking',
    PAYSTACK_SECRET_KEY: process.env.PAYSTACK_SECRET_KEY,
    PAYSTACK_PUBLIC_KEY: process.env.PAYSTACK_PUBLIC_KEY,
    BASE_URL: process.env.BASE_URL || 'http://localhost:3000',
    JWT_SECRET: process.env.JWT_SECRET || 'your-secret-key',
    JWT_EXPIRE: process.env.JWT_EXPIRE || '30d',
    PAYSTACK_CALLBACK_URL: process.env.PAYSTACK_CALLBACK_URL || 'asdads'
};
//# sourceMappingURL=index.js.map