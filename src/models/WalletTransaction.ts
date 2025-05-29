import mongoose, { Document, Schema, Model } from 'mongoose';
import { WalletTransactionType, PaymentStatus } from '../types/common';

export interface IWalletTransaction extends Document {
  walletId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  type: WalletTransactionType;
  amount: number; 
  status: PaymentStatus;
  description?: string;
  reference?: string; 
  relatedParkingSessionId?: mongoose.Types.ObjectId;
  relatedPaymentId?: mongoose.Types.ObjectId;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const WalletTransactionSchema = new Schema<IWalletTransaction>(
  {
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet', required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true }, // Denormalized for easier querying
    type: { type: String, enum: Object.values(WalletTransactionType), required: true },
    amount: { type: Number, required: true },
    status: { type: String, enum: Object.values(PaymentStatus), default: PaymentStatus.PENDING },
    description: { type: String },
    reference: { type: String, index: true },
    relatedParkingSessionId: { type: Schema.Types.ObjectId, ref: 'ParkingSession' },
    relatedPaymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true }
);

WalletTransactionSchema.index({ walletId: 1, createdAt: -1 });

const WalletTransactionModel: Model<IWalletTransaction> = mongoose.model<IWalletTransaction>(
  'WalletTransaction',
  WalletTransactionSchema
);
export default WalletTransactionModel;