import mongoose, { Document, Schema, Model } from 'mongoose';
import { ParkingSessionStatus } from '../types/common';

export interface IParkingSession extends Document {
  userId?: mongoose.Types.ObjectId; // Nullable for guest sessions
  vehiclePlateNumber: string; // Normalized plate number (no spaces)
  displayPlateNumber: string; // Original format with spaces for display
  vehicleType?: string; // e.g., "G-wagon 360"
  
  entryTime: Date;
  exitTime?: Date;
  durationInMinutes?: number; // Calculated or stored on exit

  parkingLocationId: string; // Identifier for the parking facility/zone
  parkingSpotIdentifier?: string; // Specific spot if applicable

  qrCodeId?: string; // If QR code is used for entry/exit

  status: ParkingSessionStatus;
  
  // Cost details
  rateDetails?: any; // Allow object or string for flexibility
  calculatedFee?: number;
  
  // Payment details
  paymentId?: mongoose.Types.ObjectId; // Ref to Payment model
  isAutoDebit: boolean; 

  // Agent details (if paid by agent)
  paidByAgentId?: mongoose.Types.ObjectId; // Ref to User (Agent)
  agentNotes?: string;

  // For UI states like "Ready to leave?" loading screen
  uiStateMetadata?: Record<string, any>; 

  // Secure session management
  secureId: string; // Unique code for session end

  createdAt: Date;
  updatedAt: Date;
}

const ParkingSessionSchema = new Schema<IParkingSession>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    vehiclePlateNumber: { type: String, required: true, uppercase: true, trim: true, index: true },
    displayPlateNumber: { type: String, required: true, trim: true }, // New field for display plate number
    vehicleType: { type: String },
    
    entryTime: { type: Date, required: true, default: Date.now },
    exitTime: { type: Date },
    durationInMinutes: { type: Number },
    
    parkingLocationId: { type: String, required: true, default: 'default_location' }, // Could be ObjectId if locations are managed entities
    parkingSpotIdentifier: { type: String },

    qrCodeId: { type: String, unique: true, sparse: true }, // Sparse for optional unique field

    status: { 
      type: String, 
      enum: Object.values(ParkingSessionStatus), 
      required: false, 
      default: ParkingSessionStatus.ACTIVE,
      validate: {
        validator: function(v: string) {
          return Object.values(ParkingSessionStatus).includes(v as ParkingSessionStatus);
        },
        message: (props: any) => `${props.value} is not a valid parking session status`
      }
    },
    
    rateDetails: { type: Schema.Types.Mixed }, // Allow object or string
    calculatedFee: { type: Number },
    
    paymentId: { type: Schema.Types.ObjectId, ref: 'Payment' },
    isAutoDebit: { type: Boolean, default: false },

    paidByAgentId: { type: Schema.Types.ObjectId, ref: 'User' },
    agentNotes: { type: String },

    uiStateMetadata: {type: Schema.Types.Mixed},

    // Make secureId not required, but unique when present
    secureId: { 
      type: String, 
      unique: true,
      sparse: true // This allows multiple null values but unique non-null values
    },
  },
  { timestamps: true }
);

ParkingSessionSchema.index({ userId: 1, status: 1 });
ParkingSessionSchema.index({ vehiclePlateNumber: 1, status: 1 });

// Pre-save hook to generate secureId if not present - FIXED to use 4-digit generation
ParkingSessionSchema.pre('save', function(next) {
  if (!this.secureId) {
    this.secureId = (Math.floor(1000 + Math.random() * 9000)).toString();
  }
  next();
});

const ParkingSessionModel: Model<IParkingSession> = mongoose.model<IParkingSession>(
  'ParkingSession',
  ParkingSessionSchema
);
export default ParkingSessionModel;