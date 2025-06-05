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
exports.processCarImage = void 0;
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
const imageProcessing_1 = require("../services/imageProcessing");
const AppError_1 = __importDefault(require("../utils/AppError"));
exports.processCarImage = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    if (!req.file) {
        throw new AppError_1.default('No image file provided', 400);
    }
    const result = yield imageProcessing_1.ImageProcessingService.processCarImage(req.file.buffer);
    res.status(200).json({
        status: 'success',
        data: result
    });
}));
//# sourceMappingURL=ImageProcessing.js.map