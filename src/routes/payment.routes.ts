import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { UserRole } from '../types/common';
import { 
  handlePaystackWebhook, 
  verifyPaymentStatus,
  getUserPaymentHistory,
  requestRefund,
  getAllPaymentsController
} from '../controllers/payment';

const paymentRouter = Router();

paymentRouter.post('/webhook',  handlePaystackWebhook);
paymentRouter.put('/verify/:reference', protect,  verifyPaymentStatus);
paymentRouter.get('/history', protect,  getUserPaymentHistory);
paymentRouter.post('/refund/:reference', protect,  requestRefund);
paymentRouter.get('/all-payments', protect,  getAllPaymentsController);
export default paymentRouter;

