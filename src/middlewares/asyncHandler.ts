// src/middlewares/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;

const asyncHandler = (fn: AsyncRequestHandler): RequestHandler => 
  (req: Request, res: Response, next: NextFunction) => {
    console.log(`[${new Date().toISOString()}] Request started: ${req.method} ${req.path}`);
    
    Promise.resolve(fn(req, res, next))
      .then(() => {
        console.log(`[${new Date().toISOString()}] Request completed: ${req.method} ${req.path}`);
      })
      .catch((error) => {
        console.error(`[${new Date().toISOString()}] Request error: ${req.method} ${req.path}`, error);
        next(error);
      });
  };

export default asyncHandler;