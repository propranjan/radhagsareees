/**
 * Cloudinary Upload Signature API
 * Generates signatures for client-side uploads to Cloudinary
 */

import { NextRequest, NextResponse } from 'next/server';
import { cloudinaryService } from '@/lib/services/cloudinary.service';

/**
 * POST /api/cloudinary/signature
 * Generate upload signature for client-side Cloudinary uploads
 */
export async function POST(request: NextRequest) {
  try {
    // Validate Cloudinary credentials are set
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error('Missing Cloudinary configuration:', {
        cloudName: !!cloudName,
        apiKey: !!apiKey,
        apiSecret: !!apiSecret,
      });
      return NextResponse.json(
        { 
          error: 'Cloudinary not configured. Please set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in environment variables.',
        },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { folder = 'saree-tryon/user-images' } = body;

    // Validate folder name
    if (!folder || typeof folder !== 'string') {
      return NextResponse.json(
        { error: 'Invalid folder parameter' },
        { status: 400 }
      );
    }

    // Get signature from service
    const signatureData = cloudinaryService.getUploadSignature(folder);

    return NextResponse.json(signatureData, { status: 200 });
  } catch (error) {
    console.error('Error generating upload signature:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate upload signature';
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
