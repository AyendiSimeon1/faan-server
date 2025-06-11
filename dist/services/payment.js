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
exports.getPaymentHistory = exports.initiateRefund = exports.verifyPayment = exports.createPaymentSession = void 0;
const axios_1 = __importDefault(require("axios"));
const mongodb_1 = require("mongodb");
const config_1 = require("../config");
const mongoose_1 = __importDefault(require("mongoose"));
// const payments = db.collection<Payment>('payments');
// const parkingSessions = db.collection<ParkingSession>('parkingSessions');
// import axios from 'axios';
// import { config } from '../config';
// import { ApiError } from '../utils/ApiError';
// import { ObjectId } from 'mongodb';
// import { db } from '../config/mongodb';
const PAYSTACK_SECRET_KEY = 'dasdfasdfadf';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const payments = mongoose_1.default.connection.collection('payments');
const parkingSessions = mongoose_1.default.connection.collection('parkingSessions');
const createPaymentSession = (data) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            amount: data.amount * 100, // Convert to kobo
            email: data.email,
            metadata: data.metadata,
            callback_url: `${config_1.config.BASE_URL}/api/v1/payments/verify`
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        }); // Create payment record
        const payment = yield payments.insertOne({
            amount: data.amount,
            reference: response.data.data.reference,
            parkingSessionId: new mongodb_1.ObjectId(data.metadata.sessionId),
            status: 'PENDING',
            metadata: response.data.data,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return Object.assign(Object.assign({}, response.data.data), { paymentId: payment.insertedId });
    }
    catch (error) {
        throw new Error('Failed to initialize payment');
    }
});
exports.createPaymentSession = createPaymentSession;
const verifyPayment = (reference) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.get(`${PAYSTACK_BASE_URL}/transaction/verify/${reference}`, {
            headers: {
                Authorization: `Bearer sk_test_97e94ee550b9583d662dde51107b3a915b696872`
            }
        });
        console.log('Paystack response:', response.data);
        const { status } = response.data.data;
        // Update payment record - use gatewayReference instead of reference
        const payment = yield payments.findOneAndUpdate({ gatewayReference: reference }, // ✅ Correct field name
        {
            $set: {
                status: status === 'success' ? 'COMPLETED' : 'FAILED',
                gatewayResponse: response.data.data, // Store full response
                processedAt: new Date(), // When payment was processed
                updatedAt: new Date()
            }
        }, {
            returnDocument: 'after',
        });
        console.log('Updated payment:', payment);
        if (!payment) {
            console.error(`Payment not found for reference: ${reference}`);
            throw new Error('Payment record not found');
        }
        // If payment successful, update parking session
        if (status === 'success') {
            yield parkingSessions.updateOne({ _id: response.data.data.metadata.sessionId }, {
                $set: {
                    paid: true,
                    updatedAt: new Date()
                }
            });
        }
        return payment;
    }
    catch (error) {
        throw new Error('Failed to verify payment');
    }
});
exports.verifyPayment = verifyPayment;
const initiateRefund = (reference, amount) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const response = yield axios_1.default.post(`${PAYSTACK_BASE_URL}/refund`, {
            transaction: reference,
            amount: amount ? amount * 100 : undefined // Convert to kobo if amount specified
        }, {
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        }); // Update payment record
        const payment = yield payments.findOneAndUpdate({ reference }, {
            $set: {
                status: 'REFUNDED',
                metadata: Object.assign(Object.assign({}, response.data.data), { refundedAt: new Date() }),
                updatedAt: new Date()
            }
        }, { returnDocument: 'after' });
        if (!payment) {
            throw new Error('Payment record not found');
        }
        return response.data.data;
    }
    catch (error) {
        throw new Error('Failed to initiate refund');
    }
});
exports.initiateRefund = initiateRefund;
const getPaymentHistory = (userId) => __awaiter(void 0, void 0, void 0, function* () {
    const userPayments = yield payments
        .aggregate([
        {
            $lookup: {
                from: 'parkingSessions',
                localField: 'parkingSessionId',
                foreignField: '_id',
                as: 'parkingSession'
            }
        },
        {
            $match: {
                'parkingSession.userId': new mongodb_1.ObjectId(userId)
            }
        },
        {
            $sort: { createdAt: -1 }
        },
        {
            $unwind: '$parkingSession'
        }
    ])
        .toArray();
    return userPayments;
});
exports.getPaymentHistory = getPaymentHistory;
//# sourceMappingURL=payment.js.map