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
exports.logout = exports.refreshToken = exports.resetPassword = exports.forgotPassword = exports.resendVerificationEmail = exports.verifyEmail = exports.signIn = exports.signUp = void 0;
const common_1 = require("../types/common");
const Auth_1 = require("../services/Auth");
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
exports.signUp = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const signUpDto = req.body;
    const result = yield Auth_1.AuthService.signUp(signUpDto);
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
}));
exports.signIn = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email, password_field } = req.body;
    const result = yield Auth_1.AuthService.signIn(email, password_field);
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
}));
exports.verifyEmail = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const verifyOtpDto = req.body;
    const result = yield Auth_1.AuthService.verifyOtp(verifyOtpDto, common_1.OtpType.EMAIL_VERIFICATION);
    res.status(200).json({ status: 'success', data: result });
}));
exports.resendVerificationEmail = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { email } = req.body;
    const result = yield Auth_1.AuthService.resendOtp(email, common_1.OtpType.EMAIL_VERIFICATION);
    res.status(200).json({ status: 'success', message: 'Verification email sent successfully' });
}));
exports.forgotPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const forgotPasswordDto = req.body;
    const result = yield Auth_1.AuthService.forgotPassword(forgotPasswordDto);
    res.status(200).json({ status: 'success', data: result });
}));
exports.resetPassword = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const resetPasswordDto = Object.assign(Object.assign({}, req.body), { resetToken: req.params.token });
    const result = yield Auth_1.AuthService.resetPassword(resetPasswordDto);
    res.status(200).json({ status: 'success', data: result });
}));
exports.refreshToken = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const oldRefreshToken = req.cookies.refreshToken;
    if (!oldRefreshToken) {
        return res.status(401).json({ status: 'fail', message: 'Refresh token not found' });
    }
    const newTokens = yield Auth_1.AuthService.refreshToken(oldRefreshToken);
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
}));
exports.logout = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const refreshToken = req.cookies.refreshToken;
    const userId = (req.user && typeof ((_a = req.user._id) === null || _a === void 0 ? void 0 : _a.toString) === 'function')
        ? req.user._id.toString()
        : undefined;
    if (refreshToken && userId) {
        yield Auth_1.AuthService.logout(refreshToken, userId);
    }
    res.cookie('refreshToken', '', { httpOnly: true, expires: new Date(0) });
    res.status(200).json({ status: 'success', message: 'Logged out successfully' });
}));
//# sourceMappingURL=Auth.js.map