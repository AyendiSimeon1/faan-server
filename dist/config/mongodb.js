"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = exports.getDB = void 0;
const mongoose_1 = __importDefault(require("mongoose"));
const getDB = () => {
    if (!mongoose_1.default.connection || mongoose_1.default.connection.readyState !== 1) {
        throw new Error('Database not connected. Ensure mongoose.connect() is called first.');
    }
    return mongoose_1.default.connection.db;
};
exports.getDB = getDB;
exports.db = mongoose_1.default.connection.db;
//# sourceMappingURL=mongodb.js.map