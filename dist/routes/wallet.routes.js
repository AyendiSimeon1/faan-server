"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Wallet_1 = require("../controllers/Wallet");
const common_1 = require("../types/common");
const router = (0, express_1.Router)();
router.post('/topup', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.USER, common_1.UserRole.AGENT), Wallet_1.topUpWallet);
router.get('/balance', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.USER, common_1.UserRole.AGENT), Wallet_1.getWalletBalance);
exports.default = router;
//# sourceMappingURL=wallet.routes.js.map