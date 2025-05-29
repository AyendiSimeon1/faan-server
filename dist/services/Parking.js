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
const User_1 = __importDefault(require("../models/User"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const WalletTransaction_1 = __importDefault(require("../models/WalletTransaction"));
const common_1 = require("../types/common");
const AppError_1 = __importDefault(require("../utils/AppError"));
const payment_gateway_1 = require("./payment.gateway");
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
            var _a, _b;
            const { qrCodeId, vehicleType } = dto;
            // Here, you might have a pre-existing mapping of QR codes to parking spots/locations
            // Or the QR code itself contains location info to be parsed.
            // For simplicity, let's assume qrCodeId is unique and implies a location.
            // Check for existing active session with this QR code (shouldn't happen if QR is single-use for entry)
            const existingSession = yield ParkingModel_1.default.findOne({ qrCodeId, status: common_1.ParkingSessionStatus.ACTIVE });
            if (existingSession) {
                throw new AppError_1.default('QR Code already associated with an active session.', 409);
            }
            let plateNumberToUse;
            if (userId) {
                const user = yield User_1.default.findById(userId);
                // TODO: Logic to get user's default vehicle or let them select
                // For now, assume user has a default plate or it's part of QR data/flow
                plateNumberToUse = ((_b = (_a = user === null || user === void 0 ? void 0 : user.savedPaymentMethods) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.last4Digits) || "DEFAULT123"; // Placeholder logic
            }
            if (!plateNumberToUse) {
                throw new AppError_1.default("Vehicle plate number is required to start session.", 400);
            }
            const session = yield ParkingModel_1.default.create({
                userId: userId || undefined,
                qrCodeId,
                vehiclePlateNumber: plateNumberToUse, // This needs a proper source
                vehicleType,
                parkingLocationId: `loc_qr_${qrCodeId}`, // Derive or lookup location
                status: common_1.ParkingSessionStatus.ACTIVE,
                entryTime: new Date(),
                rateDetails: "₦200/hr (standard)", // Example
            });
            return session;
        });
    }
    static startSessionByPlate(dto, userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const { plateNumber, vehicleType } = dto;
            const existingActiveSession = yield ParkingModel_1.default.findOne({
                vehiclePlateNumber: plateNumber.toUpperCase(),
                status: common_1.ParkingSessionStatus.ACTIVE,
            });
            if (existingActiveSession) {
                throw new AppError_1.default(`Vehicle ${plateNumber} already has an active parking session.`, 409);
            }
            const session = yield ParkingModel_1.default.create({
                userId: userId || undefined,
                vehiclePlateNumber: plateNumber.toUpperCase(),
                vehicleType,
                parkingLocationId: 'default_location_plate_entry', // Example
                status: common_1.ParkingSessionStatus.ACTIVE,
                entryTime: new Date(),
                rateDetails: "₦200/hr (standard)", // Example
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
            var _a;
            const { sessionId, paymentMethodId, paymentMethodType } = dto;
            const session = yield ParkingModel_1.default.findById(sessionId);
            if (!session) {
                throw new AppError_1.default('Parking session not found.', 404);
            }
            if (((_a = session.userId) === null || _a === void 0 ? void 0 : _a.toString()) !== user._id.toString()) {
                throw new AppError_1.default('You are not authorized to end this session.', 403);
            }
            if (session.status !== common_1.ParkingSessionStatus.ACTIVE && session.status !== common_1.ParkingSessionStatus.PENDING_PAYMENT) {
                throw new AppError_1.default(`Session cannot be ended. Current status: ${session.status}`, 400);
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
            const paymentRecord = yield Payment_1.default.create({
                userId: user._id,
                parkingSessionId: session._id,
                amount: session.calculatedFee,
                currency: 'NGN', // Assuming NGN
                paymentMethodType: paymentMethodType === 'card' ? common_1.PaymentMethodType.CARD : common_1.PaymentMethodType.WALLET,
                status: common_1.PaymentStatus.PENDING,
            });
            try {
                if (paymentMethodType === 'wallet') {
                    const wallet = yield Wallet_1.default.findOne({ userId: user._id });
                    if (!wallet || wallet.balance < session.calculatedFee) {
                        throw new AppError_1.default('Insufficient wallet balance.', 402);
                    }
                    // Deduct from wallet
                    wallet.balance -= session.calculatedFee;
                    yield wallet.save();
                    // Record wallet transaction
                    yield WalletTransaction_1.default.create({
                        walletId: wallet._id,
                        userId: user._id,
                        type: common_1.WalletTransactionType.PARKING_FEE,
                        amount: -session.calculatedFee, // Negative for deduction
                        status: common_1.PaymentStatus.SUCCESSFUL,
                        description: `Parking fee for session ${session._id}`,
                        relatedParkingSessionId: session._id,
                        relatedPaymentId: paymentRecord._id,
                    });
                    paymentResult = { successful: true, message: "Paid successfully from wallet." };
                    finalPaymentStatus = common_1.PaymentStatus.SUCCESSFUL;
                    paymentRecord.paymentMethodDetails = { provider: 'wallet', walletId: wallet._id.toString() };
                }
                else if (paymentMethodType === 'card') {
                    // Find the specific card from user's saved methods or use a token from client
                    const cardToCharge = user.savedPaymentMethods.find(pm => pm.paymentMethodId === paymentMethodId);
                    if (!cardToCharge && !paymentMethodId) { // paymentMethodId could be a one-time token
                        throw new AppError_1.default('Payment method ID required for card payment.', 400);
                    }
                    const chargeOpts = {
                        amount: session.calculatedFee * 100, // To kobo/cents
                        currency: 'NGN',
                        // source: paymentMethodId, // This would be the gateway's token for the card
                        // customerId: user.gatewayCustomerId, // If you store gateway customer IDs
                        email: user.email,
                        reference: `sess_${session._id}_pay_${paymentRecord._id}`,
                        metadata: { sessionId: session._id.toString(), userId: user._id.toString() },
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
                session.paymentId = paymentRecord._id;
                session.status = finalPaymentStatus === common_1.PaymentStatus.SUCCESSFUL ? common_1.ParkingSessionStatus.COMPLETED : common_1.ParkingSessionStatus.PENDING_PAYMENT; // Revert if failed
            }
            catch (error) {
                session.status = common_1.ParkingSessionStatus.PENDING_PAYMENT; // Error occurred, user might need to retry
                paymentRecord.status = common_1.PaymentStatus.FAILED;
                if (error instanceof AppError_1.default)
                    paymentMessage = error.message;
                else
                    paymentMessage = "An unexpected error occurred during payment processing.";
                yield paymentRecord.save();
                // Rethrow or handle gracefully
            }
            finally {
                yield session.save();
            }
            if (finalPaymentStatus !== common_1.PaymentStatus.SUCCESSFUL) {
                throw new AppError_1.default(paymentMessage, 402); // 402 Payment Required
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
}
exports.ParkingService = ParkingService;
//# sourceMappingURL=Parking.js.map