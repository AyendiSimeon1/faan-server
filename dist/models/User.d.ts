import mongoose, { Document, Model } from 'mongoose';
import { UserRole } from '../types/common';
export interface IUserPaymentMethod {
    paymentMethodId: string;
    provider: string;
    last4Digits: string;
    expiryMonth: string;
    expiryYear: string;
    isPrimary: boolean;
    addedAt: Date;
}
export interface IUser extends Document {
    name: string;
    email: string;
    phoneNumber?: string;
    password?: string;
    profilePictureUrl?: string;
    role: UserRole;
    isVerified: boolean;
    isActive: boolean;
    registrationLocation?: string;
    walletId?: mongoose.Types.ObjectId;
    savedPaymentMethods: IUserPaymentMethod[];
    autoDebitEnabled: boolean;
    defaultPaymentMethodId?: string;
    lastLogin?: Date;
    passwordResetToken?: string;
    passwordResetExpires?: Date;
    createdAt: Date;
    updatedAt: Date;
    comparePassword(candidatePassword: string): Promise<boolean>;
}
declare const UserModel: Model<IUser>;
export default UserModel;
