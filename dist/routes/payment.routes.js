"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const payment_1 = require("../controllers/payment");
const paymentRouter = (0, express_1.Router)();
paymentRouter.post('/webhook', payment_1.handlePaystackWebhook);
paymentRouter.put('/verify/:reference', auth_1.protect, payment_1.verifyPaymentStatus);
paymentRouter.get('/history', auth_1.protect, payment_1.getUserPaymentHistory);
paymentRouter.post('/refund/:reference', auth_1.protect, payment_1.requestRefund);
paymentRouter.get('/all-payments', auth_1.protect, payment_1.getAllPaymentsController);
exports.default = paymentRouter;
//# sourceMappingURL=payment.routes.js.map