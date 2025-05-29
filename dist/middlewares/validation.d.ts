import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi';
export declare const validateRequest: (schema: Schema, property?: "body" | "query" | "params") => (req: Request, res: Response, next: NextFunction) => void;
