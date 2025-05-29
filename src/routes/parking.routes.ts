import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  startSessionByQr,
  startSessionByPlate,
  getSessionDetails,
  endSessionAndPay,
  getParkingHistory
} from '../controllers/Parking';

const parkingRouter = Router();

parkingRouter.post('/start-session/qr', protect, startSessionByQr);
parkingRouter.post('/start-session/plate', protect, startSessionByPlate);
parkingRouter.get('/session/:sessionId', protect, getSessionDetails);
parkingRouter.post('/session/:sessionId/end', protect, endSessionAndPay);
parkingRouter.get('/history', protect, getParkingHistory);

export default parkingRouter;
