"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Parking_1 = require("../controllers/Parking");
const parkingSession_1 = require("../controllers/parkingSession");
const QRCode_1 = require("../controllers/QRCode");
const ImageProcessing_1 = require("../controllers/ImageProcessing");
const upload_1 = require("../middlewares/upload");
const parkingRouter = (0, express_1.Router)();
// QR Code generation and validation
parkingRouter.post('/qr-code/generate', auth_1.protect, QRCode_1.generateParkingQRCode);
parkingRouter.post('/qr-code/validate', auth_1.protect, parkingSession_1.validateParkingQR);
// Parking session management
parkingRouter.post('/sessions', auth_1.protect, parkingSession_1.startParkingSession);
parkingRouter.post('/sessions/:sessionId/end', auth_1.protect, parkingSession_1.endParkingSession);
// Vehicle image processing
parkingRouter.post('/process-image', auth_1.protect, upload_1.upload.single('image'), ImageProcessing_1.processCarImage);
// Legacy routes
parkingRouter.post('/start-session/qr', auth_1.protect, Parking_1.startSessionByQr);
parkingRouter.post('/start-session/plate', auth_1.protect, Parking_1.startSessionByPlate);
parkingRouter.post('/process-car-image', auth_1.protect, upload_1.upload.single('image'), ImageProcessing_1.processCarImage);
parkingRouter.get('/session/:sessionId', auth_1.protect, Parking_1.getSessionDetails);
parkingRouter.post('/session/:sessionId/end', auth_1.protect, Parking_1.endSessionAndPay);
parkingRouter.get('/history', auth_1.protect, Parking_1.getParkingHistory);
exports.default = parkingRouter;
//# sourceMappingURL=parking.routes.js.map