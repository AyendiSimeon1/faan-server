import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import { ParkingService } from '../services/Parking';
import { StartSessionByQrDto, StartSessionByPlateDto, EndSessionDto } from '../types/Parking';
import { IUser } from '../models/User';
import '../types/express';

export const startSessionByQr = asyncHandler(async (req: Request, res: Response) => {
  const dto: StartSessionByQrDto = req.body;
  const userId = req.user?._id?.toString();
  const session = await ParkingService.startSessionByQr(dto, userId);
  res.status(201).json({ status: 'success', data: session });
});

export const startSessionByPlate = asyncHandler(async (req: Request, res: Response) => {
  const dto: StartSessionByPlateDto = req.body;
  const userId = req.user?._id?.toString(); // Can be undefined for guest access
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
  const dto: EndSessionDto = req.body;
  dto.sessionId = req.params.sessionId; // Get sessionId from URL param
  const user = req.user as IUser; // `protect` middleware ensures user exists

  const result = await ParkingService.endSessionAndPay(dto, user);
  res.status(200).json({ status: 'success', data: result });
});

export const getParkingHistory = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user!._id!.toString(); // `protect` middleware ensures user exists
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const history = await ParkingService.getParkingHistory(userId, page, limit);
  res.status(200).json({ status: 'success', data: history });
});