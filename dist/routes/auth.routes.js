"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Auth_1 = require("../controllers/Auth");
const router = (0, express_1.Router)();
router.post('/register', Auth_1.signUp);
router.post('/login', Auth_1.signIn);
router.post('/logout', auth_1.protect, Auth_1.logout);
router.post('/forgot-password', Auth_1.forgotPassword);
router.patch('/reset-password/:token', Auth_1.resetPassword);
router.get('/me', auth_1.protect, Auth_1.refreshToken);
router.post('/verify-email', Auth_1.verifyEmail);
router.post('/resend-verification', Auth_1.resendVerificationEmail);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map