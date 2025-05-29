import { Router } from 'express';
import parkingRouter from './parking.routes';
import authRoutes from './auth.routes';

const router = Router();

// Mount route handlers
router.use('/parking', parkingRouter);
router.use('/auth', authRoutes);

export default router;
