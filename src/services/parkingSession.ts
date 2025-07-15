import { ObjectId, WithId } from 'mongodb';
import { VehicleType, ParkingSession, ParkingFeeCalculator } from '../utils/ParkingFeeCalculator';
import { getDB } from '../config/mongodb';
import crypto from 'crypto';
import ParkingSessionModel from '../models/ParkingModel';
import { ParkingSessionStatus } from '../types/common';

interface IParkingSession {
  id: string;
  _id?: ObjectId;
  vehicleType: VehicleType;
  plateNumber: string;
  qrCode?: string;
  spotId?: string;
  entryTime: Date;
  exitTime?: Date;
  status: 'ACTIVE' | 'ENDED';
  totalAmount?: number;
  userId?: ObjectId;
  createdAt: Date;
  updatedAt: Date;
  secureId: string; // Unique code for secure session ending
}

export interface CreateParkingSessionDto {
  vehicleType: VehicleType;
  plateNumber: string;
  qrCode?: string;  // Optional if using plate number entry
  spotId?: string;  // Optional for some entry methods
}

export class ParkingSessionService {
  public static async startSession(data: CreateParkingSessionDto): Promise<any> {
    const now = new Date();
    
    const sessionData: any = {
      vehiclePlateNumber: data.plateNumber, // map to schema field
      displayPlateNumber: data.plateNumber, // or format as needed
      vehicleType: data.vehicleType,
      entryTime: now,
      status: ParkingSessionStatus.ACTIVE,
      createdAt: now,
      updatedAt: now,
      // Generate secureId here as a 4-digit string
      secureId: (Math.floor(100000 + Math.random() * 900000)).toString(),
      ...(data.qrCode && { qrCodeId: data.qrCode }),
      ...(data.spotId && { parkingSpotIdentifier: data.spotId })
    };
    
    console.log('Creating ParkingSession with data:', sessionData); // Debug log
    const sessionDoc = await ParkingSessionModel.create(sessionData);
 
    return sessionDoc.toObject();
  }

  /**
   * End a parking session and calculate fee
   */
  public static async endSession(secureId: string): Promise<any> {
    const now = new Date();
    
    // Find session by secureId and status
    const session = await ParkingSessionModel.findOne({ 
      secureId,
      status: ParkingSessionStatus.ACTIVE
    });
    
    if (!session) {
      throw new Error('Active parking session not found');
    }
    
    // Update session with exit time
    session.exitTime = now;
    session.status = ParkingSessionStatus.ENDED;
    session.updatedAt = now;
    await session.save();
    
    // Calculate fee
    const parkingSession: ParkingSession = {
      vehicleType: session.vehicleType as VehicleType,
      entryTime: session.entryTime,
      exitTime: now
    };
    
    const fee = ParkingFeeCalculator.calculateFee(parkingSession);
    
    // Use calculatedFee field as per schema
    session.calculatedFee = fee;
    session.updatedAt = now;
    await session.save();
    
    return session.toObject();
  }

  /**
   * Get active session by plate number
   */
  public static async getActiveSessionByPlate(plateNumber: string): Promise<IParkingSession | null> {
    return await ParkingSessionModel.findOne({
      vehiclePlateNumber: plateNumber,
      status: ParkingSessionStatus.ACTIVE
    });
  }

  /**
   * Get active session by QR code
   */
  public static async getActiveSessionByQR(qrCode: string): Promise<IParkingSession | null> {
    return await ParkingSessionModel.findOne({
      qrCodeId: qrCode,
      status: ParkingSessionStatus.ACTIVE
    });
  }
}