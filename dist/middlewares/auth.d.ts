import { Request, Response, NextFunction } from 'express';
import { UserRole } from '../types/common';
import '../types/express';
export declare const protect: import("express").RequestHandler<import("express-serve-static-core").ParamsDictionary, any, any, import("qs").ParsedQs, Record<string, any>>;
export declare const authorize: (...roles: UserRole[]) => (req: Request, res: Response, next: NextFunction) => void;
