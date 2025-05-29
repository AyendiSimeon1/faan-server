import { Request, Response, NextFunction, RequestHandler } from 'express';
type AsyncRequestHandler = (req: Request, res: Response, next: NextFunction) => Promise<any>;
declare const asyncHandler: (fn: AsyncRequestHandler) => RequestHandler;
export default asyncHandler;
