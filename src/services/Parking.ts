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
import { normalizePlateNumber } from '../utils/ParkingFeeCalculator';

// Assume a function to calculate parking fee
const calculateParkingFee = (entryTime: Date, exitTime: Date, rateDetails?: string): number => {
  const durationMs = exitTime.getTime() - entryTime.getTime();
  const durationHours = durationMs / (1000 * 60 * 60);
  // Example: N200/hr. Implement actual rate logic based on `rateDetails` or location.
  const ratePerHour = parseFloat(rateDetails?.match(/₦(\d+)/)?.[1] || '200');
  return Math.max(ratePerHour, Math.ceil(durationHours * ratePerHour)); // Minimum 1 hour charge or actual
};

export class ParkingService {
  static async startSessionByQr(dto: StartSessionByQrDto, userId?: string): Promise<IParkingSession> {
    const { vehicleType, plateNumber } = dto;

    try {
      // Check for existing active session in this location
      const normalizedPlate = plateNumber ? normalizePlateNumber(plateNumber) : '';
      const existingSession = await ParkingSessionModel.findOne({
        vehiclePlateNumber: normalizedPlate,
        status: ParkingSessionStatus.ACTIVE
      });

      if (existingSession) {
        throw new AppError(`Vehicle ${plateNumber} already has an active parking session.`, 409);
      }

      const session = await ParkingSessionModel.create({
        userId: userId || undefined,
        vehiclePlateNumber: normalizedPlate,
        displayPlateNumber: plateNumber || normalizedPlate,
        vehicleType,
        parkingLocationId: 'default_location_qr_entry', // TODO: Get from QR data
        status: ParkingSessionStatus.ACTIVE,
        entryTime: new Date(),
        rateDetails: "₦200/hr (standard)", // TODO: Get from location config
      });
      return session;
    } catch (error) {
      throw error;
    }
  }

  static async startSessionByPlate(dto: StartSessionByPlateDto, userId?: string): Promise<IParkingSession> {
    const { plateNumber, vehicleType } = dto;
    const normalizedPlate = normalizePlateNumber(plateNumber);

    const existingActiveSession = await ParkingSessionModel.findOne({
      vehiclePlateNumber: normalizedPlate,
      status: ParkingSessionStatus.ACTIVE,
    });

    if (existingActiveSession) {
      throw new AppError(`Vehicle ${plateNumber} already has an active parking session.`, 409);
    }

    const session = await ParkingSessionModel.create({
      userId: userId || undefined,
      vehiclePlateNumber: normalizedPlate,
      displayPlateNumber: plateNumber,
      vehicleType,
      parkingLocationId: 'default_location_plate_entry',
      status: ParkingSessionStatus.ACTIVE,
      entryTime: new Date(),
      rateDetails: "₦200/hr (standard)", // Example rate
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
    const { plateNumber, paymentMethodId, paymentMethodType } = dto;
    const normalizedPlate = normalizePlateNumber(plateNumber);

    // Find active session by normalized plate number
    const session = await ParkingSessionModel.findOne({
      vehiclePlateNumber: normalizedPlate,
      status: ParkingSessionStatus.ACTIVE
    });

    if (!session) {
      throw new AppError('No active parking session found for this vehicle.', 404);
    }

    // Check authorization if the session belongs to a user
    if (session.userId && session.userId.toString() !== user.id) {
      throw new AppError('You are not authorized to end this session.', 403);
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
        userId: user.id,
        parkingSessionId: session.id,
        amount: session.calculatedFee,
        currency: 'NGN',
        paymentMethodType: paymentMethodType === 'card' ? PaymentMethodType.CARD : PaymentMethodType.WALLET,
        status: PaymentStatus.PENDING,
    });

    try {
        if (paymentMethodType === 'wallet') {
            const wallet = await WalletModel.findOne({ userId: user.id });
            if (!wallet || wallet.balance < session.calculatedFee) {
                throw new AppError('Insufficient wallet balance.', 402);
            }
            
            // Deduct from wallet
            wallet.balance -= session.calculatedFee;
            await wallet.save();

            // Record wallet transaction
            await WalletTransactionModel.create({
                walletId: wallet.id,
                userId: user.id,
                type: WalletTransactionType.PARKING_FEE,
                amount: -session.calculatedFee,
                status: PaymentStatus.SUCCESSFUL,
                description: `Parking fee for vehicle ${plateNumber}`,
                relatedParkingSessionId: session.id,
                relatedPaymentId: paymentRecord.id,
            });

            paymentResult = { successful: true, message: "Paid successfully from wallet."};
            finalPaymentStatus = PaymentStatus.SUCCESSFUL;
            paymentRecord.paymentMethodDetails = { provider: 'wallet', walletId: wallet.id };

        } else if (paymentMethodType === 'card') {
            // Find the specific card from user's saved methods or use a token from client
            const cardToCharge = user.savedPaymentMethods.find(pm => pm.paymentMethodId === paymentMethodId);
            if (!cardToCharge && !paymentMethodId) {
                throw new AppError('Payment method ID required for card payment.', 400);
            }

            const chargeOpts = {
                amount: session.calculatedFee,
                currency: 'NGN',
                email: user.email,
                reference: `park_${plateNumber}_${session.id}_${paymentRecord.id}`,
                metadata: { 
                    sessionId: session.id,
                    userId: user.id,
                    plateNumber: plateNumber 
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
}