import mongoose, { Document, Model } from 'mongoose';
export interface IAuthToken extends Document {
    userId: mongoose.Types.ObjectId;
    token: string;
    expiresAt: Date;
    ipAddress?: string;
    userAgent?: string;
    createdAt: Date;
    updatedAt: Date;
}
declare const AuthTokenModel: Model<IAuthToken>;
export default AuthTokenModel;
