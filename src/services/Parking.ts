import mongoose from 'mongoose';
import ParkingSessionModel, { IParkingSession } from '../models/ParkingModel';
import PaymentModel from '../models/Payment';
import UserModel, { IUser } from '../models/User';
import WalletModel from '../models/Wallet';
import WalletTransactionModel from '../models/WalletTransaction';
import { QRCodeService } from './qrcode';
import { ParkingSessionStatus, PaymentStatus, PaymentMethodType, WalletTransactionType } from '../types/common';
import { StartSessionByQrDto, StartSessionByPlateDto, EndSessionDto } from '../types/Parking';
import AppError from '../utils/AppError';
import { PaymentGatewayService } from './payment.gateway';


interface RateDetails {
  vehicleType?: 'suv' | 'bus' | 'large_bus' | 'regular';
  isOvernight?: boolean;
  customRates?: any;
}

// Updated MMA2 parking fee calculation function
const calculateParkingFee = (entryTime: Date, exitTime: Date, rateDetails?: string | RateDetails): number => {
  const durationInMinutes = Math.round((exitTime.getTime() - entryTime.getTime()) / (1000 * 60));
  
  // Handle invalid duration
  if (durationInMinutes <= 0) {
    return 0;
  }

  // Parse rate details - handle both string and object formats
  let parsedRateDetails: RateDetails = {};
  
  if (typeof rateDetails === 'string') {
    // Try to extract vehicle type from string format
    const lowerRateDetails = rateDetails.toLowerCase();
    if (lowerRateDetails.includes('suv')) {
      parsedRateDetails.vehicleType = 'suv';
    } else if (lowerRateDetails.includes('bus') && lowerRateDetails.includes('large')) {
      parsedRateDetails.vehicleType = 'large_bus';
    } else if (lowerRateDetails.includes('bus')) {
      parsedRateDetails.vehicleType = 'bus';
    } else {
      parsedRateDetails.vehicleType = 'regular';
    }
  } else if (rateDetails && typeof rateDetails === 'object') {
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
    } else {
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

// Helper function to determine vehicle type from string
const getVehicleTypeFromString = (vehicleType?: string): 'suv' | 'bus' | 'large_bus' | 'regular' => {
  if (!vehicleType) return 'regular';
  const lowerType = vehicleType.toLowerCase();
  if (lowerType.includes('suv')) return 'suv';
  if (lowerType.includes('large') && lowerType.includes('bus')) return 'large_bus';
  if (lowerType.includes('bus')) return 'bus';
  // Add more granular mapping for AI-detected types
  if (lowerType.includes('sedan') || lowerType.includes('hatchback') || lowerType.includes('coupe') || lowerType.includes('wagon') || lowerType.includes('convertible')) return 'regular';
  return 'regular';
};

// Helper function to create rate details object
const createRateDetails = (vehicleType?: string): RateDetails => {
  return {
    vehicleType: getVehicleTypeFromString(vehicleType),
    isOvernight: false
  };
};

export class ParkingService {
  static async startSessionByQr(dto: StartSessionByQrDto, userId?: string): Promise<IParkingSession> {
    const { vehicleType, plateNumber } = dto;
    // Generate a unique 4-digit secureId
    const secureId = (Math.floor(1000 + Math.random() * 9000)).toString();
    // Check for existing active session for this user (optional, or by plate if you want to keep it)
    // You may want to allow multiple sessions for different secureIds
    // Create rate details based on vehicle type
    const rateDetails = createRateDetails(vehicleType);
    const session = await ParkingSessionModel.create({
      userId: userId || undefined,
      vehiclePlateNumber: plateNumber,
      displayPlateNumber: plateNumber,
      vehicleType,
      parkingLocationId: 'mma2_terminal', // Updated to MMA2
      status: ParkingSessionStatus.ACTIVE,
      entryTime: new Date(),
      rateDetails: rateDetails, // Store as object for better processing
      secureId
    });
    return session;
  }

  static async startSessionByPlate(dto: StartSessionByPlateDto, userId?: string): Promise<IParkingSession> {
    const { plateNumber, vehicleType } = dto;
    // Generate a unique 4-digit secureId
    // const secureId = (Math.floor(1000 + Math.random() * 9000)).toString();
    const secureId = (Math.floor(100000 + Math.random() * 900000)).toString();
    // Create rate details based on vehicle type
    const rateDetails = createRateDetails(vehicleType);
    const session = await ParkingSessionModel.create({
      userId: userId || undefined,
      vehiclePlateNumber: plateNumber,
      displayPlateNumber: plateNumber,
      vehicleType,
      parkingLocationId: 'mma2_terminal', // Updated to MMA2
      status: ParkingSessionStatus.ACTIVE,
      entryTime: new Date(),
      rateDetails: rateDetails, // Store as object for better processing
      secureId
    });
    return session;
  }

  static async getParkingSessionById(sessionId: string, userId?: string): Promise<IParkingSession> {
    const query: any = { _id: sessionId };
    if (userId) query.userId = userId; // Ensure user can only access their sessions

    const session = await ParkingSessionModel.findOne(query);
    if (!session) {
      throw new AppError('Parking session not found.', 404);
    }
    
    // If session is active, calculate current fee "so far"
    if (session.status === ParkingSessionStatus.ACTIVE) {
        session.calculatedFee = calculateParkingFee(session.entryTime, new Date(), session.rateDetails);
        // Note: This calculatedFee is transient for display, not saved unless explicitly done
    }
    return session;
  }

  static async endSessionAndPay(dto: EndSessionDto, user?: IUser): Promise<{ session: IParkingSession; paymentResult: any; message: string }> {
    const { secureId, paymentMethodId, paymentMethodType } = dto;

    // Find active session by secureId
    const session = await ParkingSessionModel.findOne({
      secureId,
      status: ParkingSessionStatus.ACTIVE
    });

    if (!session) {
      throw new AppError('No active parking session found for this secure ID.', 404);
    }

    // Only check user authorization if user is present
    if (user && session.userId && session.userId.toString() !== user.id) {
      throw new AppError('You are not authorized to end this session.', 403);
    }

    session.exitTime = new Date();
    session.durationInMinutes = Math.round((session.exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60));
    
    // Updated fee calculation using the new MMA2 algorithm
    session.calculatedFee = calculateParkingFee(session.entryTime, session.exitTime, session.rateDetails);
    
    if (session.calculatedFee <= 0) { // Free parking or error
        session.status = ParkingSessionStatus.COMPLETED;
        await session.save();
        return { session, paymentResult: null, message: 'Parking session ended (no fee).'}
    }

    session.status = ParkingSessionStatus.LOADING_EXIT; // Set to loading while processing payment
    await session.save();

    let paymentResult: any;
    let paymentMessage = "Payment processing initiated.";
    let finalPaymentStatus = PaymentStatus.PENDING;

    // Only allow wallet payment if user is present
    if (!user && paymentMethodType === 'wallet') {
      throw new AppError('Wallet payment requires login. Please use card payment.', 401);
    }

    // For guest/anonymous, set a default email for card payments if not provided
    let payerEmail = user ? user.email : (dto as any).email || 'konsizeinc@gmail.com';

    const paymentRecord = await PaymentModel.create({
        userId: user ? user.id : undefined,
        parkingSessionId: session.id,
        amount: session.calculatedFee,
        currency: 'NGN',
        paymentMethodType: paymentMethodType === 'card' ? PaymentMethodType.CARD : PaymentMethodType.WALLET,
        status: PaymentStatus.PENDING,
    });

    try {
        if (paymentMethodType === 'wallet') {
            const wallet = await WalletModel.findOne({ userId: user!.id });
            if (!wallet || wallet.balance < session.calculatedFee) {
                throw new AppError('Insufficient wallet balance.', 402);
            }
            
            // Deduct from wallet
            wallet.balance -= session.calculatedFee;
            await wallet.save();

            // Record wallet transaction
            await WalletTransactionModel.create({
                walletId: wallet.id,
                userId: user!.id,
                type: WalletTransactionType.PARKING_FEE,
                amount: -session.calculatedFee,
                status: PaymentStatus.SUCCESSFUL,
                description: `Parking fee for session ${secureId}`,
                relatedParkingSessionId: session.id,
                relatedPaymentId: paymentRecord.id,
            });

            paymentResult = { successful: true, message: "Paid successfully from wallet."};
            finalPaymentStatus = PaymentStatus.SUCCESSFUL;
            paymentRecord.paymentMethodDetails = { provider: 'wallet', walletId: wallet.id };

        } else if (paymentMethodType === 'card') {
            // For guests, require paymentMethodId/token from client
            let cardToCharge = user ? user.savedPaymentMethods.find(pm => pm.paymentMethodId === paymentMethodId) : undefined;
            if (!cardToCharge && !paymentMethodId) {
                throw new AppError('Payment method ID required for card payment.', 400);
            }

            const chargeOpts = {
                amount: session.calculatedFee,
                currency: 'NGN',
                email: payerEmail,
                reference: `park_${secureId}_${session.id}_${paymentRecord.id}`,
                metadata: { 
                    sessionId: session.id,
                    userId: user ? user.id : undefined,
                    secureId: secureId 
                },
            };
            const gwResult = await PaymentGatewayService.chargeCard(chargeOpts);
            paymentResult = gwResult;

            if (gwResult.successful) {
                finalPaymentStatus = PaymentStatus.SUCCESSFUL;
            } else {
                finalPaymentStatus = PaymentStatus.FAILED;
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
        await paymentRecord.save();
        
        session.paymentId = paymentRecord.id as unknown as mongoose.Types.ObjectId;
        session.status = finalPaymentStatus === PaymentStatus.SUCCESSFUL ? ParkingSessionStatus.COMPLETED : ParkingSessionStatus.PENDING_PAYMENT;

    } catch (error: any) {
        session.status = ParkingSessionStatus.PENDING_PAYMENT;
        paymentRecord.status = PaymentStatus.FAILED;
        if (error instanceof AppError) paymentMessage = error.message;
        else paymentMessage = "An unexpected error occurred during payment processing.";
        await paymentRecord.save();
    } finally {
        await session.save();
    }

    return { session, paymentResult, message: finalPaymentStatus === PaymentStatus.SUCCESSFUL ? "Payment successful. Session ended." : paymentMessage };
  }

  static async getParkingHistory(userId: string, page: number = 1, limit: number = 10): Promise<{ sessions: IParkingSession[], total: number, currentPage: number, totalPages: number }> {
    const skip = (page - 1) * limit;
    const total = await ParkingSessionModel.countDocuments({ userId, status: { $in: [ParkingSessionStatus.COMPLETED, ParkingSessionStatus.PAID_BY_AGENT] } });
    const sessions = await ParkingSessionModel.find({ userId, status: { $in: [ParkingSessionStatus.COMPLETED, ParkingSessionStatus.PAID_BY_AGENT] } })
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
  }

  static async getAllEndedSessions(): Promise<IParkingSession[]> {
    return ParkingSessionModel.find({ status: { $in: [ParkingSessionStatus.COMPLETED, ParkingSessionStatus.ENDED] } })
      .sort({ exitTime: -1, entryTime: -1 })
      .populate('paymentId', 'amount paymentMethodType status receiptUrl');
  }

  // Additional utility method to calculate fee preview
  static calculateFeePreview(entryTime: Date, currentTime: Date, vehicleType?: string): number {
    const rateDetails = createRateDetails(vehicleType);
    return calculateParkingFee(entryTime, currentTime, rateDetails);
  }
}

// Export the fee calculation function for use in other modules
export { calculateParkingFee, createRateDetails, getVehicleTypeFromString };

// Enhanced test utility to describe scenario
function describeScenario(entry: Date, exit: Date, vehicleType: 'regular' | 'suv' | 'bus' | 'large_bus') {
  const durationMinutes = Math.round((exit.getTime() - entry.getTime()) / (1000 * 60));
  let durationDesc = '';
  if (durationMinutes < 60) durationDesc = `${durationMinutes} minutes`;
  else if (durationMinutes % 60 === 0) durationDesc = `${durationMinutes / 60} hours`;
  else durationDesc = `${Math.floor(durationMinutes / 60)}h ${durationMinutes % 60}m`;

  // Determine if overnight
  const isOvernight = (entry.getHours() >= 0 && entry.getHours() < 6) || (exit.getHours() >= 0 && exit.getHours() < 6) || (entry.getDate() !== exit.getDate()) || (durationMinutes > 720);
  let scenario = durationDesc;
  if (vehicleType === 'large_bus') scenario = 'Large bus';
  else if (isOvernight) scenario = 'Overnight';
  else scenario += ` ${vehicleType}`;

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