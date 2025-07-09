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
exports.validateParkingQR = exports.endParkingSession = exports.startParkingSession = void 0;
const parkingSession_1 = require("../services/parkingSession");
const ParkingFeeCalculator_1 = require("../utils/ParkingFeeCalculator");
const payment_1 = require("../services/payment");
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
exports.startParkingSession = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { vehicleType, plateNumber, qrCode, spotId } = req.body;
    // Validate vehicle type
    if (!Object.values(ParkingFeeCalculator_1.VehicleType).includes(vehicleType)) {
        throw new Error('Invalid vehicle type');
    }
    // Check if there's already an active session for this plate number
    const existingSession = yield parkingSession_1.ParkingSessionService.getActiveSessionByPlate(plateNumber);
    if (existingSession) {
        throw new Error('Vehicle already has an active parking session');
    }
    const session = yield parkingSession_1.ParkingSessionService.startSession({
        vehicleType,
        plateNumber,
        qrCode,
        spotId
    });
    return res.status(201).json({
        status: 'success',
        secureId: session.secureId, // Top-level secureId
        data: session
    });
}));
exports.endParkingSession = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { secureId } = req.body;
    if (!req.user) {
        throw new Error('User not authenticated');
    }
    const session = yield parkingSession_1.ParkingSessionService.endSession(secureId);
    // Create payment session with Paystack
    const paymentSession = yield (0, payment_1.createPaymentSession)({
        amount: session.totalAmount,
        email: req.user.email,
        metadata: {
            sessionId: session.id,
            plateNumber: session.plateNumber
        }
    });
    return res.status(200).json({
        status: 'success',
        data: session,
        paymentSession
    });
}));
exports.validateParkingQR = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { qrCode } = req.body;
    const session = yield parkingSession_1.ParkingSessionService.getActiveSessionByQR(qrCode);
    if (!session) {
        throw new Error('No active parking session found for this QR code');
    }
    res.json({
        status: 'success',
        data: session
    });
}));
//# sourceMappingURL=parkingSession.js.map