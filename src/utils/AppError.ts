// src/utils/AppError.ts
class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;

  
  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true; // To distinguish from programming errors

    Error.captureStackTrace(this, this.constructor);
  }
}

export default AppError;