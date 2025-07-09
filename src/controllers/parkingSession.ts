import { Request, Response } from 'express';
import { ParkingSessionService } from '../services/parkingSession';
import { VehicleType } from '../utils/ParkingFeeCalculator';
import { createPaymentSession } from '../services/payment';
// import { ApiError } from '../utils/ApiError';
import { IUser } from '../models/User';
import asyncHandler from '../middlewares/asyncHandler';

export const startParkingSession = asyncHandler(async (req: any, res: any) => {
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
    secureId: session.secureId, // Top-level secureId
    data: session
  });
});

export const endParkingSession = asyncHandler(async (req: Request, res: Response) => {
  const { secureId } = req.body;

  if (!req.user) {
    throw new Error('User not authenticated');
  }

  const session = await ParkingSessionService.endSession(secureId);

  // Create payment session with Paystack
  const paymentSession = await createPaymentSession({
    amount: session.totalAmount!,
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
});

export const validateParkingQR = asyncHandler(async (req: Request, res: Response) => {
  const { qrCode } = req.body;
  const session = await ParkingSessionService.getActiveSessionByQR(qrCode);
  if (!session) {
    throw new Error('No active parking session found for this QR code');
  }

  res.json({
    status: 'success',
    data: session
  });
});
