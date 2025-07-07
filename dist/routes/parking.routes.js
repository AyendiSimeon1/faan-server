"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Parking_1 = require("../controllers/Parking");
const parkingSession_1 = require("../controllers/parkingSession");
const QRCode_1 = require("../controllers/QRCode");
const ImageProcessing_1 = require("../controllers/ImageProcessing");
const upload_1 = require("../middlewares/upload");
const payment_1 = require("../controllers/payment");
const parkingRouter = (0, express_1.Router)();
// QR Code generation and validation
parkingRouter.post('/qr-code/generate', auth_1.protect, QRCode_1.generateParkingQRCode);
parkingRouter.post('/qr-code/validate', auth_1.protect, parkingSession_1.validateParkingQR);
// Parking session management - Modern API
parkingRouter.post('/session/start/qr', auth_1.protect, Parking_1.startSessionByQr);
parkingRouter.post('/session/start/plate', auth_1.protect, Parking_1.startSessionByPlate);
parkingRouter.put('/session/:plateNumber/end', Parking_1.endSessionAndPay); // No protect middleware
parkingRouter.get('/sessions/history', auth_1.protect, Parking_1.getParkingHistory);
// Legacy endpoints - to be deprecated
parkingRouter.post('/sessions', auth_1.protect, parkingSession_1.startParkingSession);
parkingRouter.post('/sessions/:sessionId/end', auth_1.protect, parkingSession_1.endParkingSession);
// Vehicle image processing
parkingRouter.post('/process-image', auth_1.protect, upload_1.upload.single('image'), ImageProcessing_1.processCarImage);
// Fetch all payments
parkingRouter.get('/payments/all', payment_1.getAllPaymentsController);
// Fetch all ended parking sessions
parkingRouter.get('/sessions/ended', Parking_1.getAllEndedSessions);
exports.default = parkingRouter;
//# sourceMappingURL=parking.routes.js.map