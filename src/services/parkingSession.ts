import { ObjectId, WithId } from 'mongodb';
import { VehicleType, ParkingSession, ParkingFeeCalculator } from '../utils/ParkingFeeCalculator';
import { getDB } from '../config/mongodb';

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
}

export interface CreateParkingSessionDto {
  vehicleType: VehicleType;
  plateNumber: string;
  qrCode?: string;  // Optional if using plate number entry
  spotId?: string;  // Optional for some entry methods
}

import mongoose from 'mongoose';
const parkingSessions = mongoose.connection.collection<IParkingSession>('parkingSessions');

export class ParkingSessionService {
  /**
   * Start a new parking session
   */
  public static async startSession(data: CreateParkingSessionDto): Promise<IParkingSession> {
    const now = new Date();
    const sessionData: Omit<IParkingSession, '_id'> = {
        ...data,
        entryTime: now,
        status: 'ACTIVE',
        createdAt: now,
        updatedAt: now,
        id: ''
    };

    const result = await parkingSessions.insertOne(sessionData);

    return {
      _id: result.insertedId,
      ...sessionData
    };
  }

  /**
   * End a parking session and calculate fee
   */
  public static async endSession(sessionId: string): Promise<IParkingSession> {
    const now = new Date();
    
    // First, get the current session
    const session = await parkingSessions.findOne({ 
      _id: new ObjectId(sessionId),
      status: 'ACTIVE'
    });

    if (!session) {
      throw new Error('Active parking session not found');
    }

    // Update session with exit time
    const updatedSession = await parkingSessions.findOneAndUpdate(
      { _id: new ObjectId(sessionId) },
      { 
        $set: {
          exitTime: now,
          status: 'ENDED',
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!updatedSession) {
      throw new Error('Failed to update parking session');
    }

    // Calculate fee
    const parkingSession: ParkingSession = {
      vehicleType: updatedSession.vehicleType,
      entryTime: updatedSession.entryTime,
      exitTime: now
    };

    const fee = ParkingFeeCalculator.calculateFee(parkingSession);

    // Update session with fee
    const finalSession = await parkingSessions.findOneAndUpdate(
      { _id: new ObjectId(sessionId) },
      { 
        $set: {
          totalAmount: fee,
          updatedAt: now
        }
      },
      { returnDocument: 'after' }
    );

    if (!finalSession) {
      throw new Error('Failed to update parking session with fee');
    }

    return finalSession;
  }

  /**
   * Get active session by plate number
   */
  public static async getActiveSessionByPlate(plateNumber: string): Promise<IParkingSession | null> {
    return await parkingSessions.findOne({
      plateNumber,
      status: 'ACTIVE'
    });
  }

  /**
   * Get active session by QR code
   */
  public static async getActiveSessionByQR(qrCode: string): Promise<IParkingSession | null> {
    return await parkingSessions.findOne({
      qrCode,
      status: 'ACTIVE'
    });
  }
}
