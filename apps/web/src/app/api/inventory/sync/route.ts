import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { z } from 'zod';
import { PrismaClient } from '@radhagsareees/db';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

// Validation schema for inventory sync requests
const inventorySyncSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string().min(1, 'Variant ID is required'),
    qtyAvailable: z.number().min(0, 'Quantity must be non-negative').max(10000, 'Quantity too high'),
    lowStockThreshold: z.number().min(0, 'Threshold must be non-negative').max(100, 'Threshold too high'),
  })).min(1, 'At least one update required').max(100, 'Too many updates in single request'),
  adminUserId: z.string().min(1, 'Admin user ID required'),
  timestamp: z.number().min(Date.now() - 300000, 'Request too old (max 5 minutes)').max(Date.now() + 60000, 'Future timestamp not allowed'),
  signature: z.string().min(1, 'Signature required'),
});

type InventorySyncData = z.infer<typeof inventorySyncSchema>;

// Environment variables
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'fallback-secret-key';
const MAX_REQUESTS_PER_MINUTE = 30;

// Rate limiting storage (in production, use Redis or similar)
const rateLimits = new Map<string, { count: number; resetTime: number }>();

/**
 * Create signature for inventory sync requests
 */
function createInventorySignature(data: {
  updates: Array<{
    variantId: string;
    qtyAvailable: number;
    lowStockThreshold: number;
  }>;
  adminUserId: string;
  timestamp: number;
}): string {
  // Sort updates by variantId to ensure consistent signature
  const sortedUpdates = data.updates
    .map(update => ({
      variantId: update.variantId,
      qtyAvailable: update.qtyAvailable,
      lowStockThreshold: update.lowStockThreshold,
    }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));

  const payload = JSON.stringify({
    updates: sortedUpdates,
    adminUserId: data.adminUserId,
    timestamp: data.timestamp,
  });

  return createHmac('sha256', ADMIN_SECRET).update(payload).digest('hex');
}

/**
 * Verify inventory sync signature
 */
function verifyInventorySignature(data: InventorySyncData): boolean {
  try {
    const expectedSignature = createInventorySignature({
      updates: data.updates,
      adminUserId: data.adminUserId,
      timestamp: data.timestamp,
    });

    return data.signature === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Check rate limiting
 */
function checkRateLimit(adminId: string): boolean {
  const now = Date.now();
  const userLimit = rateLimits.get(adminId);

  if (!userLimit || now > userLimit.resetTime) {
    rateLimits.set(adminId, { count: 1, resetTime: now + 60000 }); // 1 minute window
    return true;
  }

  if (userLimit.count >= MAX_REQUESTS_PER_MINUTE) {
    return false;
  }

  userLimit.count++;
  return true;
}

/**
 * Validate admin user
 */
async function validateAdminUser(adminUserId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: adminUserId },
      select: { role: true },
    });

    return user?.role === 'ADMIN';
  } catch (error) {
    console.error('Admin validation error:', error);
    return false;
  }
}

/**
 * Update inventory for variants
 */
async function updateInventory(updates: InventorySyncData['updates']) {
  const results = [];
  
  for (const update of updates) {
    try {
      // First, verify the variant exists
      const variant = await prisma.variant.findUnique({
        where: { id: update.variantId },
        select: { 
          id: true, 
          productId: true,
          inventory: { select: { id: true } }
        },
      });

      if (!variant) {
        results.push({
          variantId: update.variantId,
          success: false,
          error: 'Variant not found',
        });
        continue;
      }

      // Update or create inventory record
      const inventory = await prisma.inventory.upsert({
        where: { variantId: update.variantId },
        update: {
          qtyAvailable: update.qtyAvailable,
          lowStockThreshold: update.lowStockThreshold,
          updatedAt: new Date(),
        },
        create: {
          variantId: update.variantId,
          qtyAvailable: update.qtyAvailable,
          lowStockThreshold: update.lowStockThreshold,
        },
        select: {
          id: true,
          qtyAvailable: true,
          lowStockThreshold: true,
        },
      });

      // Trigger cache revalidation for the product
      revalidateTag(`product:${variant.productId}`);
      revalidateTag(`inventory:${update.variantId}`);

      results.push({
        variantId: update.variantId,
        success: true,
        inventory,
      });

    } catch (error) {
      console.error(`Failed to update inventory for variant ${update.variantId}:`, error);
      results.push({
        variantId: update.variantId,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return results;
}

/**
 * POST /api/inventory/sync
 * 
 * Accepts signed POST requests from admin to update inventory levels.
 * Validates signature, admin permissions, and rate limits.
 * Updates inventory and triggers cache revalidation.
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    // Validate request schema
    let validatedData: InventorySyncData;
    try {
      validatedData = inventorySyncSchema.parse(body);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: error.errors.map(e => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          },
          { status: 400 }
        );
      }
      throw error;
    }

    // Check rate limiting
    if (!checkRateLimit(validatedData.adminUserId)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded. Maximum 30 requests per minute.' },
        { status: 429 }
      );
    }

    // Verify signature
    if (!verifyInventorySignature(validatedData)) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Validate admin user
    if (!(await validateAdminUser(validatedData.adminUserId))) {
      return NextResponse.json(
        { error: 'Invalid admin user or insufficient permissions' },
        { status: 403 }
      );
    }

    // Update inventory
    const results = await updateInventory(validatedData.updates);

    // Check if any updates failed
    const failures = results.filter(r => !r.success);
    const successes = results.filter(r => r.success);

    // Trigger global cache revalidation if we had any successes
    if (successes.length > 0) {
      revalidateTag('products');
      revalidateTag('inventory');
    }

    return NextResponse.json({
      success: true,
      updated: successes.length,
      failed: failures.length,
      results,
      message: `Successfully updated ${successes.length} inventory records${failures.length > 0 ? ` (${failures.length} failed)` : ''}`,
    });

  } catch (error) {
    console.error('Inventory sync error:', error);
    
    return NextResponse.json(
      { 
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/inventory/sync
 * 
 * Health check and documentation endpoint
 */
export async function GET() {
  return NextResponse.json({
    message: 'Inventory Sync API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Update inventory levels with signed admin requests',
        requires: ['adminUserId', 'timestamp', 'signature', 'updates[]'],
        rateLimit: `${MAX_REQUESTS_PER_MINUTE} requests per minute per admin`,
        signatureAlgorithm: 'HMAC-SHA256',
      }
    },
    documentation: {
      signatureGeneration: 'Create HMAC-SHA256 of JSON payload with admin secret',
      timestampValidation: 'Timestamps must be within 5 minutes of server time',
      updateLimits: 'Maximum 100 inventory updates per request',
    }
  });
}