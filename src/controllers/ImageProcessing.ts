import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import { ImageProcessingService } from '../services/imageProcessing';
import AppError from '../utils/AppError';

// Extend Express Request to include file from multer
interface MulterRequest extends Request {
  file?: Express.Multer.File;
}

export const processCarImage = asyncHandler(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('No image file provided', 400);
  }

  const result = await ImageProcessingService.processCarImage(req.file.buffer);

  res.status(200).json({
    status: 'success',
    data: result
  });
});