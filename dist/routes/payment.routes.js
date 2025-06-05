"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const payment_1 = require("../controllers/payment");
const paymentRouter = (0, express_1.Router)();
paymentRouter.post('/webhook', payment_1.handlePaystackWebhook);
paymentRouter.get('/verify/:reference', auth_1.protect, payment_1.verifyPaymentStatus);
paymentRouter.get('/history', payment_1.getUserPaymentHistory);
paymentRouter.post('/refund/:reference', auth_1.protect, payment_1.requestRefund);
exports.default = paymentRouter;
//# sourceMappingURL=payment.routes.js.map