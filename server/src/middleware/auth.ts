import { Request, Response, NextFunction } from 'express';
import { User } from '../models/index.js';
import { AuthService } from '../services/AuthService.js';

export interface AuthRequest extends Request {
  userId?: string;
}

/**
 * Authenticate using either JWT token or anonymous ID
 * Supports both anonymous and email/password authentication
 */
export async function authenticateAnon(
  req: AuthRequest,
  res: Response,
  next: NextFunction
) {
  // Try JWT token first (from Authorization header)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    const decoded = AuthService.verifyToken(token);
    
    if (decoded) {
      const user = await User.findByPk(decoded.id);
      if (user) {
        req.userId = user.id;
        return next();
      }
    }
  }

  // Fall back to anonymous ID
  const anonId = req.headers['x-anon-id'] as string;

  if (!anonId) {
    return res.status(401).json({ error: 'Missing or invalid authentication' });
  }

  // Validate UUID format
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(anonId)) {
    return res.status(401).json({ error: 'Invalid UUID format' });
  }

  // Find or create user
  let user = await User.findByPk(anonId);
  if (!user) {
    user = await User.create({
      id: anonId,
      email: null,
      password_hash: null,
    });
  }

  req.userId = user.id;
  next();
}

