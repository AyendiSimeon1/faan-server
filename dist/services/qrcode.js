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
exports.QRCodeService = void 0;
const qrcode_1 = __importDefault(require("qrcode"));
const crypto_1 = __importDefault(require("crypto"));
class QRCodeService {
    // Generate a unique code for a parking location/spot
    static generateUniqueCode(locationId, spotId) {
        const timestamp = Date.now();
        const randomBytes = crypto_1.default.randomBytes(4).toString('hex');
        return `${locationId}_${spotId || 'any'}_${timestamp}_${randomBytes}`;
    }
    // Generate QR code data
    static generateQRCodeData(locationId, spotId) {
        return {
            locationId,
            spotId,
            code: this.generateUniqueCode(locationId, spotId),
            timestamp: Date.now()
        };
    }
    // Generate QR code as data URL
    static generateQRCodeDataURL(data) {
        return __awaiter(this, void 0, void 0, function* () {
            const jsonString = JSON.stringify(data);
            try {
                const qrCodeDataUrl = yield qrcode_1.default.toDataURL(jsonString, {
                    errorCorrectionLevel: 'H',
                    margin: 1,
                    width: 300
                });
                return qrCodeDataUrl;
            }
            catch (error) {
                throw new Error(`Failed to generate QR code: ${error}`);
            }
        });
    }
    // Verify if a QR code is valid and not expired
    static verifyQRCode(qrData) {
        const now = Date.now();
        const validityPeriod = 5 * 60 * 1000; // 5 minutes in milliseconds
        return (now - qrData.timestamp) <= validityPeriod;
    }
    // Parse QR code data from string
    static parseQRCodeData(qrString) {
        try {
            return JSON.parse(qrString);
        }
        catch (error) {
            throw new Error('Invalid QR code data format');
        }
    }
}
exports.QRCodeService = QRCodeService;
//# sourceMappingURL=qrcode.js.map