import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { topUpWallet, getWalletBalance } from '../controllers/Wallet';
import { UserRole } from '../types/common';

const router = Router();

router.post('/topup', protect, authorize(UserRole.USER, UserRole.AGENT, UserRole.ADMIN), topUpWallet);
router.get('/balance', protect, authorize(UserRole.USER, UserRole.AGENT, UserRole.ADMIN), getWalletBalance);

export default router;
