/**
 * Image Upload Security Scanner
 * Validates MIME types, file sizes, and pixel dimensions for uploaded images
 */

import { NextRequest } from 'next/server';
import sharp from 'sharp';

export interface ImageValidationConfig {
  allowedMimeTypes: string[];
  maxFileSize: number; // in bytes
  maxWidth: number;
  maxHeight: number;
  minWidth?: number;
  minHeight?: number;
  maxPixels?: number; // total pixels (width * height)
  aspectRatioTolerance?: number; // for specific aspect ratio validation
}

export interface ImageValidationResult {
  isValid: boolean;
  errors: string[];
  metadata?: {
    width: number;
    height: number;
    format: string;
    size: number;
    aspectRatio: number;
    pixels: number;
  };
}

/**
 * Default security configurations for different image types
 */
export const imageConfigs = {
  // Product images - high quality requirements
  productImages: {
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxWidth: 2048,
    maxHeight: 2048,
    minWidth: 300,
    minHeight: 300,
    maxPixels: 4194304 // 2048 * 2048
  } as ImageValidationConfig,

  // User profile pictures
  profilePictures: {
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxWidth: 800,
    maxHeight: 800,
    minWidth: 100,
    minHeight: 100,
    maxPixels: 640000, // 800 * 800
    aspectRatioTolerance: 0.1 // Square images preferred
  } as ImageValidationConfig,

  // Review images - moderate quality
  reviewImages: {
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxFileSize: 5 * 1024 * 1024, // 5MB
    maxWidth: 1200,
    maxHeight: 1200,
    minWidth: 200,
    minHeight: 200,
    maxPixels: 1440000 // 1200 * 1200
  } as ImageValidationConfig,

  // Try-on canvas images
  tryOnImages: {
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png'],
    maxFileSize: 3 * 1024 * 1024, // 3MB
    maxWidth: 1024,
    maxHeight: 1024,
    minWidth: 256,
    minHeight: 256,
    maxPixels: 1048576 // 1024 * 1024
  } as ImageValidationConfig
};

/**
 * Comprehensive MIME type detection
 * Uses both file extension and magic bytes for validation
 */
export class MimeTypeDetector {
  private static magicBytes: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/jpg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/gif': [0x47, 0x49, 0x46, 0x38],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // + WEBP at offset 8
    'image/bmp': [0x42, 0x4D],
    'image/tiff': [0x49, 0x49, 0x2A, 0x00], // Little endian
    'image/svg+xml': [0x3C, 0x73, 0x76, 0x67] // <svg
  };

  static async detectMimeType(buffer: ArrayBuffer | Uint8Array): Promise<string | null> {
    const bytes = new Uint8Array(buffer);
    
    // Check magic bytes
    for (const [mimeType, magic] of Object.entries(this.magicBytes)) {
      if (this.matchesMagicBytes(bytes, magic)) {
        // Special case for WebP - check for WEBP signature at offset 8
        if (mimeType === 'image/webp') {
          const webpSignature = [0x57, 0x45, 0x42, 0x50]; // WEBP
          if (bytes.length >= 12 && this.matchesMagicBytes(bytes.slice(8, 12), webpSignature)) {
            return mimeType;
          }
          continue;
        }
        return mimeType;
      }
    }
    
    return null;
  }

  private static matchesMagicBytes(bytes: Uint8Array, magic: number[]): boolean {
    if (bytes.length < magic.length) return false;
    
    for (let i = 0; i < magic.length; i++) {
      if (bytes[i] !== magic[i]) return false;
    }
    
    return true;
  }

  static getExtensionFromMimeType(mimeType: string): string {
    const extensions: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/jpg': 'jpg', 
      'image/png': 'png',
      'image/gif': 'gif',
      'image/webp': 'webp',
      'image/bmp': 'bmp',
      'image/tiff': 'tiff',
      'image/svg+xml': 'svg'
    };
    
    return extensions[mimeType] || 'unknown';
  }
}

/**
 * Image security scanner class
 */
export class ImageSecurityScanner {
  private config: ImageValidationConfig;

  constructor(config: ImageValidationConfig) {
    this.config = config;
  }

  /**
   * Validate uploaded image file
   */
  async validateImage(file: File): Promise<ImageValidationResult> {
    const errors: string[] = [];
    
    try {
      // 1. File size validation
      if (file.size > this.config.maxFileSize) {
        errors.push(`File size ${(file.size / 1024 / 1024).toFixed(2)}MB exceeds maximum allowed size of ${(this.config.maxFileSize / 1024 / 1024).toFixed(2)}MB`);
      }

      // 2. File type validation (basic check)
      if (!this.config.allowedMimeTypes.includes(file.type)) {
        errors.push(`File type ${file.type} is not allowed. Allowed types: ${this.config.allowedMimeTypes.join(', ')}`);
      }

      // 3. Convert to buffer for deeper analysis
      const buffer = await file.arrayBuffer();
      
      // 4. Magic bytes validation (MIME sniffing protection)
      const detectedMimeType = await MimeTypeDetector.detectMimeType(buffer);
      
      if (!detectedMimeType) {
        errors.push('Unable to detect image format from file content');
        return { isValid: false, errors };
      }

      if (!this.config.allowedMimeTypes.includes(detectedMimeType)) {
        errors.push(`Detected file type ${detectedMimeType} does not match declared type ${file.type} or is not allowed`);
      }

      // 5. Image metadata extraction using Sharp
      let metadata: any;
      try {
        const image = sharp(buffer);
        metadata = await image.metadata();
      } catch (error) {
        errors.push('Invalid or corrupted image file');
        return { isValid: false, errors };
      }

      // 6. Dimension validation
      const { width = 0, height = 0 } = metadata;
      
      if (width > this.config.maxWidth) {
        errors.push(`Image width ${width}px exceeds maximum allowed width of ${this.config.maxWidth}px`);
      }
      
      if (height > this.config.maxHeight) {
        errors.push(`Image height ${height}px exceeds maximum allowed height of ${this.config.maxHeight}px`);
      }

      if (this.config.minWidth && width < this.config.minWidth) {
        errors.push(`Image width ${width}px is below minimum required width of ${this.config.minWidth}px`);
      }
      
      if (this.config.minHeight && height < this.config.minHeight) {
        errors.push(`Image height ${height}px is below minimum required height of ${this.config.minHeight}px`);
      }

      // 7. Total pixels validation (DoS protection)
      const totalPixels = width * height;
      if (this.config.maxPixels && totalPixels > this.config.maxPixels) {
        errors.push(`Image has ${totalPixels} pixels, exceeding maximum of ${this.config.maxPixels} pixels`);
      }

      // 8. Aspect ratio validation (if configured)
      if (this.config.aspectRatioTolerance !== undefined) {
        const aspectRatio = width / height;
        const expectedRatio = 1.0; // Square images
        const deviation = Math.abs(aspectRatio - expectedRatio);
        
        if (deviation > this.config.aspectRatioTolerance) {
          errors.push(`Image aspect ratio ${aspectRatio.toFixed(2)} deviates too much from expected ratio ${expectedRatio}`);
        }
      }

      // 9. Advanced security checks
      await this.performSecurityChecks(buffer, metadata, errors);

      // Build result metadata
      const resultMetadata = {
        width,
        height,
        format: metadata.format || 'unknown',
        size: buffer.byteLength,
        aspectRatio: width / height,
        pixels: totalPixels
      };

      return {
        isValid: errors.length === 0,
        errors,
        metadata: resultMetadata
      };

    } catch (error) {
      console.error('Image validation error:', error);
      errors.push('Failed to validate image file');
      return { isValid: false, errors };
    }
  }

  /**
   * Advanced security checks for images
   */
  private async performSecurityChecks(
    buffer: ArrayBuffer, 
    metadata: any, 
    errors: string[]
  ): Promise<void> {
    try {
      const bytes = new Uint8Array(buffer);
      
      // Check for embedded scripts or suspicious content
      const suspiciousPatterns = [
        // JavaScript patterns
        /<script/i,
        /javascript:/i,
        /vbscript:/i,
        /on\w+\s*=/i, // Event handlers like onclick=
        
        // PHP patterns
        /<\?php/i,
        /<%/,
        
        // SVG script injection
        /<svg[^>]*>[\s\S]*<script/i,
        
        // Data URLs
        /data:(?!image\/)/i
      ];

      const content = new TextDecoder('utf-8', { fatal: false }).decode(bytes.slice(0, Math.min(bytes.length, 8192)));
      
      for (const pattern of suspiciousPatterns) {
        if (pattern.test(content)) {
          errors.push('Image contains potentially malicious content');
          break;
        }
      }

      // Check for excessive EXIF data (potential data hiding)
      if (metadata.exif && metadata.exif.length > 65536) { // 64KB limit
        errors.push('Image contains excessive metadata which may indicate data hiding');
      }

      // Check image density (pixel density validation)
      if (metadata.density && metadata.density > 600) {
        errors.push('Image has unusually high pixel density which may indicate manipulation');
      }

      // Check for animation (GIF bomb protection)
      if (metadata.pages && metadata.pages > 1) {
        if (metadata.format === 'gif' && metadata.pages > 100) {
          errors.push('Animated GIF has too many frames (potential GIF bomb)');
        }
      }

    } catch (error) {
      // Ignore security check errors to avoid false positives
      console.warn('Advanced security check failed:', error);
    }
  }

  /**
   * Sanitize and optimize image
   */
  async sanitizeImage(file: File, outputFormat: 'jpeg' | 'png' | 'webp' = 'jpeg'): Promise<Buffer> {
    const buffer = await file.arrayBuffer();
    
    try {
      let image = sharp(buffer);
      
      // Remove all metadata (EXIF, IPTC, XMP, etc.)
      image = image.rotate(); // Auto-rotate based on EXIF, then strip EXIF
      
      // Resize if needed to enforce limits
      if (this.config.maxWidth || this.config.maxHeight) {
        image = image.resize(this.config.maxWidth, this.config.maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        });
      }

      // Convert to safe format with compression
      switch (outputFormat) {
        case 'jpeg':
          image = image.jpeg({ 
            quality: 90, 
            progressive: true,
            mozjpeg: true 
          });
          break;
        case 'png':
          image = image.png({ 
            compressionLevel: 6,
            adaptiveFiltering: true
          });
          break;
        case 'webp':
          image = image.webp({ 
            quality: 90,
            effort: 4
          });
          break;
      }

      return await image.toBuffer();
    } catch (error) {
      console.error('Image sanitization error:', error);
      throw new Error('Failed to sanitize image');
    }
  }
}

/**
 * Express/Next.js middleware for image upload validation
 */
export function validateImageUpload(config: ImageValidationConfig) {
  const scanner = new ImageSecurityScanner(config);
  
  return async function imageValidationMiddleware(file: File): Promise<ImageValidationResult> {
    return await scanner.validateImage(file);
  };
}

/**
 * Utility function to create image validators for different use cases
 */
export const imageValidators = {
  product: validateImageUpload(imageConfigs.productImages),
  profile: validateImageUpload(imageConfigs.profilePictures),
  review: validateImageUpload(imageConfigs.reviewImages),
  tryOn: validateImageUpload(imageConfigs.tryOnImages)
};

/**
 * Multi-file validation for batch uploads
 */
export async function validateMultipleImages(
  files: File[],
  config: ImageValidationConfig,
  maxFiles: number = 10
): Promise<{
  isValid: boolean;
  results: Array<ImageValidationResult & { fileName: string }>;
  globalErrors: string[];
}> {
  const globalErrors: string[] = [];
  
  // Check file count limit
  if (files.length > maxFiles) {
    globalErrors.push(`Too many files uploaded. Maximum allowed: ${maxFiles}`);
  }

  // Check total size limit (all files combined)
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const maxTotalSize = config.maxFileSize * files.length;
  
  if (totalSize > maxTotalSize) {
    globalErrors.push(`Total upload size exceeds limit`);
  }

  const scanner = new ImageSecurityScanner(config);
  const results = await Promise.all(
    files.map(async (file) => ({
      fileName: file.name,
      ...(await scanner.validateImage(file))
    }))
  );

  const allValid = globalErrors.length === 0 && results.every(r => r.isValid);

  return {
    isValid: allValid,
    results,
    globalErrors
  };
}