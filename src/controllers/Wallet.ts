import { Request, Response } from 'express';
import asyncHandler from '../middlewares/asyncHandler';
import WalletModel from '../models/Wallet';
import UserModel from '../models/User';

// Top up wallet
export const topUpWallet = asyncHandler(async (req: Request, res: Response) => {
  const { amount } = req.body;
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!numericAmount || numericAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

  let wallet = await WalletModel.findOne({ userId });
  if (!wallet) {
    wallet = new WalletModel({ userId, balance: 0 });
  }
  wallet.balance += numericAmount;
  await wallet.save();
  return res.json({ status: 'success', balance: wallet.balance });
});

// Get wallet balance
export const getWalletBalance = asyncHandler(async (req: Request, res: Response) => {
  const userId = req.user?._id;
  if (!userId) return res.status(401).json({ error: 'Unauthorized' });
  const wallet = await WalletModel.findOne({ userId });
  return res.json({ status: 'success', balance: wallet?.balance || 0 });
});
