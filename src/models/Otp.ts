import mongoose, { Document, Schema, Model } from 'mongoose';
import { OtpType } from '../types/common';


export interface IOtp extends Document {
  userId?: mongoose.Types.ObjectId; // If tied to a registered user
  identifier: string; // Phone number or email
  code: string;
  type: OtpType;
  expiresAt: Date;
  isUsed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const OtpSchema = new Schema<IOtp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    identifier: { type: String, required: true, trim: true }, // e.g. phone number or email
    code: { type: String, required: true },
    type: { type: String, enum: Object.values(OtpType), required: true },
    expiresAt: { type: Date, required: true },
    isUsed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// TTL index for automatic deletion of expired OTPs
OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const OtpModel: Model<IOtp> = mongoose.model<IOtp>('Otp', OtpSchema);
export default OtpModel;