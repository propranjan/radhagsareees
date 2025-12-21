/**
 * Cloudinary Configuration and Utilities
 * 
 * This module provides server-side utilities for interacting with Cloudinary.
 * IMPORTANT: Never import this file in client components as it contains secrets.
 * 
 * Environment Variables Required:
 * - CLOUDINARY_CLOUD_NAME: Your Cloudinary cloud name
 * - CLOUDINARY_API_KEY: Your Cloudinary API key
 * - CLOUDINARY_API_SECRET: Your Cloudinary API secret (keep this secret!)
 */

import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';

// Validate environment variables at module load
const validateCloudinaryEnv = () => {
  const required = ['CLOUDINARY_CLOUD_NAME', 'CLOUDINARY_API_KEY', 'CLOUDINARY_API_SECRET'];
  const missing = required.filter((key) => !process.env[key]);
  
  if (missing.length > 0) {
    console.warn(`[Cloudinary] Missing environment variables: ${missing.join(', ')}`);
    return false;
  }
  return true;
};

// Configure Cloudinary with environment variables
// This configuration is used for all SDK operations
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true, // Always use HTTPS
});

// Export configured instance for advanced usage
export { cloudinary };

// Check if Cloudinary is properly configured
export const isCloudinaryConfigured = validateCloudinaryEnv();

/**
 * Upload result interface
 */
export interface CloudinaryUploadResult {
  success: boolean;
  url?: string;
  secureUrl?: string;
  publicId?: string;
  width?: number;
  height?: number;
  format?: string;
  bytes?: number;
  error?: string;
}

/**
 * Upload options interface
 */
export interface UploadOptions {
  folder: string;
  publicId?: string;
  transformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  };
  overwrite?: boolean;
  tags?: string[];
}

/**
 * Maximum file size in bytes (5MB)
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed MIME types for product images
 */
export const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
  'image/gif',
];

/**
 * Validate image file before upload
 * 
 * @param file - The file buffer or base64 string
 * @param mimeType - The MIME type of the file
 * @param fileSize - The size of the file in bytes
 * @returns Validation result with error message if invalid
 */
export const validateImageFile = (
  mimeType: string,
  fileSize: number
): { valid: boolean; error?: string } => {
  // Check file size
  if (fileSize > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum allowed size of ${MAX_FILE_SIZE / (1024 * 1024)}MB`,
    };
  }

  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(mimeType.toLowerCase())) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    };
  }

  return { valid: true };
};

/**
 * Upload an image to Cloudinary
 * 
 * @param imageData - Base64 encoded image data or data URI
 * @param options - Upload options including folder and transformations
 * @returns Upload result with URL and metadata
 * 
 * @example
 * ```typescript
 * const result = await uploadImage(base64Data, {
 *   folder: 'radhag-sarees/products/SKU123',
 *   tags: ['product', 'saree']
 * });
 * ```
 */
export const uploadImage = async (
  imageData: string,
  options: UploadOptions
): Promise<CloudinaryUploadResult> => {
  // Ensure Cloudinary is configured
  if (!isCloudinaryConfigured) {
    return {
      success: false,
      error: 'Cloudinary is not properly configured. Check environment variables.',
    };
  }

  try {
    // Prepare upload options with auto optimization
    const uploadOptions: Record<string, unknown> = {
      folder: options.folder,
      resource_type: 'image',
      // Enable automatic format and quality optimization
      // This uses Cloudinary's intelligent compression
      transformation: [
        {
          quality: 'auto:good', // Auto quality with good balance
          fetch_format: 'auto', // Auto format (WebP for supported browsers)
        },
        ...(options.transformation
          ? [
              {
                width: options.transformation.width,
                height: options.transformation.height,
                crop: options.transformation.crop || 'limit',
              },
            ]
          : []),
      ],
      overwrite: options.overwrite ?? true,
      invalidate: true, // Invalidate CDN cache on overwrite
      tags: options.tags || [],
    };

    // Set public_id if provided (without folder prefix, Cloudinary adds it)
    if (options.publicId) {
      uploadOptions.public_id = options.publicId;
    }

    // Upload to Cloudinary
    const result: UploadApiResponse = await cloudinary.uploader.upload(
      imageData,
      uploadOptions
    );

    return {
      success: true,
      url: result.url,
      secureUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    };
  } catch (error) {
    const cloudinaryError = error as UploadApiErrorResponse;
    console.error('[Cloudinary] Upload error:', cloudinaryError);
    
    return {
      success: false,
      error: cloudinaryError.message || 'Failed to upload image to Cloudinary',
    };
  }
};

/**
 * Delete an image from Cloudinary
 * 
 * @param publicId - The public ID of the image to delete
 * @returns Success status
 */
export const deleteImage = async (
  publicId: string
): Promise<{ success: boolean; error?: string }> => {
  if (!isCloudinaryConfigured) {
    return {
      success: false,
      error: 'Cloudinary is not properly configured',
    };
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      error: result.result !== 'ok' ? `Failed to delete: ${result.result}` : undefined,
    };
  } catch (error) {
    console.error('[Cloudinary] Delete error:', error);
    return {
      success: false,
      error: 'Failed to delete image from Cloudinary',
    };
  }
};

/**
 * Generate an optimized Cloudinary URL for an image
 * 
 * This is useful for transforming existing Cloudinary images
 * with different sizes or formats.
 * 
 * @param publicId - The public ID of the image
 * @param options - Transformation options
 * @returns Optimized image URL
 */
export const getOptimizedUrl = (
  publicId: string,
  options: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  } = {}
): string => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName) {
    console.warn('[Cloudinary] Cloud name not configured');
    return '';
  }

  // Build transformation string
  const transformations: string[] = [];
  
  // Always add auto quality and format for optimization
  transformations.push(options.quality || 'q_auto');
  transformations.push(options.format || 'f_auto');
  
  if (options.width) transformations.push(`w_${options.width}`);
  if (options.height) transformations.push(`h_${options.height}`);
  if (options.crop) transformations.push(`c_${options.crop}`);

  const transformString = transformations.join(',');

  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`;
};

/**
 * Extract public ID from a Cloudinary URL
 * 
 * @param url - The Cloudinary URL
 * @returns The public ID or null if not a valid Cloudinary URL
 */
export const extractPublicId = (url: string): string | null => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  
  if (!cloudName || !url.includes('res.cloudinary.com')) {
    return null;
  }

  try {
    // Pattern: https://res.cloudinary.com/{cloud}/image/upload/{transformations}/{public_id}.{ext}
    const regex = /\/upload\/(?:v\d+\/)?(.+?)(?:\.\w+)?$/;
    const match = url.match(regex);
    
    if (match && match[1]) {
      // Remove any transformation prefix
      const publicId = match[1].replace(/^[a-z_,0-9]+\//, '');
      return publicId;
    }
    
    return null;
  } catch {
    return null;
  }
};
