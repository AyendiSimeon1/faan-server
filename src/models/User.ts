import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole } from '../types/common';

export interface IUserPaymentMethod {
  paymentMethodId: string; // From payment gateway like Stripe/Paystack
  provider: string; 
  last4Digits: string;
  expiryMonth: string;
  expiryYear: string;
  isPrimary: boolean;
  addedAt: Date;
}

export interface IUser extends Document {  name: string;
  email: string;
  phoneNumber?: string;
  password?: string; // Optional for guest or social logins initially
  profilePictureUrl?: string;
  role: UserRole;
  isVerified: boolean; // Email/phone verified
  isActive: boolean; // Account status (active/suspended)
  registrationLocation?: string; // e.g., "Abuja"
  
  // Payment & Wallet
  walletId?: mongoose.Types.ObjectId; // Ref to Wallet model
  savedPaymentMethods: IUserPaymentMethod[];
  autoDebitEnabled: boolean;
  defaultPaymentMethodId?: string; // ID of one of the savedPaymentMethods

  // Authentication
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;

  // Methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UserPaymentMethodSchema = new Schema<IUserPaymentMethod>({
    paymentMethodId: { type: String, required: true },
    provider: { type: String, required: true },
    last4Digits: { type: String, required: true },
    expiryMonth: { type: String, required: true },
    expiryYear: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    addedAt: { type: Date, default: Date.now },
}, { _id: false });


const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
    },
    phoneNumber: { type: String, required: true, unique: true, trim: true },
    password: { type: String, select: false }, // Not sent by default
    profilePictureUrl: { type: String, trim: true },
    role: { type: String, enum: Object.values(UserRole), default: UserRole.USER },
    isVerified: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    registrationLocation: { type: String },
    
    walletId: { type: Schema.Types.ObjectId, ref: 'Wallet' },
    savedPaymentMethods: [UserPaymentMethodSchema],
    autoDebitEnabled: { type: Boolean, default: false },
    defaultPaymentMethodId: { type: String },

    lastLogin: { type: Date },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

// Pre-save hook to hash password
UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) {
    return next();
  }
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err: any) {
    next(err);
  }
});

// Method to compare password
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

const UserModel: Model<IUser> = mongoose.model<IUser>('User', UserSchema);
export default UserModel;