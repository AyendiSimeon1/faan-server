import { Router } from 'express';
import { protect } from '../middlewares/auth';
import { 
  handlePaystackWebhook, 
  verifyPaymentStatus,
  getUserPaymentHistory,
  requestRefund,
} from '../controllers/payment';

const paymentRouter = Router();

paymentRouter.post('/webhook', handlePaystackWebhook);
paymentRouter.get('/verify/:reference', protect, verifyPaymentStatus);
paymentRouter.get('/history', getUserPaymentHistory);
paymentRouter.post('/refund/:reference', protect, requestRefund);

export default paymentRouter;
