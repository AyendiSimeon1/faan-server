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
exports.ImageProcessingService = void 0;
exports.mapAIVehicleTypeToInternal = mapAIVehicleTypeToInternal;
const generative_ai_1 = require("@google/generative-ai");
const sharp_1 = __importDefault(require("sharp"));
const AppError_1 = __importDefault(require("../utils/AppError"));
// Utility to map AI-detected vehicle types to internal types
function mapAIVehicleTypeToInternal(type) {
    if (!type)
        return 'regular';
    const t = type.toLowerCase();
    if (t.includes('suv'))
        return 'suv';
    if (t.includes('large') && t.includes('bus'))
        return 'large_bus';
    if (t.includes('bus'))
        return 'bus';
    if (t.includes('sedan') || t.includes('hatchback') || t.includes('coupe') || t.includes('wagon') || t.includes('convertible'))
        return 'regular';
    return 'regular'; // fallback
}
// Initialize Gemini AI
const genAI = new generative_ai_1.GoogleGenerativeAI('AIzaSyDzVrsvTRLdsVEpDUQwAeKnxSe92POysKo');
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
class ImageProcessingService {
    static processCarImage(imageBuffer) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            try {
                console.log('Starting image processing...');
                // Resize and optimize image if needed
                const processedImage = yield (0, sharp_1.default)(imageBuffer)
                    .resize(800, 600, { fit: 'inside' })
                    .jpeg({ quality: 80 })
                    .toBuffer();
                console.log('Image processed successfully');
                // Convert the image to base64 for Gemini
                const base64Image = processedImage.toString('base64');
                // Prepare the image part for Gemini
                const imageParts = [{
                        inlineData: {
                            data: base64Image,
                            mimeType: "image/jpeg"
                        }
                    }];
                // Generate content with Gemini
                const prompt = `Analyze this car image and extract the following details:
- License plate number
- Car manufacturer (make)
- Car model
- Car color
- Vehicle type (e.g., SUV, sedan, hatchback, coupe, bus, large bus, convertible, wagon, etc.)

Respond ONLY with a JSON object in this exact format, nothing else:
{
  "plateNumber": "extracted plate number",
  "make": "car manufacturer",
  "model": "car model",
  "color": "car color",
  "type": "vehicle type (e.g., sedan, suv, bus, large bus, hatchback, coupe, convertible, wagon, etc.)",
  "confidence": 0.95
}`;
                const result = yield model.generateContent([
                    prompt,
                    ...imageParts
                ]);
                const response = yield result.response;
                const text = response.text();
                console.log('Raw Gemini response:', text);
                // Parse the JSON response
                try {
                    // Clean up the response text by removing markdown code blocks
                    const cleanText = text.replace(/```json\n|```\n|```/g, '').trim();
                    console.log('Cleaned text:', cleanText);
                    const parsedResponse = JSON.parse(cleanText);
                    // Validate the response structure
                    if (!parsedResponse || typeof parsedResponse !== 'object') {
                        throw new Error('Invalid response structure');
                    }
                    // Map AI vehicle type to internal type
                    const internalType = mapAIVehicleTypeToInternal(parsedResponse.type);
                    return {
                        plateNumber: parsedResponse.plateNumber || '',
                        carDetails: {
                            make: parsedResponse.make || '',
                            model: parsedResponse.model || '',
                            color: parsedResponse.color || '',
                            type: parsedResponse.type || '',
                            internalType
                        },
                        confidence: typeof parsedResponse.confidence === 'number' ? parsedResponse.confidence : 0.8
                    };
                }
                catch (error) {
                    console.error('Error parsing Gemini response:', error);
                    throw new AppError_1.default('Failed to parse car details', 500);
                }
            }
            catch (error) {
                console.error('Detailed error:', {
                    name: (error === null || error === void 0 ? void 0 : error.name) || 'Unknown error',
                    message: (error === null || error === void 0 ? void 0 : error.message) || 'No error message',
                    stack: error === null || error === void 0 ? void 0 : error.stack,
                    response: (_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.data
                });
                // More specific error messages based on the error type
                if (error instanceof Error) {
                    throw new AppError_1.default(`Failed to process car image: ${error.message}`, 500);
                }
                throw new AppError_1.default('Failed to process car image', 500);
            }
        });
    }
}
exports.ImageProcessingService = ImageProcessingService;
//# sourceMappingURL=imageProcessing.js.map