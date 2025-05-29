import { Request, Response, NextFunction } from 'express';
interface CustomError extends Error {
    statusCode?: number;
    status?: string;
    isOperational?: boolean;
    path?: string;
    value?: any;
    code?: number;
    errors?: any;
}
export declare const globalErrorHandler: (err: CustomError, req: Request, res: Response, next: NextFunction) => void;
export {};
