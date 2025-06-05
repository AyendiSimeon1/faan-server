// import ParkingSessionModel, { IParkingSession } from '../../models/ParkingSession';
// import PaymentModel from '../../models/Payment';
// import WalletModel from '../../models/Wallet';
// import UserModel, { IUser } from '../../models/User';
// import AppError from '../../utils/AppError';
// import { ParkingSessionStatus, PaymentMethodType, PaymentStatus, WalletTransactionType } from '../../common/types';
// import { StartSessionByQrDto, StartSessionByPlateDto, EndSessionDto } from './parking.types';
// import { PaymentGatewayService } from '../../services/payment.gateway.service'; // Conceptual
// import WalletTransactionModel from '../../models/WalletTransaction'; // Import for wallet transactions
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

// Assume a function to calculate parking fee
const calculateParkingFee = (entryTime: Date, exitTime: Date, rateDetails?: string): number => {
  const durationMs = exitTime.getTime() - entryTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  // Example: N200/hr. Implement actual rate logic based on `rateDetails` or location.
  const ratePerHour = parseFloat(rateDetails?.match(/₦(\d+)/)?.[1] || '200');
  return Math.max(ratePerHour, Math.ceil(durationHours * ratePerHour)); // Minimum 1 hour charge or actual
};

export class ParkingService {  static async startSessionByQr(dto: StartSessionByQrDto, userId?: string): Promise<IParkingSession> {
    const { vehicleType, plateNumber } = dto;

    try {
      // Parse and verify the QR code data
      // const parsedQRData = QRCodeService.parseQRCodeData(qrData);
      // if (!QRCodeService.verifyQRCode(parsedQRData)) {
      //   throw new AppError('QR code has expired. Please scan a new code.', 400);
      // }

      // Check for existing active session in this location
    const existingSession = await ParkingSessionModel.findOne({
      // locationId: parsedQRData.locationId,
      status: ParkingSessionStatus.ACTIVE
    });
    // Get the plate number either from the DTO or from user's default vehicle
    let plateNumberToUse = plateNumber;
    if (!plateNumberToUse && userId) {
      const user = await UserModel.findById(userId);
      // Get the user's default vehicle if available
      // TODO: Implement proper vehicle management
      plateNumberToUse = plateNumber || "DEFAULT123"; // This should be replaced with actual vehicle management
    }
    
    if (!plateNumberToUse) {
      throw new AppError("Vehicle plate number is required to start session.", 400);
    }

    const session = await ParkingSessionModel.create({
      userId: userId || undefined,
      vehiclePlateNumber: plateNumberToUse.toUpperCase(),
      vehicleType,
      // parkingLocationId: parsedQRData.locationId,
      status: ParkingSessionStatus.ACTIVE,
      entryTime: new Date(),
      rateDetails: "₦200/hr (standard)", // TODO: Get rate from location configuration
    });
    return session;
    } catch (error) {
      throw error;
    }
  }

  static async startSessionByPlate(dto: StartSessionByPlateDto, userId?: string): Promise<IParkingSession> {
    const { plateNumber, vehicleType } = dto;

    const existingActiveSession = await ParkingSessionModel.findOne({
      vehiclePlateNumber: plateNumber.toUpperCase(),
      status: ParkingSessionStatus.ACTIVE,
    });
    if (existingActiveSession) {
      throw new AppError(`Vehicle ${plateNumber} already has an active parking session.`, 409);
    }

    const session = await ParkingSessionModel.create({
      userId: userId || undefined,
      vehiclePlateNumber: plateNumber.toUpperCase(),
      vehicleType,
      parkingLocationId: 'default_location_plate_entry', // Example
      status: ParkingSessionStatus.ACTIVE,
      entryTime: new Date(),
      rateDetails: "₦200/hr (standard)", // Example
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

  static async endSessionAndPay(dto: EndSessionDto, user: IUser): Promise<{ session: IParkingSession; paymentResult: any; message: string }> {
    const { sessionId, paymentMethodId, paymentMethodType } = dto;

    const session = await ParkingSessionModel.findById(sessionId);
    if (!session) {
      throw new AppError('Parking session not found.', 404);
    }
    if (session.userId?.toString() !== (user._id as mongoose.Types.ObjectId).toString()) {
      throw new AppError('You are not authorized to end this session.', 403);
    }
    if (session.status !== ParkingSessionStatus.ACTIVE && session.status !== ParkingSessionStatus.PENDING_PAYMENT) {
      throw new AppError(`Session cannot be ended. Current status: ${session.status}`, 400);
    }

    session.exitTime = new Date();
    session.durationInMinutes = Math.round((session.exitTime.getTime() - session.entryTime.getTime()) / (1000 * 60));
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

    const paymentRecord = await PaymentModel.create({
        userId: user._id,
        parkingSessionId: session._id,
        amount: session.calculatedFee,
        currency: 'NGN', // Assuming NGN
        paymentMethodType: paymentMethodType === 'card' ? PaymentMethodType.CARD : PaymentMethodType.WALLET,
        status: PaymentStatus.PENDING,
    });

    try {
        if (paymentMethodType === 'wallet') {
            const wallet = await WalletModel.findOne({ userId: user._id });
            if (!wallet || wallet.balance < session.calculatedFee) {
                throw new AppError('Insufficient wallet balance.', 402);
            }
            
            // Deduct from wallet
            wallet.balance -= session.calculatedFee;
            await wallet.save();

            // Record wallet transaction
            await WalletTransactionModel.create({
                walletId: wallet._id,
                userId: user._id,
                type: WalletTransactionType.PARKING_FEE,
                amount: -session.calculatedFee, // Negative for deduction
                status: PaymentStatus.SUCCESSFUL,
                description: `Parking fee for session ${session._id}`,
                relatedParkingSessionId: session._id,
                relatedPaymentId: paymentRecord._id,
            });

            paymentResult = { successful: true, message: "Paid successfully from wallet."};
            finalPaymentStatus = PaymentStatus.SUCCESSFUL;
            paymentRecord.paymentMethodDetails = { provider: 'wallet', walletId: (wallet._id as mongoose.Types.ObjectId).toString() };

        } else if (paymentMethodType === 'card') {
            // Find the specific card from user's saved methods or use a token from client
            const cardToCharge = user.savedPaymentMethods.find(pm => pm.paymentMethodId === paymentMethodId);
            if (!cardToCharge && !paymentMethodId) { // paymentMethodId could be a one-time token
                throw new AppError('Payment method ID required for card payment.', 400);
            }

            const chargeOpts = {
                amount: session.calculatedFee * 100, // To kobo/cents
                currency: 'NGN',
                // source: paymentMethodId, // This would be the gateway's token for the card
                // customerId: user.gatewayCustomerId, // If you store gateway customer IDs
                email: user.email,
                reference: `sess_${session._id}_pay_${paymentRecord._id}`,
                metadata: { sessionId: (session._id as mongoose.Types.ObjectId).toString(), userId: (user._id as mongoose.Types.ObjectId).toString() },
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
        
        session.paymentId = paymentRecord._id as mongoose.Types.ObjectId;
        session.status = finalPaymentStatus === PaymentStatus.SUCCESSFUL ? ParkingSessionStatus.COMPLETED : ParkingSessionStatus.PENDING_PAYMENT; // Revert if failed

    } catch (error: any) {
        session.status = ParkingSessionStatus.PENDING_PAYMENT; // Error occurred, user might need to retry
        paymentRecord.status = PaymentStatus.FAILED;
        if (error instanceof AppError) paymentMessage = error.message;
        else paymentMessage = "An unexpected error occurred during payment processing.";
        await paymentRecord.save();
        // Rethrow or handle gracefully
    } finally {
         await session.save();
    }
    
    // if (finalPaymentStatus !== PaymentStatus.SUCCESSFUL) {
    //     throw new AppError(paymentMessage, 402); // 402 Payment Required
    // }

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
}