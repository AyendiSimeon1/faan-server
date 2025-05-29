import mongoose, { Document, Model } from 'mongoose';
import { ParkingSessionStatus } from '../types/common';
export interface IParkingSession extends Document {
    userId?: mongoose.Types.ObjectId;
    vehiclePlateNumber: string;
    vehicleType?: string;
    entryTime: Date;
    exitTime?: Date;
    durationInMinutes?: number;
    parkingLocationId: string;
    parkingSpotIdentifier?: string;
    qrCodeId?: string;
    status: ParkingSessionStatus;
    rateDetails?: string;
    calculatedFee?: number;
    paymentId?: mongoose.Types.ObjectId;
    isAutoDebit: boolean;
    paidByAgentId?: mongoose.Types.ObjectId;
    agentNotes?: string;
    uiStateMetadata?: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
declare const ParkingSessionModel: Model<IParkingSession>;
export default ParkingSessionModel;
