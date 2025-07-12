import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../types/common';
import {
  startSessionByQr,
  startSessionByPlate,
  getSessionDetails,
  endSessionAndPay,
  getParkingHistory,
  getAllEndedSessions
} from '../controllers/Parking';
import {
  startParkingSession,
  endParkingSession,
  validateParkingQR
} from '../controllers/parkingSession';
import { generateParkingQRCode } from '../controllers/QRCode';
import { processCarImage } from '../controllers/ImageProcessing';
import { upload } from '../middlewares/upload';
import { getAllPaymentsController } from '../controllers/payment';

const parkingRouter = Router();

parkingRouter.post('/qr-code/generate', protect, authorize(UserRole.ADMIN), generateParkingQRCode);
parkingRouter.post('/qr-code/validate', protect, authorize(UserRole.ADMIN), validateParkingQR);


parkingRouter.post('/session/start/qr', protect, authorize(UserRole.ADMIN), startSessionByQr);
parkingRouter.post('/session/start/plate', protect, authorize(UserRole.ADMIN), startSessionByPlate);
parkingRouter.put('/session/:secureId/end', protect, endSessionAndPay); // Add protect before authorize
parkingRouter.get('/sessions/history', protect, authorize(UserRole.ADMIN), getParkingHistory);


parkingRouter.post('/sessions/end', protect, authorize(UserRole.USER, UserRole.AGENT, UserRole.ADMIN), endParkingSession);

parkingRouter.post('/sessions', protect,  startParkingSession);
parkingRouter.post('/sessions/:sessionId/end', protect, authorize(UserRole.USER, UserRole.AGENT, UserRole.ADMIN), endParkingSession); // Add protect before authorize


parkingRouter.post('/process-image',  upload.single('image'), authorize(UserRole.USER, UserRole.AGENT, UserRole.ADMIN), processCarImage);


parkingRouter.get('/payments/all',  getAllPaymentsController);

parkingRouter.get('/sessions/ended',  getAllEndedSessions);

export default parkingRouter;
