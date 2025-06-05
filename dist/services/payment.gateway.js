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
exports.PaymentGatewayService = void 0;
const axios_1 = __importDefault(require("axios"));
const config_1 = require("../config");
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
class PaymentGatewayService {
    static chargeCard(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            try {
                const response = yield this.paystackApi.post('/transaction/initialize', {
                    amount: options.amount * 100, // Convert to kobo
                    email: options.email,
                    reference: options.reference || `ref_${Date.now()}`,
                    metadata: options.metadata,
                    callback_url: config_1.config.PAYSTACK_CALLBACK_URL
                });
                const data = response.data.data;
                return {
                    successful: true,
                    gatewayReference: data.reference,
                    message: 'Payment initialization successful',
                    authorizationUrl: data.authorization_url,
                    rawResponse: response.data
                };
            }
            catch (error) {
                return {
                    successful: false,
                    message: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Payment initialization failed',
                    rawResponse: (_c = error.response) === null || _c === void 0 ? void 0 : _c.data
                };
            }
        });
    }
    static verifyTransaction(reference) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            try {
                const response = yield this.paystackApi.get(`/transaction/verify/${reference}`);
                const data = response.data.data;
                return {
                    successful: data.status === 'success',
                    amount: data.amount / 100, // Convert from kobo to naira
                    metadata: data.metadata,
                    message: response.data.message
                };
            }
            catch (error) {
                return {
                    successful: false,
                    message: ((_b = (_a = error.response) === null || _a === void 0 ? void 0 : _a.data) === null || _b === void 0 ? void 0 : _b.message) || 'Transaction verification failed'
                };
            }
        });
    }
    static createCustomer(email, name) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const response = yield this.paystackApi.post('/customer', {
                    email,
                    first_name: name.split(' ')[0],
                    last_name: name.split(' ').slice(1).join(' ')
                });
                return {
                    customerId: response.data.data.customer_code
                };
            }
            catch (error) {
                console.error('Failed to create customer:', error);
                return null;
            }
        });
    }
}
exports.PaymentGatewayService = PaymentGatewayService;
PaymentGatewayService.paystackApi = axios_1.default.create({
    baseURL: PAYSTACK_BASE_URL,
    headers: {
        Authorization: `Bearer ${config_1.config.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
    }
});
//# sourceMappingURL=payment.gateway.js.map