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
const mongodb_1 = require("mongodb");
const ParkingFeeCalculator_1 = require("../utils/ParkingFeeCalculator");
const mongoose_1 = __importDefault(require("mongoose"));
const parkingSessions = mongoose_1.default.connection.collection('parkingSessions');
class ParkingSessionService {
    /**
     * Start a new parking session
     */
    static startSession(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            const sessionData = Object.assign(Object.assign({}, data), { entryTime: now, status: 'ACTIVE', createdAt: now, updatedAt: now, id: '' });
            const result = yield parkingSessions.insertOne(sessionData);
            return Object.assign({ _id: result.insertedId }, sessionData);
        });
    }
    /**
     * End a parking session and calculate fee
     */
    static endSession(sessionId) {
        return __awaiter(this, void 0, void 0, function* () {
            const now = new Date();
            // First, get the current session
            const session = yield parkingSessions.findOne({
                _id: new mongodb_1.ObjectId(sessionId),
                status: 'ACTIVE'
            });
            if (!session) {
                throw new Error('Active parking session not found');
            }
            // Update session with exit time
            const updatedSession = yield parkingSessions.findOneAndUpdate({ _id: new mongodb_1.ObjectId(sessionId) }, {
                $set: {
                    exitTime: now,
                    status: 'ENDED',
                    updatedAt: now
                }
            }, { returnDocument: 'after' });
            if (!updatedSession) {
                throw new Error('Failed to update parking session');
            }
            // Calculate fee
            const parkingSession = {
                vehicleType: updatedSession.vehicleType,
                entryTime: updatedSession.entryTime,
                exitTime: now
            };
            const fee = ParkingFeeCalculator_1.ParkingFeeCalculator.calculateFee(parkingSession);
            // Update session with fee
            const finalSession = yield parkingSessions.findOneAndUpdate({ _id: new mongodb_1.ObjectId(sessionId) }, {
                $set: {
                    totalAmount: fee,
                    updatedAt: now
                }
            }, { returnDocument: 'after' });
            if (!finalSession) {
                throw new Error('Failed to update parking session with fee');
            }
            return finalSession;
        });
    }
    /**
     * Get active session by plate number
     */
    static getActiveSessionByPlate(plateNumber) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield parkingSessions.findOne({
                plateNumber,
                status: 'ACTIVE'
            });
        });
    }
    /**
     * Get active session by QR code
     */
    static getActiveSessionByQR(qrCode) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield parkingSessions.findOne({
                qrCode,
                status: 'ACTIVE'
            });
        });
    }
}
exports.ParkingSessionService = ParkingSessionService;
//# sourceMappingURL=parkingSession.js.map