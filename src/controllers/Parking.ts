import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import { ParkingService } from '../services/Parking';
import { StartSessionByQrDto, StartSessionByPlateDto, EndSessionDto } from '../types/Parking';
import { IUser } from '../models/User';

export const startSessionByQr = asyncHandler(async (req: Request, res: Response) => {
  const dto: StartSessionByQrDto = req.body;
  const userId = req.user?._id?.toString();
  const session = await ParkingService.startSessionByQr(dto, userId);
  res.status(201).json({ status: 'success', data: session });
});

export const startSessionByPlate = asyncHandler(async (req: Request, res: Response) => {
  const dto: StartSessionByPlateDto = {
    ...req.body,
    plateNumber: req.body.plateNumber,
    displayPlateNumber: req.body.plateNumber, // preserve original format for display
  };
  const userId = req.user?._id?.toString();
  const session = await ParkingService.startSessionByPlate(dto, userId);
  res.status(201).json({ status: 'success', data: session });
});

export const getSessionDetails = asyncHandler(async (req: Request, res: Response) => {
  const { sessionId } = req.params;
  const userId = req.user?._id?.toString();
  const session = await ParkingService.getParkingSessionById(sessionId, userId);
  res.status(200).json({ status: 'success', data: session });
});

export const endSessionAndPay = asyncHandler(async (req: Request, res: Response) => {
  const secureId = req.params.secureId || req.body.secureId;
  const dto: EndSessionDto = {
    secureId,
    paymentMethodId: req.body.paymentMethodId,
    paymentMethodType: req.body.paymentMethodType
  };
  // No authentication required, so do not pass user
  const result = await ParkingService.endSessionAndPay(dto, undefined);
  res.status(200).json({ status: 'success', data: result });
});

export const getParkingHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id!.toString(); // `protect` middleware ensures user exists
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const history = await ParkingService.getParkingHistory(userId, page, limit);
  res.status(200).json({ status: 'success', data: history });
});

export const getAllEndedSessions = asyncHandler(async (req: Request, res: Response) => {
  // Fetch all sessions with status COMPLETED or ENDED
  const sessions = await ParkingService.getAllEndedSessions();
  res.status(200).json({ status: 'success', data: sessions, results: sessions.length });
});