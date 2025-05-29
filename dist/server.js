"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
// Load env vars before other imports
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const cors_1 = __importDefault(require("cors"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
// Security middleware
const corsOptions = {
    origin: ((_a = process.env.ALLOWED_ORIGINS) === null || _a === void 0 ? void 0 : _a.split(',')) || '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['set-cookie']
};
app.use((0, cors_1.default)(corsOptions));
app.options('*', (0, cors_1.default)(corsOptions));
// Body parser middleware
app.use(express_1.default.json({ limit: '10kb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10kb' }));
// app.use(cookieParser());
// Logging middleware
if (process.env.NODE_ENV === 'development') {
    app.use((0, morgan_1.default)('dev'));
}
app.use('/api/v1', routes_1.default);
// Trust proxy if behind reverse proxy
// if (process.env.NODE_ENV === 'production') {
//   app.set('trust proxy', 1);
// }
// Health check route (no DB required)
app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'success',
        message: 'FAAN Parking API is running!',
        environment: process.env.NODE_ENV
    });
});
// API routes
// Handle undefined routes
// app.all('*', (req: Request, res: Response, next: NextFunction) => {
//   next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
// });
// Error handling
// app.use(globalErrorHandler);
// Graceful shutdown handler
process.on('SIGTERM', () => {
    console.log('👋 SIGTERM received. Performing graceful shutdown...');
    process.exit(0);
});
// Handle uncaught exceptions
// process.on('uncaughtException', (error: Error) => {
//   console.error('💥 UNCAUGHT EXCEPTION:', error);
//   process.exit(1);
// });
// // Handle unhandled promise rejections
// process.on('unhandledRejection', (error: Error) => {
//   console.error('💥 UNHANDLED REJECTION:', error);
//   process.exit(1);
// });
exports.default = app;
//# sourceMappingURL=server.js.map