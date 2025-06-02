// Load env vars before other imports
import dotenv from 'dotenv';
dotenv.config();

import express, { Request, Response, NextFunction } from 'express';
import morgan from 'morgan';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { globalErrorHandler } from './middlewares/error';
import AppError from './utils/AppError';
import routes from './routes';

const app = express();

// Security middleware
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['set-cookie']
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

// Body parser middleware
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
// app.use(cookieParser());

// Logging middleware
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

app.use('/api/v1', routes);

// Trust proxy if behind reverse proxy
// if (process.env.NODE_ENV === 'production') {
//   app.set('trust proxy', 1);
// }

// Health check route (no DB required)
app.get('/health', (req: Request, res: Response) => {
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

export default app;