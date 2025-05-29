import mongoose, { Document, Schema, Model } from 'mongoose';
import { PaymentMethodType, PaymentStatus } from '../types/common';

export interface IPayment extends Document {
  userId?: mongoose.Types.ObjectId; // Nullable for guest payments
  parkingSessionId: mongoose.Types.ObjectId;
  
  amount: number;
  currency: string;
  
  paymentMethodType: PaymentMethodType;
  paymentMethodDetails?: { // Denormalized for quick display on receipts
    provider?: string; // e.g., 'visa', 'mastercard', 'wallet'
    last4Digits?: string;
    walletId?: string; 
  };
  
  status: PaymentStatus;
  gatewayReference?: string; // From payment gateway
  gatewayResponse?: Record<string, any>; // Full response for debugging/auditing
  receiptUrl?: string; // If gateway provides one
  
  processedAt?: Date; // When payment moved from PENDING to a final state
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    parkingSessionId: { type: Schema.Types.ObjectId, ref: 'ParkingSession', required: true },
    
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'NGN' },
    
    paymentMethodType: { type: String, enum: Object.values(PaymentMethodType), required: true },
    paymentMethodDetails: {
      provider: { type: String },
      last4Digits: { type: String },
      walletId: { type: String },
    },
    
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    gatewayReference: { type: String, index: true, unique: true, sparse: true },
    gatewayResponse: { type: Schema.Types.Mixed },
    receiptUrl: { type: String },
    
    processedAt: { type: Date },
  },
  { timestamps: true }
);

PaymentSchema.index({ parkingSessionId: 1 });
PaymentSchema.index({ userId: 1, status: 1 });

const PaymentModel: Model<IPayment> = mongoose.model<IPayment>('Payment', PaymentSchema);
export default PaymentModel;