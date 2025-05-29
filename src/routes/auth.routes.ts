import { Router } from 'express';
import { protect } from '../middlewares/auth';
import {
  signUp,
  signIn,
  logout,
  forgotPassword,
  resetPassword,
  refreshToken,
  verifyEmail,
  resendVerificationEmail
} from '../controllers/Auth';

const router = Router();

router.post('/register', signUp);
router.post('/login', signIn);
router.post('/logout', protect, logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:token', resetPassword);
router.get('/me', protect, refreshToken);
router.post('/verify-email', verifyEmail);
router.post('/resend-verification', resendVerificationEmail);

export default router;
