import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import { QRCodeService } from '../services/qrcode';
import AppError from '../utils/AppError';

export const generateParkingQRCode = asyncHandler(async (req: Request, res: Response) => {
  const { locationId, spotId } = req.body;
  
  if (!locationId) {
    throw new AppError('Location ID is required', 400);
  }

  const qrData = QRCodeService.generateQRCodeData(locationId, spotId);
  const qrCodeDataUrl = await QRCodeService.generateQRCodeDataURL(qrData);

  res.status(200).json({
    status: 'success',
    data: {
      qrCodeDataUrl,
      expiresAt: new Date(qrData.timestamp + 5 * 60 * 1000), // 5 minutes from generation
      locationId,
      spotId
    }
  });
});
