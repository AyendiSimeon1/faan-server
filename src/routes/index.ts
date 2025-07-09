import { Router } from 'express';
import parkingRouter from './parking.routes';
import authRoutes from './auth.routes';
import paymentRouter from './payment.routes';
import walletRouter from './wallet.routes';

const router = Router();

// Mount route handlers
router.use('/parking', parkingRouter);
router.use('/auth', authRoutes);
router.use('/payments', paymentRouter);
router.use('/wallet', walletRouter);

export default router;
