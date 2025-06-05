import { Request, Response } from 'express';
import { verifyPayment, getPaymentHistory, initiateRefund } from '../services/payment';
// import { ApiError } from '../utils/AppError';
import crypto from 'crypto';
import { config } from '../config';

export const handlePaystackWebhook = async (req: Request, res: Response) => {
  if (!config.PAYSTACK_SECRET_KEY) {
    throw new Error('Paystack secret key is not configured');
  }

  const hash = crypto
    .createHmac('sha512', config.PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== req.headers['x-paystack-signature']) {
    throw new Error('Invalid signature');
  }

  const event = req.body;

  // Handle the event
  switch (event.event) {
    case 'charge.success':
      await verifyPayment(event.data.reference);
      break;
    // Add more cases as needed
  }

  res.sendStatus(200);
};

export const verifyPaymentStatus = async (req: Request, res: Response) => {
  const { reference } = req.params;

  const payment = await verifyPayment(reference);

  res.json({
    status: 'success',
    data: payment
  });
};

export const getUserPaymentHistory = async (req: any, res: any) => {
  if (!req.user) {
    throw new Error('User not authenticated');
  }
  const userId = req.user.id;
  const payments = await getPaymentHistory(userId);

  res.json({
    status: 'success',
    data: payments
  });
};

export const requestRefund = async (req: Request, res: Response) => {
  const { reference } = req.params;
  const { amount } = req.body;

  const refund = await initiateRefund(reference, amount);

  res.json({
    status: 'success',
    data: refund
  });
};
