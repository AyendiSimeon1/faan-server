"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const parking_routes_1 = __importDefault(require("./parking.routes"));
const auth_routes_1 = __importDefault(require("./auth.routes"));
const payment_routes_1 = __importDefault(require("./payment.routes"));
const wallet_routes_1 = __importDefault(require("./wallet.routes"));
const router = (0, express_1.Router)();
// Mount route handlers
router.use('/parking', parking_routes_1.default);
router.use('/auth', auth_routes_1.default);
router.use('/payments', payment_routes_1.default);
router.use('/wallet', wallet_routes_1.default);
exports.default = router;
//# sourceMappingURL=index.js.map