import mongoose, { Document, Model } from 'mongoose';
import { OtpType } from '../types/common';
export interface IOtp extends Document {
    userId?: mongoose.Types.ObjectId;
    identifier: string;
    code: string;
    type: OtpType;
    expiresAt: Date;
    isUsed: boolean;
    createdAt: Date;
    updatedAt: Date;
}
declare const OtpModel: Model<IOtp>;
export default OtpModel;
