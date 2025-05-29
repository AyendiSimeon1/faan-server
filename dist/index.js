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
const mongoose_1 = __importDefault(require("mongoose"));
const server_1 = __importDefault(require("./server"));
const port = process.env.PORT || 5000;
const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://aqqutelabs:ZECDRlbG5y25uJp7@cluster0.9ck3gvl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
// MongoDB connection options
const mongooseOptions = {
    serverSelectionTimeoutMS: 5000, // Timeout after 5s
    socketTimeoutMS: 45000, // Close sockets after 45s
    family: 4 // Use IPv4, skip trying IPv6
};
// Connect to MongoDB
console.log('📡 Connecting to MongoDB...');
mongoose_1.default.connect(mongoUri, mongooseOptions)
    .then(() => {
    console.log('📦 Connected to MongoDB successfully');
    startServer();
})
    .catch((err) => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
});
// MongoDB connection error handling
mongoose_1.default.connection.on('error', (err) => {
    console.error('❌ MongoDB connection error:', err);
});
mongoose_1.default.connection.on('disconnected', () => {
    console.log('❌ MongoDB disconnected');
});
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        yield mongoose_1.default.connection.close();
        console.log('📦 MongoDB connection closed through app termination');
        process.exit(0);
    }
    catch (err) {
        console.error('❌ Error closing MongoDB connection:', err);
        process.exit(1);
    }
}));
// Start server only after MongoDB connects
function startServer() {
    const server = server_1.default.listen(port, () => {
        console.log(`🚀 Server running on port ${port} in ${process.env.NODE_ENV} mode`);
        console.log(`👉 Health check: http://localhost:${port}/health`);
        console.log(`👉 API base URL: http://localhost:${port}/api/v1`);
    });
    // Handle server errors
    server.on('error', (error) => {
        console.error('❌ Server error:', error);
        if (error.code === 'EADDRINUSE') {
            console.error(`❌ Port ${port} is already in use`);
        }
        process.exit(1);
    });
    // Graceful shutdown
    process.on('SIGTERM', () => {
        console.log('🔄 SIGTERM received. Starting graceful shutdown...');
        server.close(() => {
            console.log('💤 HTTP server closed');
            mongoose_1.default.connection.close(false)
                .then(() => {
                console.log('📦 MongoDB connection closed');
                process.exit(0);
            })
                .catch((err) => {
                console.error('❌ Error closing MongoDB connection:', err);
                process.exit(1);
            });
        });
    });
}
//# sourceMappingURL=index.js.map