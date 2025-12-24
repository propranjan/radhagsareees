/**
 * API Route: POST /api/tryon/generate
 * Generates AI saree try-on output for user image
 * 
 * Request body:
 * {
 *   userImageUrl: string        // Cloudinary URL of user image
 *   sku: string                 // Saree product SKU
 *   variant?: string            // Saree variant (default: 'default')
 *   userId?: string             // User ID for tracking
 * }
 * 
 * Response:
 * {
 *   success: boolean
 *   data?: {
 *     outputImageUrl: string
 *     poseData: PoseResult
 *     processingTime: number
 *   }
 *   error?: string
 * }
 */

import { NextRequest, NextResponse } from 'next/server';
import TryOnService from '@/lib/services/tryOn.service';
import { CloudinaryUploadManager, SareeAssetManager } from '@/lib/services/cloudinary.service';

// Note: Database logging is optional. Uncomment if you have Prisma setup
// import { PrismaClient } from '@radhagsareees/db';
// const prisma = new PrismaClient();

// Timeout configuration
const PROCESSING_TIMEOUT = 180000; // 3 minutes

/**
 * Handler for try-on generation requests
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userImageUrl, sku, variant = 'default', userId } = body;

    // Validate required fields
    if (!userImageUrl || !sku) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: userImageUrl, sku' },
        { status: 400 }
      );
    }

    // Log request
    console.log(`Try-on request: SKU=${sku}, variant=${variant}, userId=${userId}`);

    // Create processing session
    const sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Validate saree assets exist (warn if missing, but don't block)
    console.log(`Validating saree assets for SKU: ${sku}, variant: ${variant}`);
    const assetsValid = await SareeAssetManager.validateSareeAssets(sku, variant);
    
    if (!assetsValid.allPresent) {
      console.warn(`Warning: Incomplete saree assets for SKU: ${sku}`, {
        hasImage: assetsValid.hasImage,
        hasMask: assetsValid.hasMask,
        hasOverlay: assetsValid.hasOverlay,
      });
      // Continue with processing - try-on can work with partial assets
      // The AI model can generate results even without perfect mask/overlay
    }

    // Set timeout promise
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Processing timeout')), PROCESSING_TIMEOUT)
    );

    // Process with timeout
    const result = await Promise.race([
      processUserImage(userImageUrl, sku, variant, sessionId, userId),
      timeoutPromise,
    ]);

    // Log success
    if (userId) {
      await logTryOnActivity(userId, sku, variant, true);
    }

    return NextResponse.json({
      success: true,
      data: result,
      warning: !assetsValid.allPresent ? `Saree assets incomplete for SKU: ${sku}` : undefined,
    });
  } catch (error) {
    console.error('Try-on API error:', error);

    const message = error instanceof Error ? error.message : 'Unknown error';

    // Log failure
    const body = await request.json().catch(() => ({}));
    if (body.userId) {
      await logTryOnActivity(body.userId, body.sku, body.variant, false, message);
    }

    return NextResponse.json(
      {
        success: false,
        error: message,
      },
      { status: 500 }
    );
  }
}

/**
 * Process user image through try-on pipeline
 */
async function processUserImage(
  userImageUrl: string,
  sku: string,
  variant: string,
  sessionId: string,
  userId?: string
) {
  console.log(`Processing try-on for session: ${sessionId}`);

  // Step 1: Download user image from Cloudinary
  const userImageBuffer = await downloadImage(userImageUrl);

  // Step 2: Download saree assets from Cloudinary
  const uploader = new CloudinaryUploadManager();
  const { CloudinaryPaths } = require('@/lib/services/cloudinary.service');
  
  const sareePaths = CloudinaryPaths.getSareePaths(sku, variant);
  const sareeImageBuffer = await downloadImage(sareePaths.image.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!));
  const sareeMaskBuffer = await downloadImage(sareePaths.mask.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!));

  // Step 3: Call TryOn service
  const tryOnResult = await TryOnService.generateTryOn(userImageBuffer, {
    imageUrl: sareePaths.image.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!),
    maskUrl: sareePaths.mask.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!),
    overlayUrl: sareePaths.overlay.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!),
    sku,
    variant,
  }, {
    modelEndpoint: process.env.TRYON_MODEL_ENDPOINT || 'https://api.replicate.com/v1/predictions',
    modelType: (process.env.TRYON_MODEL_TYPE || 'viton-hd') as any,
    modelApiKey: process.env.REPLICATE_API_TOKEN,
  });

  // Step 4: Upload output to Cloudinary (placeholder - use actual buffer)
  const outputUpload = await uploader.uploadTryOnOutput(
    sareeImageBuffer, // In production: use actual tryOnResult buffer
    userId || 'anonymous',
    sku,
    sessionId
  );

  console.log(`Try-on completed: ${outputUpload.publicId}`);

  return {
    outputImageUrl: outputUpload.secureUrl,
    originalImageUrl: userImageUrl,
    poseData: tryOnResult.poseData,
    processingTime: tryOnResult.processingTime,
    sessionId,
  };
}

/**
 * Download image from URL (Cloudinary or external)
 */
async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error(`Failed to download image: ${response.statusText}`);
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    console.error('Image download error:', error);
    throw new Error(`Failed to download image from ${imageUrl}`);
  }
}

/**
 * Log try-on activity to database (Optional)
 */
async function logTryOnActivity(
  userId: string,
  sku: string,
  variant: string,
  success: boolean,
  error?: string
) {
  try {
    // Database logging is optional - uncomment if you have TryOnLog table
    // const prisma = new PrismaClient();
    // await prisma.tryOnLog.create({ data: { userId, productSku: sku, variant, success, error, timestamp: new Date() } });
    console.log('Try-on activity:', { userId, sku, variant, success, error });
  } catch (err) {
    // Log error but don't fail the request
    console.error('Failed to log activity:', err);
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
