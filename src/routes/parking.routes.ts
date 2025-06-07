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

// Parking session management - Modern API
parkingRouter.post('/session/start/qr', protect, startSessionByQr);
parkingRouter.post('/session/start/plate', protect, startSessionByPlate);
parkingRouter.put('/session/:plateNumber/end', protect, endSessionAndPay);
parkingRouter.get('/sessions/history', protect, getParkingHistory);

// Legacy endpoints - to be deprecated
parkingRouter.post('/sessions', protect, startParkingSession);
parkingRouter.post('/sessions/:sessionId/end', protect, endParkingSession);

// Vehicle image processing
parkingRouter.post('/process-image', protect, upload.single('image'), processCarImage);

export default parkingRouter;
