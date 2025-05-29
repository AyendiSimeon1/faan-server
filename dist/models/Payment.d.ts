import mongoose, { Document, Model } from 'mongoose';
import { PaymentMethodType, PaymentStatus } from '../types/common';
export interface IPayment extends Document {
    userId?: mongoose.Types.ObjectId;
    parkingSessionId: mongoose.Types.ObjectId;
    amount: number;
    currency: string;
    paymentMethodType: PaymentMethodType;
    paymentMethodDetails?: {
        provider?: string;
        last4Digits?: string;
        walletId?: string;
    };
    status: PaymentStatus;
    gatewayReference?: string;
    gatewayResponse?: Record<string, any>;
    receiptUrl?: string;
    processedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
declare const PaymentModel: Model<IPayment>;
export default PaymentModel;
