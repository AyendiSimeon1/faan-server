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
exports.ParkingService = void 0;
const ParkingModel_1 = __importDefault(require("../models/ParkingModel"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const WalletTransaction_1 = __importDefault(require("../models/WalletTransaction"));
const common_1 = require("../types/common");
const AppError_1 = __importDefault(require("../utils/AppError"));
const payment_gateway_1 = require("./payment.gateway");
const ParkingFeeCalculator_1 = require("../utils/ParkingFeeCalculator");
// Assume a function to calculate parking fee
const calculateParkingFee = (entryTime, exitTime, rateDetails) => {
    var _a;
    const durationMs = exitTime.getTime() - entryTime.getTime();
    const durationHours = durationMs / (1000 * 60 * 60);
    // Example: N200/hr. Implement actual rate logic based on `rateDetails` or location.
    const ratePerHour = parseFloat(((_a = rateDetails === null || rateDetails === void 0 ? void 0 : rateDetails.match(/₦(\d+)/)) === null || _a === void 0 ? void 0 : _a[1]) || '200');
    return Math.max(ratePerHour, Math.ceil(durationHours * ratePerHour)); // Minimum 1 hour charge or actual
};
class ParkingService {
    static startSessionByQr(dto, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { vehicleType, plateNumber } = dto;
            try {
                // Check for existing active session in this location
                const normalizedPlate = plateNumber ? (0, ParkingFeeCalculator_1.normalizePlateNumber)(plateNumber) : '';
                const existingSession = yield ParkingModel_1.default.findOne({
                    vehiclePlateNumber: normalizedPlate,
                    status: common_1.ParkingSessionStatus.ACTIVE
                });
                if (existingSession) {
                    throw new AppError_1.default(`Vehicle ${plateNumber} already has an active parking session.`, 409);
                }
                const session = yield ParkingModel_1.default.create({
                    userId: userId || undefined,
                    vehiclePlateNumber: normalizedPlate,
                    displayPlateNumber: plateNumber || normalizedPlate,
                    vehicleType,
                    parkingLocationId: 'default_location_qr_entry', // TODO: Get from QR data
                    status: common_1.ParkingSessionStatus.ACTIVE,
                    entryTime: new Date(),
                    rateDetails: "₦200/hr (standard)", // TODO: Get from location config
                });
                return session;
            }
            catch (error) {
                throw error;
            }
        });
    }
    static startSessionByPlate(dto, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { plateNumber, vehicleType } = dto;
            const normalizedPlate = (0, ParkingFeeCalculator_1.normalizePlateNumber)(plateNumber);
            const existingActiveSession = yield ParkingModel_1.default.findOne({
                vehiclePlateNumber: normalizedPlate,
                status: common_1.ParkingSessionStatus.ACTIVE,
            });
            if (existingActiveSession) {
                throw new AppError_1.default(`Vehicle ${plateNumber} already has an active parking session.`, 409);
            }
            const session = yield ParkingModel_1.default.create({
                userId: userId || undefined,
                vehiclePlateNumber: normalizedPlate,
                displayPlateNumber: plateNumber,
                vehicleType,
                parkingLocationId: 'default_location_plate_entry',
                status: common_1.ParkingSessionStatus.ACTIVE,
                entryTime: new Date(),
                rateDetails: "₦200/hr (standard)", // Example rate
            });
            return session;
        });
    }
    static getParkingSessionById(sessionId, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const query = { _id: sessionId };
            if (userId)
                query.userId = userId; // Ensure user can only access their sessions
            const session = yield ParkingModel_1.default.findOne(query);
            if (!session) {
                throw new AppError_1.default('Parking session not found.', 404);
            }
            // If session is active, calculate current fee "so far"
            if (session.status === common_1.ParkingSessionStatus.ACTIVE) {
                session.calculatedFee = calculateParkingFee(session.entryTime, new Date(), session.rateDetails);
                // Note: This calculatedFee is transient for display, not saved unless explicitly done
            }
            return session;
        });
    }
    static endSessionAndPay(dto, user) {
        return __awaiter(this, void 0, void 0, function* () {
            const { plateNumber, paymentMethodId, paymentMethodType } = dto;
            const normalizedPlate = (0, ParkingFeeCalculator_1.normalizePlateNumber)(plateNumber);
            // Find active session by normalized plate number
            const session = yield ParkingModel_1.default.findOne({
                vehiclePlateNumber: normalizedPlate,
                status: common_1.ParkingSessionStatus.ACTIVE
            });
            if (!session) {
                throw new AppError_1.default('No active parking session found for this vehicle.', 404);
            }
            // Only check user authorization if user is present
            if (user && session.userId && session.userId.toString() !== user.id) {
                throw new AppError_1.default('You are not authorized to end this session.', 403);
            }
            session.exitTime = new Date();
            session.durationInMinutes = Math.round((session.exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60));
            session.calculatedFee = calculateParkingFee(session.entryTime, session.exitTime, session.rateDetails);
            if (session.calculatedFee <= 0) { // Free parking or error
                session.status = common_1.ParkingSessionStatus.COMPLETED;
                yield session.save();
                return { session, paymentResult: null, message: 'Parking session ended (no fee).' };
            }
            session.status = common_1.ParkingSessionStatus.LOADING_EXIT; // Set to loading while processing payment
            yield session.save();
            let paymentResult;
            let paymentMessage = "Payment processing initiated.";
            let finalPaymentStatus = common_1.PaymentStatus.PENDING;
            // Only allow wallet payment if user is present
            if (!user && paymentMethodType === 'wallet') {
                throw new AppError_1.default('Wallet payment requires login. Please use card payment.', 401);
            }
            // For guest/anonymous, set a default email for card payments if not provided
            let payerEmail = user ? user.email : dto.email || 'konsizeinc@gmail.com';
            const paymentRecord = yield Payment_1.default.create({
                userId: user ? user.id : undefined,
                parkingSessionId: session.id,
                amount: session.calculatedFee,
                currency: 'NGN',
                paymentMethodType: paymentMethodType === 'card' ? common_1.PaymentMethodType.CARD : common_1.PaymentMethodType.WALLET,
                status: common_1.PaymentStatus.PENDING,
            });
            try {
                if (paymentMethodType === 'wallet') {
                    const wallet = yield Wallet_1.default.findOne({ userId: user.id });
                    if (!wallet || wallet.balance < session.calculatedFee) {
                        throw new AppError_1.default('Insufficient wallet balance.', 402);
                    }
                    // Deduct from wallet
                    wallet.balance -= session.calculatedFee;
                    yield wallet.save();
                    // Record wallet transaction
                    yield WalletTransaction_1.default.create({
                        walletId: wallet.id,
                        userId: user.id,
                        type: common_1.WalletTransactionType.PARKING_FEE,
                        amount: -session.calculatedFee,
                        status: common_1.PaymentStatus.SUCCESSFUL,
                        description: `Parking fee for vehicle ${plateNumber}`,
                        relatedParkingSessionId: session.id,
                        relatedPaymentId: paymentRecord.id,
                    });
                    paymentResult = { successful: true, message: "Paid successfully from wallet." };
                    finalPaymentStatus = common_1.PaymentStatus.SUCCESSFUL;
                    paymentRecord.paymentMethodDetails = { provider: 'wallet', walletId: wallet.id };
                }
                else if (paymentMethodType === 'card') {
                    // For guests, require paymentMethodId/token from client
                    let cardToCharge = user ? user.savedPaymentMethods.find(pm => pm.paymentMethodId === paymentMethodId) : undefined;
                    if (!cardToCharge && !paymentMethodId) {
                        throw new AppError_1.default('Payment method ID required for card payment.', 400);
                    }
                    const chargeOpts = {
                        amount: session.calculatedFee,
                        currency: 'NGN',
                        email: payerEmail,
                        reference: `park_${plateNumber}_${session.id}_${paymentRecord.id}`,
                        metadata: {
                            sessionId: session.id,
                            userId: user ? user.id : undefined,
                            plateNumber: plateNumber
                        },
                    };
                    const gwResult = yield payment_gateway_1.PaymentGatewayService.chargeCard(chargeOpts);
                    paymentResult = gwResult;
                    if (gwResult.successful) {
                        finalPaymentStatus = common_1.PaymentStatus.SUCCESSFUL;
                    }
                    else {
                        finalPaymentStatus = common_1.PaymentStatus.FAILED;
                        paymentMessage = gwResult.message || "Card payment failed.";
                    }
                    paymentRecord.gatewayReference = gwResult.gatewayReference;
                    paymentRecord.gatewayResponse = gwResult.rawResponse;
                    paymentRecord.receiptUrl = gwResult.receiptUrl;
                    if (cardToCharge) {
                        paymentRecord.paymentMethodDetails = { provider: cardToCharge.provider, last4Digits: cardToCharge.last4Digits };
                    }
                }
                paymentRecord.status = finalPaymentStatus;
                paymentRecord.processedAt = new Date();
                yield paymentRecord.save();
                session.paymentId = paymentRecord.id;
                session.status = finalPaymentStatus === common_1.PaymentStatus.SUCCESSFUL ? common_1.ParkingSessionStatus.COMPLETED : common_1.ParkingSessionStatus.PENDING_PAYMENT;
            }
            catch (error) {
                session.status = common_1.ParkingSessionStatus.PENDING_PAYMENT;
                paymentRecord.status = common_1.PaymentStatus.FAILED;
                if (error instanceof AppError_1.default)
                    paymentMessage = error.message;
                else
                    paymentMessage = "An unexpected error occurred during payment processing.";
                yield paymentRecord.save();
            }
            finally {
                yield session.save();
            }
            return { session, paymentResult, message: finalPaymentStatus === common_1.PaymentStatus.SUCCESSFUL ? "Payment successful. Session ended." : paymentMessage };
        });
    }
    static getParkingHistory(userId_1) {
        return __awaiter(this, arguments, void 0, function* (userId, page = 1, limit = 10) {
            const skip = (page - 1) * limit;
            const total = yield ParkingModel_1.default.countDocuments({ userId, status: { $in: [common_1.ParkingSessionStatus.COMPLETED, common_1.ParkingSessionStatus.PAID_BY_AGENT] } });
            const sessions = yield ParkingModel_1.default.find({ userId, status: { $in: [common_1.ParkingSessionStatus.COMPLETED, common_1.ParkingSessionStatus.PAID_BY_AGENT] } })
                .sort({ exitTime: -1, entryTime: -1 })
                .skip(skip)
                .limit(limit)
                .populate('paymentId', 'amount paymentMethodType status receiptUrl'); // Populate payment details
            return {
                sessions,
                total,
                currentPage: page,
                totalPages: Math.ceil(total / limit)
            };
        });
    }
    static getAllEndedSessions() {
        return __awaiter(this, void 0, void 0, function* () {
            return ParkingModel_1.default.find({ status: { $in: [common_1.ParkingSessionStatus.COMPLETED, common_1.ParkingSessionStatus.ENDED] } })
                .sort({ exitTime: -1, entryTime: -1 })
                .populate('paymentId', 'amount paymentMethodType status receiptUrl');
        });
    }
}
exports.ParkingService = ParkingService;
//# sourceMappingURL=Parking.js.map