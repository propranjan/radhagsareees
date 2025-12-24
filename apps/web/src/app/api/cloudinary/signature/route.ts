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
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    );
  }
}
