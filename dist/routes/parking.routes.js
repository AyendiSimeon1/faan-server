"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middlewares/auth");
const Parking_1 = require("../controllers/Parking");
const parkingRouter = (0, express_1.Router)();
parkingRouter.post('/start-session/qr', auth_1.protect, Parking_1.startSessionByQr);
parkingRouter.post('/start-session/plate', auth_1.protect, Parking_1.startSessionByPlate);
parkingRouter.get('/session/:sessionId', auth_1.protect, Parking_1.getSessionDetails);
parkingRouter.post('/session/:sessionId/end', auth_1.protect, Parking_1.endSessionAndPay);
parkingRouter.get('/history', auth_1.protect, Parking_1.getParkingHistory);
exports.default = parkingRouter;
//# sourceMappingURL=parking.routes.js.map