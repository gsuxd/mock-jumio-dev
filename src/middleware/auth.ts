import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

// Basic Auth middleware for OAuth2 endpoint
export const basicAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Basic ')) {
    res.status(401).json({
      error: 'unauthorized',
      error_description: 'Basic authentication required'
    });
    return;
  }

  try {
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [clientId, clientSecret] = credentials.split(':');

    const expectedClientId = process.env.MOCK_CLIENT_ID || 'your-client-id';
    const expectedClientSecret = process.env.MOCK_CLIENT_SECRET || 'your-client-secret';

    if (clientId === expectedClientId && clientSecret === expectedClientSecret) {
      next();
    } else {
      res.status(401).json({
        error: 'invalid_client',
        error_description: 'Invalid client credentials'
      });
    }
  } catch (error) {
    res.status(401).json({
      error: 'invalid_request',
      error_description: 'Malformed authorization header'
    });
  }
};

// Bearer token middleware for API endpoints
export const bearerAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'unauthorized',
      message: 'Bearer token required'
    });
    return;
  }

  try {
    const token = authHeader.split(' ')[1];
    const payload = verifyToken(token);

    if (!payload) {
      res.status(401).json({
        error: 'invalid_token',
        message: 'Invalid or expired token'
      });
      return;
    }

    req.user = payload;
    req.token = token;
    next();
  } catch (error) {
    res.status(401).json({
      error: 'invalid_token',
      message: 'Token verification failed'
    });
  }
};

// Optional bearer auth (doesn't fail if no token)
export const optionalBearerAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1];
      const payload = verifyToken(token);
      
      if (payload) {
        req.user = payload;
        req.token = token;
      }
    } catch (error) {
      // Ignore errors for optional auth
    }
  }

  next();
};
