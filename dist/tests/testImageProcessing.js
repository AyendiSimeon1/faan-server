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
const axios_1 = __importDefault(require("axios"));
const form_data_1 = __importDefault(require("form-data"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const API_URL = 'http://localhost:5000/api/v1';
const TOKEN = 'your-jwt-token'; // Replace with actual token
function testImageProcessing(imagePath) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a;
        try {
            const formData = new form_data_1.default();
            formData.append('image', fs_1.default.createReadStream(imagePath));
            const response = yield axios_1.default.post(`${API_URL}/parking/process-image`, formData, {
                headers: Object.assign(Object.assign({}, formData.getHeaders()), { 'Authorization': `Bearer ${TOKEN}` })
            });
            console.log('Response:', JSON.stringify(response.data, null, 2));
        }
        catch (error) {
            console.error('Error:', ((_a = error.response) === null || _a === void 0 ? void 0 : _a.data) || error.message);
        }
    });
}
// Usage example
const imagePath = path_1.default.join(__dirname, '..', 'test-assets', 'sample-car.jpg');
testImageProcessing(imagePath);
//# sourceMappingURL=testImageProcessing.js.map