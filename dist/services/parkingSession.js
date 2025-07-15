"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ParkingSessionService = void 0;
const ParkingFeeCalculator_1 = require("../utils/ParkingFeeCalculator");
const ParkingModel_1 = __importDefault(require("../models/ParkingModel"));
const common_1 = require("../types/common");
class ParkingSessionService {
    static startSession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const sessionData = Object.assign(Object.assign({ vehiclePlateNumber: data.plateNumber, displayPlateNumber: data.plateNumber, vehicleType: data.vehicleType, entryTime: now, status: common_1.ParkingSessionStatus.ACTIVE, createdAt: now, updatedAt: now, 
                // Generate secureId here as a 4-digit string
                secureId: (Math.floor(100000 + Math.random() * 900000)).toString() }, (data.qrCode && { qrCodeId: data.qrCode })), (data.spotId && { parkingSpotIdentifier: data.spotId }));
            console.log('Creating ParkingSession with data:', sessionData); // Debug log
            const sessionDoc = yield ParkingModel_1.default.create(sessionData);
            return sessionDoc.toObject();
        });
    }
    /**
     * End a parking session and calculate fee
     */
    static endSession(secureId) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            // Find session by secureId and status
            const session = yield ParkingModel_1.default.findOne({
                secureId,
                status: common_1.ParkingSessionStatus.ACTIVE
            });
            if (!session) {
                throw new Error('Active parking session not found');
            }
            // Update session with exit time
            session.exitTime = now;
            session.status = common_1.ParkingSessionStatus.ENDED;
            session.updatedAt = now;
            yield session.save();
            // Calculate fee
            const parkingSession = {
                vehicleType: session.vehicleType,
                entryTime: session.entryTime,
                exitTime: now
            };
            const fee = ParkingFeeCalculator_1.ParkingFeeCalculator.calculateFee(parkingSession);
            // Use calculatedFee field as per schema
            session.calculatedFee = fee;
            session.updatedAt = now;
            yield session.save();
            return session.toObject();
        });
    }
    /**
     * Get active session by plate number
     */
    static getActiveSessionByPlate(plateNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ParkingModel_1.default.findOne({
                vehiclePlateNumber: plateNumber,
                status: common_1.ParkingSessionStatus.ACTIVE
            });
        });
    }
    /**
     * Get active session by QR code
     */
    static getActiveSessionByQR(qrCode) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield ParkingModel_1.default.findOne({
                qrCodeId: qrCode,
                status: common_1.ParkingSessionStatus.ACTIVE
            });
        });
    }
}
exports.ParkingSessionService = ParkingSessionService;
//# sourceMappingURL=parkingSession.js.map