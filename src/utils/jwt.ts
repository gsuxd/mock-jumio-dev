import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'jumio-mock-secret-key-change-in-production';

interface JWTPayload {
  [key: string]: any;
}

// Simple JWT implementation for mock purposes
export const generateToken = (payload: JWTPayload, expiresIn: number = 3600): string => {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const tokenPayload = {
    ...payload,
    iat: now,
    exp: now + expiresIn,
    iss: process.env.BASE_URL || 'http://localhost:3000'
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(tokenPayload));
  
  const signature = crypto
    .createHmac('sha256', JWT_SECRET)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest('base64url');

  return `${encodedHeader}.${encodedPayload}.${signature}`;
};

export const verifyToken = (token: string): JWTPayload | null => {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }

    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    if (signature !== expectedSignature) {
      return null;
    }

    // Decode payload
    const payload = JSON.parse(base64UrlDecode(encodedPayload));

    // Check expiration
    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null;
    }

    return payload;
  } catch (error) {
    return null;
  }
};

export const generateOAuth2Token = (): string => {
  return generateToken({
    type: 'oauth2',
    scope: 'full'
  }, 3600);
};

export const generateSDKToken = (accountId: string, workflowExecutionId: string): string => {
  return generateToken({
    accountId,
    workflowExecutionId,
    type: 'sdk'
  }, parseInt(process.env.SDK_TOKEN_EXPIRY || '3600'));
};

export const generateAPIToken = (workflowExecutionId: string): string => {
  return generateToken({
    workflowExecutionId,
    type: 'api'
  }, 3600);
};

function base64UrlEncode(str: string): string {
  return Buffer.from(str)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

function base64UrlDecode(str: string): string {
  str = str.replace(/-/g, '+').replace(/_/g, '/');
  while (str.length % 4) {
    str += '=';
  }
  return Buffer.from(str, 'base64').toString('utf-8');
}
