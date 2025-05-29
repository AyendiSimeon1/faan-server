import mongoose, { Document, Schema, Model } from 'mongoose';

export interface IAuthToken extends Document {
  userId: mongoose.Types.ObjectId;
  token: string; // The refresh token itself (hashed in DB)
  expiresAt: Date;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AuthTokenSchema = new Schema<IAuthToken>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    token: { type: String, required: true, index: true }, // Hashed token
    expiresAt: { type: Date, required: true },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

AuthTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-delete expired tokens

const AuthTokenModel: Model<IAuthToken> = mongoose.model<IAuthToken>('AuthToken', AuthTokenSchema);
export default AuthTokenModel;