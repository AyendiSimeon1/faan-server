import { IParkingSession } from '../models/ParkingModel';
import { IUser } from '../models/User';
import { StartSessionByQrDto, StartSessionByPlateDto, EndSessionDto } from '../types/Parking';
export declare class ParkingService {
    static startSessionByQr(dto: StartSessionByQrDto, userId?: string): Promise<IParkingSession>;
    static startSessionByPlate(dto: StartSessionByPlateDto, userId?: string): Promise<IParkingSession>;
    static getParkingSessionById(sessionId: string, userId?: string): Promise<IParkingSession>;
    static endSessionAndPay(dto: EndSessionDto, user: IUser): Promise<{
        session: IParkingSession;
        paymentResult: any;
        message: string;
    }>;
    static getParkingHistory(userId: string, page?: number, limit?: number): Promise<{
        sessions: IParkingSession[];
        total: number;
        currentPage: number;
        totalPages: number;
    }>;
}
