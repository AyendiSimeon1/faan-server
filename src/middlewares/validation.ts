// src/middlewares/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { Schema } from 'joi'; // Or Zod schema
import AppError from '../utils/AppError';

// This is a generic validator. You'd create specific schemas for each route/request body.
export const validateRequest = (schema: Schema, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req[property], {
      abortEarly: false, // Return all errors
      allowUnknown: false, // Disallow unknown properties
      stripUnknown: true, // Remove unknown properties
    });

    if (error) {
      const errorMessage = error.details.map((detail) => detail.message).join(', ');
      return next(new AppError(errorMessage, 400));
    }

    req[property] = value; // Overwrite with validated and potentially transformed value
    next();
  };
};

/*
// Example Joi Schema (define this in your routes or a dedicated schemas file)
import Joi from 'joi';

export const createUserSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  phoneNumber: Joi.string().required(), // Add more specific phone validation
});
*/