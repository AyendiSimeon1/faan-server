"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const common_1 = require("../types/common");
const Parking_1 = require("../controllers/Parking");
const parkingSession_1 = require("../controllers/parkingSession");
const QRCode_1 = require("../controllers/QRCode");
const ImageProcessing_1 = require("../controllers/ImageProcessing");
const upload_1 = require("../middlewares/upload");
const payment_1 = require("../controllers/payment");
const parkingRouter = (0, express_1.Router)();
parkingRouter.post('/qr-code/generate', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.ADMIN), QRCode_1.generateParkingQRCode);
parkingRouter.post('/qr-code/validate', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.ADMIN), parkingSession_1.validateParkingQR);
parkingRouter.post('/session/start/qr', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.ADMIN), Parking_1.startSessionByQr);
parkingRouter.post('/session/start/plate', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.ADMIN), Parking_1.startSessionByPlate);
parkingRouter.put('/session/:secureId/end', auth_1.protect, Parking_1.endSessionAndPay); // Add protect before authorize
parkingRouter.get('/sessions/history', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.ADMIN), Parking_1.getParkingHistory);
parkingRouter.post('/sessions/end', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.USER, common_1.UserRole.AGENT, common_1.UserRole.ADMIN), parkingSession_1.endParkingSession);
parkingRouter.post('/sessions', auth_1.protect, parkingSession_1.startParkingSession);
parkingRouter.post('/sessions/:sessionId/end', auth_1.protect, (0, auth_1.authorize)(common_1.UserRole.USER, common_1.UserRole.AGENT, common_1.UserRole.ADMIN), parkingSession_1.endParkingSession); // Add protect before authorize
parkingRouter.post('/process-image', upload_1.upload.single('image'), (0, auth_1.authorize)(common_1.UserRole.USER, common_1.UserRole.AGENT, common_1.UserRole.ADMIN), ImageProcessing_1.processCarImage);
parkingRouter.get('/payments/all', payment_1.getAllPaymentsController);
parkingRouter.get('/sessions/ended', Parking_1.getAllEndedSessions);
exports.default = parkingRouter;
//# sourceMappingURL=parking.routes.js.map