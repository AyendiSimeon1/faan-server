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
exports.getWalletBalance = exports.topUpWallet = void 0;
const asyncHandler_1 = __importDefault(require("../middlewares/asyncHandler"));
const Wallet_1 = __importDefault(require("../models/Wallet"));
// Top up wallet
exports.topUpWallet = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const { amount } = req.body;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    if (!amount || amount <= 0)
        return res.status(400).json({ error: 'Invalid amount' });
    let wallet = yield Wallet_1.default.findOne({ userId });
    if (!wallet) {
        wallet = new Wallet_1.default({ userId, balance: 0 });
    }
    wallet.balance += amount;
    yield wallet.save();
    return res.json({ status: 'success', balance: wallet.balance });
}));
// Get wallet balance
exports.getWalletBalance = (0, asyncHandler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    if (!userId)
        return res.status(401).json({ error: 'Unauthorized' });
    const wallet = yield Wallet_1.default.findOne({ userId });
    return res.json({ status: 'success', balance: (wallet === null || wallet === void 0 ? void 0 : wallet.balance) || 0 });
}));
//# sourceMappingURL=Wallet.js.map