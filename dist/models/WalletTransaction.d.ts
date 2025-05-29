import mongoose, { Document, Model } from 'mongoose';
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
declare const WalletTransactionModel: Model<IWalletTransaction>;
export default WalletTransactionModel;
