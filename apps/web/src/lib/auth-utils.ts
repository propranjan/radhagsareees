import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'ADMIN' | 'MODERATOR';
}

export interface AuthResult {
  success: boolean;
  user?: AuthenticatedUser;
  error?: string;
}

/**
 * Extract and verify JWT token from request headers
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthResult> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return {
        success: false,
        error: 'Missing or invalid authorization header',
      };
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return {
        success: false,
        error: 'No token provided',
      };
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    // Verify JWT token
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded.id || !decoded.email) {
      return {
        success: false,
        error: 'Invalid token payload',
      };
    }

    return {
      success: true,
      user: {
        id: decoded.id,
        email: decoded.email,
        name: decoded.name || 'Unknown User',
        role: decoded.role || 'CUSTOMER',
      },
    };

  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return {
        success: false,
        error: 'Invalid token',
      };
    }
    
    if (error instanceof jwt.TokenExpiredError) {
      return {
        success: false,
        error: 'Token expired',
      };
    }

    console.error('Authentication error:', error);
    return {
      success: false,
      error: 'Authentication failed',
    };
  }
}

/**
 * Check if user has required role
 */
export function hasRequiredRole(
  user: AuthenticatedUser, 
  requiredRoles: ('CUSTOMER' | 'ADMIN' | 'MODERATOR')[]
): boolean {
  return requiredRoles.includes(user.role);
}

/**
 * Rate limiting for review submissions
 */
const reviewSubmissionLimits = new Map<string, number[]>();

export function checkReviewRateLimit(userId: string): {
  allowed: boolean;
  resetTime?: number;
} {
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxSubmissions = 5; // 5 reviews per hour

  if (!reviewSubmissionLimits.has(userId)) {
    reviewSubmissionLimits.set(userId, []);
  }

  const submissions = reviewSubmissionLimits.get(userId)!;
  
  // Remove submissions older than 1 hour
  const recentSubmissions = submissions.filter(time => now - time < windowMs);
  reviewSubmissionLimits.set(userId, recentSubmissions);

  if (recentSubmissions.length >= maxSubmissions) {
    const oldestSubmission = Math.min(...recentSubmissions);
    const resetTime = oldestSubmission + windowMs;
    
    return {
      allowed: false,
      resetTime,
    };
  }

  // Add current submission timestamp
  recentSubmissions.push(now);
  reviewSubmissionLimits.set(userId, recentSubmissions);

  return {
    allowed: true,
  };
}

/**
 * Verify JWT token
 */
export async function verifyJWT(token: string): Promise<AuthenticatedUser | null> {
  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET environment variable is not set');
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    if (!decoded.id || !decoded.email) {
      return null;
    }

    return {
      id: decoded.id,
      email: decoded.email,
      name: decoded.name || '',
      role: decoded.role || 'CUSTOMER',
    };
  } catch (error) {
    return null;
  }
}

/**
 * Generate JWT token for testing purposes
 */
export function generateTestToken(user: Partial<AuthenticatedUser>): string {
  const jwtSecret = process.env.JWT_SECRET || 'test-secret';
  
  return jwt.sign(
    {
      id: user.id || 'test-user-id',
      email: user.email || 'test@example.com',
      name: user.name || 'Test User',
      role: user.role || 'CUSTOMER',
    },
    jwtSecret,
    { expiresIn: '1h' }
  );
}