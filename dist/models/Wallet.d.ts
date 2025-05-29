import mongoose, { Document, Model } from 'mongoose';
export interface IWallet extends Document {
    userId: mongoose.Types.ObjectId;
    balance: number;
    currency: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const WalletModel: Model<IWallet>;
export default WalletModel;
