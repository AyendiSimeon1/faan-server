"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = void 0;
const AppError_1 = __importDefault(require("../utils/AppError"));
// This is a generic validator. You'd create specific schemas for each route/request body.
const validateRequest = (schema, property = 'body') => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req[property], {
            abortEarly: false, // Return all errors
            allowUnknown: false, // Disallow unknown properties
            stripUnknown: true, // Remove unknown properties
        });
        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            return next(new AppError_1.default(errorMessage, 400));
        }
        req[property] = value; // Overwrite with validated and potentially transformed value
        next();
    };
};
exports.validateRequest = validateRequest;
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
//# sourceMappingURL=validation.js.map