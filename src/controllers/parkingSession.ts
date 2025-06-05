import { Request, Response } from 'express';
import { ParkingSessionService } from '../services/parkingSession';
import { VehicleType } from '../utils/ParkingFeeCalculator';
import { createPaymentSession } from '../services/payment';
// import { ApiError } from '../utils/ApiError';
import { IUser } from '../models/User';

export const startParkingSession = async (req: any, res: any) => {
  const { vehicleType, plateNumber, qrCode, spotId } = req.body;

  // Validate vehicle type
  if (!Object.values(VehicleType).includes(vehicleType)) {
    throw new Error('Invalid vehicle type');
  }

  // Check if there's already an active session for this plate number
  const existingSession = await ParkingSessionService.getActiveSessionByPlate(plateNumber);
  if (existingSession) {
    throw new Error('Vehicle already has an active parking session');
  }
  const session = await ParkingSessionService.startSession({
    vehicleType,
    plateNumber,
    qrCode,
    spotId
  });

  return res.status(201).json({
    status: 'success',
    data: session
  });
};

export const endParkingSession = async (req: Request, res: Response) => {
  const { sessionId } = req.params;

  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const session = await ParkingSessionService.endSession(sessionId);

  // Create payment session with Paystack
  const paymentSession = await createPaymentSession({
    amount: session.totalAmount!,
    email: req.user.email,
    metadata: {
      sessionId: session.id,
      plateNumber: session.plateNumber
    }
  });

  res.json({
    status: 'success',
    data: {
      session,
      payment: paymentSession
    }
  });
};

export const validateParkingQR = async (req: Request, res: Response) => {
  const { qrCode } = req.body;
  const session = await ParkingSessionService.getActiveSessionByQR(qrCode);
  if (!session) {
    throw new Error('No active parking session found for this QR code');
  }

  res.json({
    status: 'success',
    data: session
  });
};
