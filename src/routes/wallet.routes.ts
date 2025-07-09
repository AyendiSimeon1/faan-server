import { Router } from 'express';
import { protect, authorize } from '../middlewares/auth';
import { topUpWallet, getWalletBalance } from '../controllers/Wallet';
import { UserRole } from '../types/common';

const router = Router();

router.post('/topup', protect, authorize(UserRole.USER, UserRole.AGENT), topUpWallet);
router.get('/balance', protect, authorize(UserRole.USER, UserRole.AGENT), getWalletBalance);

export default router;
