"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importStar(require("mongoose"));
const common_1 = require("../types/common");
const ParkingSessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', index: true },
    vehiclePlateNumber: { type: String, required: true, uppercase: true, trim: true, index: true },
    vehicleType: { type: String },
    entryTime: { type: Date, required: true, default: Date.now },
    exitTime: { type: Date },
    durationInMinutes: { type: Number },
    parkingLocationId: { type: String, required: true }, // Could be ObjectId if locations are managed entities
    parkingSpotIdentifier: { type: String },
    qrCodeId: { type: String, unique: true, sparse: true }, // Sparse for optional unique field
    status: { type: String, enum: Object.values(common_1.ParkingSessionStatus), required: true, default: common_1.ParkingSessionStatus.ACTIVE },
    rateDetails: { type: String },
    calculatedFee: { type: Number },
    paymentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'Payment' },
    isAutoDebit: { type: Boolean, default: false },
    paidByAgentId: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
    agentNotes: { type: String },
    uiStateMetadata: { type: mongoose_1.Schema.Types.Mixed },
}, { timestamps: true });
ParkingSessionSchema.index({ userId: 1, status: 1 });
ParkingSessionSchema.index({ vehiclePlateNumber: 1, status: 1 });
const ParkingSessionModel = mongoose_1.default.model('ParkingSession', ParkingSessionSchema);
exports.default = ParkingSessionModel;
//# sourceMappingURL=ParkingModel.js.map