import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';
import { UserRole } from '../types/common';
declare global {
    namespace Express {
        interface Request {
            user?: IUser;
        }
    }
}
export declare const protect: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const authorize: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
