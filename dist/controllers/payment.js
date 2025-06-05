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
exports.requestRefund = exports.getUserPaymentHistory = exports.verifyPaymentStatus = exports.handlePaystackWebhook = void 0;
const payment_1 = require("../services/payment");
// import { ApiError } from '../utils/AppError';
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const handlePaystackWebhook = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!config_1.config.PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured');
    }
    const hash = crypto_1.default
        .createHmac('sha512', config_1.config.PAYSTACK_SECRET_KEY)
        .update(JSON.stringify(req.body))
        .digest('hex');
    if (hash !== req.headers['x-paystack-signature']) {
        throw new Error('Invalid signature');
    }
    const event = req.body;
    // Handle the event
    switch (event.event) {
        case 'charge.success':
            yield (0, payment_1.verifyPayment)(event.data.reference);
            break;
        // Add more cases as needed
    }
    res.sendStatus(200);
});
exports.handlePaystackWebhook = handlePaystackWebhook;
const verifyPaymentStatus = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    const payment = yield (0, payment_1.verifyPayment)(reference);
    res.json({
        status: 'success',
        data: payment
    });
});
exports.verifyPaymentStatus = verifyPaymentStatus;
const getUserPaymentHistory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.user) {
        throw new Error('User not authenticated');
    }
    const userId = req.user.id;
    const payments = yield (0, payment_1.getPaymentHistory)(userId);
    res.json({
        status: 'success',
        data: payments
    });
});
exports.getUserPaymentHistory = getUserPaymentHistory;
const requestRefund = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { reference } = req.params;
    const { amount } = req.body;
    const refund = yield (0, payment_1.initiateRefund)(reference, amount);
    res.json({
        status: 'success',
        data: refund
    });
});
exports.requestRefund = requestRefund;
//# sourceMappingURL=payment.js.map