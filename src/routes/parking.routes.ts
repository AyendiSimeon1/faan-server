import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  startSessionByQr,
  startSessionByPlate,
  getSessionDetails,
  endSessionAndPay,
  getParkingHistory
} from '../controllers/Parking';
import {
  startParkingSession,
  endParkingSession,
  validateParkingQR
} from '../controllers/parkingSession';
import { generateParkingQRCode } from '../controllers/QRCode';
import { processCarImage } from '../controllers/ImageProcessing';
import { upload } from '../middlewares/upload';

const parkingRouter = Router();

// QR Code generation and validation
parkingRouter.post('/qr-code/generate', protect, generateParkingQRCode);
parkingRouter.post('/qr-code/validate', protect, validateParkingQR);

// Parking session management
parkingRouter.post('/sessions', protect, startParkingSession);
parkingRouter.post('/sessions/:sessionId/end', protect, endParkingSession);

// Vehicle image processing
parkingRouter.post('/process-image', protect, upload.single('image'), processCarImage);

// Legacy routes
parkingRouter.post('/start-session/qr', protect, startSessionByQr);
parkingRouter.post('/start-session/plate', protect, startSessionByPlate);
parkingRouter.post('/process-car-image', protect, upload.single('image'), processCarImage);
parkingRouter.get('/session/:sessionId', protect, getSessionDetails);
parkingRouter.post('/session/:sessionId/end', protect, endSessionAndPay);
parkingRouter.get('/history', protect, getParkingHistory);

export default parkingRouter;
