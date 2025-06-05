import axios from "axios";
import { ObjectId } from "mongodb";
import { config } from "../config";
import mongoose from 'mongoose';

interface Payment {
    _id?: ObjectId;
    amount: number;
    reference: string;
    parkingSessionId: ObjectId;
    status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
    metadata?: any;
    createdAt: Date;
    updatedAt: Date;
}

interface ParkingSession {
    _id?: ObjectId;
    userId: string;
    paid: boolean;
}

// const payments = db.collection<Payment>('payments');
// const parkingSessions = db.collection<ParkingSession>('parkingSessions');
// import axios from 'axios';
// import { config } from '../config';
// import { ApiError } from '../utils/ApiError';
// import { ObjectId } from 'mongodb';
// import { db } from '../config/mongodb';

const PAYSTACK_SECRET_KEY = 'dasdfasdfadf';
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

const payments = mongoose.connection.collection<Payment>('payments');
const parkingSessions = mongoose.connection.collection<ParkingSession>('parkingSessions');

interface CreatePaymentSessionDto {
  amount: number;
  email: string;
  metadata: {
    sessionId: string;
    plateNumber: string;
  };
}

export const createPaymentSession = async (data: CreatePaymentSessionDto) => {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        amount: data.amount * 100, // Convert to kobo
        email: data.email,
        metadata: data.metadata,
        callback_url: `${config.BASE_URL}/api/v1/payments/verify`
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );    // Create payment record
    const payment = await payments.insertOne({
      amount: data.amount,
      reference: response.data.data.reference,
      parkingSessionId: new ObjectId(data.metadata.sessionId),
      status: 'PENDING',
      metadata: response.data.data,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    return { 
      ...response.data.data,
      paymentId: payment.insertedId
    };
  } catch (error) {
    throw new Error('Failed to initialize payment');
  }
};

export const verifyPayment = async (reference: string) => {
  try {
    const response = await axios.get(
      `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
        }
      }
    );

    const { status } = response.data.data;    // Update payment record
    const payment = await payments.findOneAndUpdate(
      { reference },
      { 
        $set: {
          status: status === 'success' ? 'COMPLETED' : 'FAILED',
          metadata: response.data.data,
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!payment) {
      throw new Error('Payment record not found');
    }

    // If payment successful, update parking session
    if (status === 'success') {
      await parkingSessions.updateOne(
        { _id: payment.parkingSessionId },
        { 
          $set: {
            paid: true,
            updatedAt: new Date()
          }
        }
      );
    }

    return payment;
  } catch (error) {
    throw new Error('Failed to verify payment');
  }
};

export const initiateRefund = async (reference: string, amount?: number) => {
  try {
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/refund`,
      {
        transaction: reference,
        amount: amount ? amount * 100 : undefined // Convert to kobo if amount specified
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );    // Update payment record
    const payment = await payments.findOneAndUpdate(
      { reference },
      {
        $set: {
          status: 'REFUNDED',
          metadata: {
            ...response.data.data,
            refundedAt: new Date()
          },
          updatedAt: new Date()
        }
      },
      { returnDocument: 'after' }
    );

    if (!payment) {
      throw new Error('Payment record not found');
    }

    return response.data.data;
  } catch (error) {
    throw new Error('Failed to initiate refund');
  }
};

export const getPaymentHistory = async (userId: string) => {
  const userPayments = await payments
    .aggregate([
      {
        $lookup: {
          from: 'parkingSessions',
          localField: 'parkingSessionId',
          foreignField: '_id',
          as: 'parkingSession'
        }
      },
      {
        $match: {
          'parkingSession.userId': new ObjectId(userId)
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $unwind: '$parkingSession'
      }
    ])
    .toArray();

  return userPayments;
};
