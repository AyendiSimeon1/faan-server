import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IWallet extends Document {
  userId: mongoose.Types.ObjectId;
  balance: number;
  currency: string; // e.g., 'NGN'
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const WalletSchema = new Schema<IWallet>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    balance: { type: Number, required: true, default: 0, min: 0 },
    currency: { type: String, required: true, default: 'NGN' },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const WalletModel: Model<IWallet> = mongoose.model<IWallet>('Wallet', WalletSchema);
export default WalletModel;