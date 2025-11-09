import { createHash, createHmac } from 'crypto';

// Admin authentication utilities
export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: 'ADMIN';
}

// Simple JWT-like token structure (in production, use proper JWT library)
export interface AdminToken {
  userId: string;
  email: string;
  role: 'ADMIN';
  exp: number;
  iat: number;
}

// Environment variables for auth
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fallback-secret-key';
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Create a signed token for admin user
 */
export function createAdminToken(user: AdminUser): string {
  const payload: AdminToken = {
    userId: user.id,
    email: user.email,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + TOKEN_EXPIRY,
  };

  const data = Buffer.from(JSON.stringify(payload)).toString('base64');
  const signature = createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
  
  return `${data}.${signature}`;
}

/**
 * Verify and decode admin token
 */
export function verifyAdminToken(token: string): AdminToken | null {
  try {
    const [data, signature] = token.split('.');
    if (!data || !signature) return null;

    // Verify signature
    const expectedSignature = createHmac('sha256', ADMIN_SECRET).update(data).digest('hex');
    if (signature !== expectedSignature) return null;

    // Decode payload
    const payload: AdminToken = JSON.parse(Buffer.from(data, 'base64').toString());
    
    // Check expiry
    if (Date.now() > payload.exp) return null;

    // Validate structure
    if (!payload.userId || !payload.email || payload.role !== 'ADMIN') return null;

    return payload;
  } catch {
    return null;
  }
}

/**
 * Create signature for inventory sync requests
 */
export function createInventorySignature(data: {
  updates: Array<{
    variantId: string;
    qtyAvailable: number;
    lowStockThreshold: number;
  }>;
  adminUserId: string;
  timestamp: number;
}): string {
  const payload = JSON.stringify({
    updates: data.updates.sort((a, b) => a.variantId.localeCompare(b.variantId)), // Ensure consistent order
    adminUserId: data.adminUserId,
    timestamp: data.timestamp,
  });

  return createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
}

/**
 * Verify inventory sync signature
 */
export function verifyInventorySignature(data: {
  updates: Array<{
    variantId: string;
    qtyAvailable: number;
    lowStockThreshold: number;
  }>;
  adminUserId: string;
  timestamp: number;
  signature: string;
}): boolean {
  try {
    const expectedSignature = createInventorySignature({
      updates: data.updates,
      adminUserId: data.adminUserId,
      timestamp: data.timestamp,
    });

    return data.signature === expectedSignature;
  } catch {
    return false;
  }
}

/**
 * Check if request is from valid admin (basic auth check)
 */
export async function isValidAdmin(userId: string): Promise<boolean> {
  // TODO: Implement proper admin validation
  // For now, just check if the user exists and has ADMIN role
  try {
    // This would typically query the database
    // For demo purposes, return true for specific admin IDs
    return userId === 'admin-user-id' || userId.startsWith('admin-');
  } catch {
    return false;
  }
}

/**
 * Rate limiting for admin operations
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per window
const RATE_WINDOW = 60 * 1000; // 1 minute

export function checkRateLimit(adminId: string): boolean {
  const now = Date.now();
  const userLimit = requestCounts.get(adminId);

  if (!userLimit || now > userLimit.resetTime) {
    requestCounts.set(adminId, { count: 1, resetTime: now + RATE_WINDOW });
    return true;
  }

  if (userLimit.count >= RATE_LIMIT) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Middleware to extract and validate admin from request headers
 */
export async function validateAdminRequest(request: Request): Promise<{
  isValid: boolean;
  admin?: AdminToken;
  error?: string;
}> {
  const authHeader = request.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { isValid: false, error: 'Missing authorization header' };
  }

  const token = authHeader.substring(7);
  const admin = verifyAdminToken(token);
  
  if (!admin) {
    return { isValid: false, error: 'Invalid token' };
  }

  // Check rate limiting
  if (!checkRateLimit(admin.userId)) {
    return { isValid: false, error: 'Rate limit exceeded' };
  }

  // Validate admin exists and has permissions
  if (!(await isValidAdmin(admin.userId))) {
    return { isValid: false, error: 'Admin not authorized' };
  }

  return { isValid: true, admin };
}