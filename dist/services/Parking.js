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
exports.getVehicleTypeFromString = exports.createRateDetails = exports.calculateParkingFee = exports.ParkingService = void 0;
const ParkingModel_1 = __importDefault(require("../models/ParkingModel"));
const Payment_1 = __importDefault(require("../models/Payment"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
const WalletTransaction_1 = __importDefault(require("../models/WalletTransaction"));
const common_1 = require("../types/common");
const AppError_1 = __importDefault(require("../utils/AppError"));
const payment_gateway_1 = require("./payment.gateway");
const ParkingFeeCalculator_1 = require("../utils/ParkingFeeCalculator");
// Updated MMA2 parking fee calculation function
const calculateParkingFee = (entryTime, exitTime, rateDetails) => {
    const durationInMinutes = Math.round((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));
    // Handle invalid duration
    if (durationInMinutes <= 0) {
        return 0;
    }
    // Parse rate details - handle both string and object formats
    let parsedRateDetails = {};
    if (typeof rateDetails === 'string') {
        // Try to extract vehicle type from string format
        const lowerRateDetails = rateDetails.toLowerCase();
        if (lowerRateDetails.includes('suv')) {
            parsedRateDetails.vehicleType = 'suv';
        }
        else if (lowerRateDetails.includes('bus') && lowerRateDetails.includes('large')) {
            parsedRateDetails.vehicleType = 'large_bus';
        }
        else if (lowerRateDetails.includes('bus')) {
            parsedRateDetails.vehicleType = 'bus';
        }
        else {
            parsedRateDetails.vehicleType = 'regular';
        }
    }
    else if (rateDetails && typeof rateDetails === 'object') {
        parsedRateDetails = rateDetails;
    }
    const vehicleType = parsedRateDetails.vehicleType || 'regular';
    // Check if it's overnight parking (after 12 midnight)
    const entryHour = entryTime.getHours();
    const exitHour = exitTime.getHours();
    const isOvernight = (entryHour >= 0 && entryHour < 6) || (exitHour >= 0 && exitHour < 6) ||
        (entryTime.getDate() !== exitTime.getDate()) ||
        (durationInMinutes > 720); // More than 12 hours
    // Large buses (18+ seater) - flat rate
    if (vehicleType === 'large_bus') {
        return 5000;
    }
    // Overnight parking - flat rate
    if (isOvernight || parsedRateDetails.isOvernight) {
        return 5000;
    }
    let totalFee = 0;
    let remainingMinutes = durationInMinutes;
    // First hour rates
    if (remainingMinutes > 0) {
        if (vehicleType === 'suv' || vehicleType === 'bus') {
            totalFee += 1500; // SUV/Bus first hour
        }
        else {
            totalFee += 1000; // Regular vehicles first hour
        }
        remainingMinutes -= 60;
    }
    // If duration is exactly 60 minutes or less, return first hour rate
    if (remainingMinutes <= 0) {
        return totalFee;
    }
    // 2nd to 4th hour (charged per 30-minute blocks at ₦100 each)
    // This covers minutes 61-240 (hours 2-4)
    const secondToFourthHourMinutes = Math.min(remainingMinutes, 180); // Max 180 minutes (3 hours)
    if (secondToFourthHourMinutes > 0) {
        const thirtyMinBlocks = Math.ceil(secondToFourthHourMinutes / 30);
        totalFee += thirtyMinBlocks * 100;
        remainingMinutes -= secondToFourthHourMinutes;
    }
    // 5th hour onwards (₦500 per hour)
    if (remainingMinutes > 0) {
        const additionalHours = Math.ceil(remainingMinutes / 60);
        totalFee += additionalHours * 500;
    }
    return totalFee;
};
exports.calculateParkingFee = calculateParkingFee;
// Helper function to determine vehicle type from string
const getVehicleTypeFromString = (vehicleType) => {
    if (!vehicleType)
        return 'regular';
    const lowerType = vehicleType.toLowerCase();
    if (lowerType.includes('suv'))
        return 'suv';
    if (lowerType.includes('large') && lowerType.includes('bus'))
        return 'large_bus';
    if (lowerType.includes('bus'))
        return 'bus';
    // Add more granular mapping for AI-detected types
    if (lowerType.includes('sedan') || lowerType.includes('hatchback') || lowerType.includes('coupe') || lowerType.includes('wagon') || lowerType.includes('convertible'))
        return 'regular';
    return 'regular';
};
exports.getVehicleTypeFromString = getVehicleTypeFromString;
// Helper function to create rate details object
const createRateDetails = (vehicleType) => {
    return {
        vehicleType: getVehicleTypeFromString(vehicleType),
        isOvernight: false
    };
};
exports.createRateDetails = createRateDetails;
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
                // Create rate details based on vehicle type
                const rateDetails = createRateDetails(vehicleType);
                const session = yield ParkingModel_1.default.create({
                    userId: userId || undefined,
                    vehiclePlateNumber: normalizedPlate,
                    displayPlateNumber: plateNumber || normalizedPlate,
                    vehicleType,
                    parkingLocationId: 'mma2_terminal', // Updated to MMA2
                    status: common_1.ParkingSessionStatus.ACTIVE,
                    entryTime: new Date(),
                    rateDetails: rateDetails, // Store as object for better processing
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
            // Create rate details based on vehicle type
            const rateDetails = createRateDetails(vehicleType);
            const session = yield ParkingModel_1.default.create({
                userId: userId || undefined,
                vehiclePlateNumber: normalizedPlate,
                displayPlateNumber: plateNumber,
                vehicleType,
                parkingLocationId: 'mma2_terminal', // Updated to MMA2
                status: common_1.ParkingSessionStatus.ACTIVE,
                entryTime: new Date(),
                rateDetails: rateDetails, // Store as object for better processing
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
            // Updated fee calculation using the new MMA2 algorithm
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
    // Additional utility method to calculate fee preview
    static calculateFeePreview(entryTime, currentTime, vehicleType) {
        const rateDetails = createRateDetails(vehicleType);
        return calculateParkingFee(entryTime, currentTime, rateDetails);
    }
}
exports.ParkingService = ParkingService;
// Enhanced test utility to describe scenario
function describeScenario(entry, exit, vehicleType) {
    const durationMinutes = Math.round((exit.getTime() - entry.getTime()) / (1000 * 60));
    let durationDesc = '';
    if (durationMinutes < 60)
        durationDesc = `${durationMinutes} minutes`;
    else if (durationMinutes % 60 === 0)
        durationDesc = `${durationMinutes / 60} hours`;
    else
        durationDesc = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;
    // Determine if overnight
    const isOvernight = (entry.getHours() >= 0 && entry.getHours() < 6) || (exit.getHours() >= 0 && exit.getHours() < 6) || (entry.getDate() !== exit.getDate()) || (durationMinutes > 720);
    let scenario = durationDesc;
    if (vehicleType === 'large_bus')
        scenario = 'Large bus';
    else if (isOvernight)
        scenario = 'Overnight';
    else
        scenario += ` ${vehicleType}`;
    const fee = calculateParkingFee(entry, exit, { vehicleType });
    console.log(`${scenario}:`, fee);
}
// Test examples (for development/testing purposes)
console.log("MMA2 Fee Calculator Test Cases:");
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T10:30:00'), 'regular'); // 30 minutes regular
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T11:00:00'), 'regular'); // 60 minutes regular
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T11:30:00'), 'regular'); // 90 minutes regular
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T11:00:00'), 'suv'); // 60 minutes SUV
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T15:00:00'), 'regular'); // 5 hours regular
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-01T12:00:00'), 'large_bus'); // Large bus
describeScenario(new Date('2024-01-01T10:00:00'), new Date('2024-01-02T08:00:00'), 'regular'); // Overnight
//# sourceMappingURL=Parking.js.map