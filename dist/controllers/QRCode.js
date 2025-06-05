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
exports.generateParkingQRCode = void 0;
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
const qrcode_1 = require("../services/qrcode");
const AppError_1 = __importDefault(require("../utils/AppError"));
exports.generateParkingQRCode = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { locationId, spotId } = req.body;
    if (!locationId) {
        throw new AppError_1.default('Location ID is required', 400);
    }
    const qrData = qrcode_1.QRCodeService.generateQRCodeData(locationId, spotId);
    const qrCodeDataUrl = yield qrcode_1.QRCodeService.generateQRCodeDataURL(qrData);
    res.status(200).json({
        status: 'success',
        data: {
            qrCodeDataUrl,
            expiresAt: new Date(qrData.timestamp + 5 * 60 * 1000), // 5 minutes from generation
            locationId,
            spotId
        }
    });
}));
//# sourceMappingURL=QRCode.js.map