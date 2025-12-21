/**
 * Product Image Upload API Route
 * 
 * POST /api/upload/product-image
 * 
 * This endpoint handles secure server-side uploads of product images to Cloudinary.
 * It accepts either base64 encoded images or multipart form data.
 * 
 * Security:
 * - Server-side only (Cloudinary credentials never exposed to browser)
 * - File size limit: 5MB
 * - Allowed types: JPEG, PNG, WebP, GIF
 * - Requires authentication (optional, can be enabled)
 * 
 * Request Body (JSON):
 * - image: string (base64 data URI or plain base64)
 * - sku: string (product SKU for folder organization)
 * - filename?: string (optional custom filename)
 * 
 * Request Body (Form Data):
 * - image: File (image file)
 * - sku: string (product SKU)
 * - filename?: string (optional custom filename)
 * 
 * Response:
 * - success: boolean
 * - secureUrl: string (Cloudinary HTTPS URL)
 * - publicId: string (Cloudinary public ID for future operations)
 * - width: number
 * - height: number
 * - error?: string (if success is false)
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  uploadImage,
  validateImageFile,
  MAX_FILE_SIZE,
  ALLOWED_MIME_TYPES,
  isCloudinaryConfigured,
} from '@/lib/cloudinary';
// Note: Authentication is optional - uncomment below if needed
// import { supabase } from '@/lib/supabase';

// Folder structure for product images
const PRODUCT_IMAGES_FOLDER = 'radhag-sarees/products';

/**
 * Validate SKU format
 * SKUs should be alphanumeric with optional hyphens/underscores
 */
const isValidSku = (sku: string): boolean => {
  if (!sku || typeof sku !== 'string') return false;
  // Allow alphanumeric, hyphens, underscores, max 50 chars
  const skuPattern = /^[a-zA-Z0-9_-]{1,50}$/;
  return skuPattern.test(sku);
};

/**
 * Extract MIME type from base64 data URI
 */
const getMimeTypeFromDataUri = (dataUri: string): string | null => {
  const match = dataUri.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
  return match ? match[1] : null;
};

/**
 * Calculate base64 file size (approximate)
 * Base64 encoding increases size by ~33%
 */
const getBase64FileSize = (base64String: string): number => {
  // Remove data URI prefix if present
  const base64Data = base64String.replace(/^data:[^;]+;base64,/, '');
  // Calculate original file size
  const padding = (base64Data.match(/=/g) || []).length;
  return (base64Data.length * 3) / 4 - padding;
};

/**
 * Handle JSON request with base64 image
 */
async function handleJsonRequest(request: NextRequest): Promise<NextResponse> {
  const body = await request.json();
  const { image, sku, filename } = body;

  // Validate required fields
  if (!image || typeof image !== 'string') {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid image data' },
      { status: 400 }
    );
  }

  if (!isValidSku(sku)) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing SKU. Use alphanumeric characters, hyphens, or underscores.' },
      { status: 400 }
    );
  }

  // Determine if it's a data URI or plain base64
  let imageData = image;
  let mimeType = 'image/jpeg'; // Default

  if (image.startsWith('data:')) {
    const detectedMime = getMimeTypeFromDataUri(image);
    if (detectedMime) mimeType = detectedMime;
  } else {
    // Plain base64 - assume JPEG and add data URI prefix
    imageData = `data:image/jpeg;base64,${image}`;
  }

  // Validate file type
  const validation = validateImageFile(mimeType, getBase64FileSize(imageData));
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  // Upload to Cloudinary
  const result = await uploadImage(imageData, {
    folder: `${PRODUCT_IMAGES_FOLDER}/${sku}`,
    publicId: filename || undefined,
    tags: ['product', sku],
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    secureUrl: result.secureUrl,
    publicId: result.publicId,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  });
}

/**
 * Handle multipart form data request
 */
async function handleFormDataRequest(request: NextRequest): Promise<NextResponse> {
  const formData = await request.formData();
  const imageFile = formData.get('image') as File | null;
  const sku = formData.get('sku') as string | null;
  const filename = formData.get('filename') as string | null;

  // Validate required fields
  if (!imageFile || !(imageFile instanceof File)) {
    return NextResponse.json(
      { success: false, error: 'Missing or invalid image file' },
      { status: 400 }
    );
  }

  if (!sku || !isValidSku(sku)) {
    return NextResponse.json(
      { success: false, error: 'Invalid or missing SKU. Use alphanumeric characters, hyphens, or underscores.' },
      { status: 400 }
    );
  }

  // Validate file type and size
  const validation = validateImageFile(imageFile.type, imageFile.size);
  if (!validation.valid) {
    return NextResponse.json(
      { success: false, error: validation.error },
      { status: 400 }
    );
  }

  // Convert file to base64 data URI
  const arrayBuffer = await imageFile.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64 = buffer.toString('base64');
  const dataUri = `data:${imageFile.type};base64,${base64}`;

  // Upload to Cloudinary
  const result = await uploadImage(dataUri, {
    folder: `${PRODUCT_IMAGES_FOLDER}/${sku}`,
    publicId: filename || undefined,
    tags: ['product', sku],
  });

  if (!result.success) {
    return NextResponse.json(
      { success: false, error: result.error },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    secureUrl: result.secureUrl,
    publicId: result.publicId,
    width: result.width,
    height: result.height,
    format: result.format,
    bytes: result.bytes,
  });
}

/**
 * POST /api/upload/product-image
 * 
 * Upload a product image to Cloudinary
 */
export async function POST(request: NextRequest) {
  try {
    // Check if Cloudinary is configured
    if (!isCloudinaryConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Image upload service is not configured. Please contact support.',
        },
        { status: 503 }
      );
    }

    // Optional: Verify user is authenticated (uncomment to enable)
    // This is useful for production to prevent unauthorized uploads
    /*
    import { supabase } from '@/lib/supabase';
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      );
    }
    */

    // Determine content type and handle accordingly
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      return handleJsonRequest(request);
    } else if (contentType.includes('multipart/form-data')) {
      return handleFormDataRequest(request);
    } else {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid content type. Use application/json or multipart/form-data.',
        },
        { status: 415 }
      );
    }
  } catch (error) {
    console.error('[Upload API] Error:', error);
    
    // Handle specific errors
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON format' },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to process upload request' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/upload/product-image
 * 
 * Return upload configuration and limits
 */
export async function GET() {
  return NextResponse.json({
    configured: isCloudinaryConfigured,
    limits: {
      maxFileSize: MAX_FILE_SIZE,
      maxFileSizeMB: MAX_FILE_SIZE / (1024 * 1024),
      allowedTypes: ALLOWED_MIME_TYPES,
    },
    folder: PRODUCT_IMAGES_FOLDER,
    optimization: {
      quality: 'auto:good',
      format: 'auto',
    },
  });
}
