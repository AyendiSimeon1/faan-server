import jwt, { SignOptions } from 'jsonwebtoken';
import AppError from './AppError';

const JWT_SECRET = process.env.JWT_SECRET || 'your-very-strong-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '90d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '180d';

interface TokenPayload {
  userId: string;
  role: string;
  // Add other relevant fields if needed, e.g., sessionId
}

export const signToken = (payload: TokenPayload, expiresIn: string = JWT_EXPIRES_IN): string => {
  const options: SignOptions = { expiresIn: expiresIn as SignOptions['expiresIn'] };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const signRefreshToken = (payload: Pick<TokenPayload, 'userId'>): string => {
  const options: SignOptions = { expiresIn: JWT_REFRESH_EXPIRES_IN as any };
  return jwt.sign(payload, JWT_SECRET, options);
};

export const verifyToken = (token: string): TokenPayload => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as TokenPayload;
    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new AppError('Token has expired', 401);
    }
    if (error.name === 'JsonWebTokenError') {
      throw new AppError('Invalid token', 401);
    }
    throw new AppError('Token verification failed', 401);
  }
};