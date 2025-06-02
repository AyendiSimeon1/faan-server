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
exports.getParkingHistory = exports.endSessionAndPay = exports.getSessionDetails = exports.startSessionByPlate = exports.startSessionByQr = void 0;
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
const Parking_1 = require("../services/Parking");
require("../types/express");
exports.startSessionByQr = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const dto = req.body;
    const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
    const session = yield Parking_1.ParkingService.startSessionByQr(dto, userId);
    res.status(201).json({ status: 'success', data: session });
}));
exports.startSessionByPlate = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const dto = req.body;
    const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString(); // Can be undefined for guest access
    const session = yield Parking_1.ParkingService.startSessionByPlate(dto, userId);
    res.status(201).json({ status: 'success', data: session });
}));
exports.getSessionDetails = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    const { sessionId } = req.params;
    const userId = (_b = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString();
    const session = yield Parking_1.ParkingService.getParkingSessionById(sessionId, userId);
    res.status(200).json({ status: 'success', data: session });
}));
exports.endSessionAndPay = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const dto = req.body;
    dto.sessionId = req.params.sessionId; // Get sessionId from URL param
    const user = req.user; // `protect` middleware ensures user exists
    const result = yield Parking_1.ParkingService.endSessionAndPay(dto, user);
    res.status(200).json({ status: 'success', data: result });
}));
exports.getParkingHistory = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const userId = req.user._id.toString(); // `protect` middleware ensures user exists
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const history = yield Parking_1.ParkingService.getParkingHistory(userId, page, limit);
    res.status(200).json({ status: 'success', data: history });
}));
//# sourceMappingURL=Parking.js.map