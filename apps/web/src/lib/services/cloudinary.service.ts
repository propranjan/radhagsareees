/**
 * Cloudinary Integration Service
 * Manages image storage, transformations, and saree asset organization
 */

import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';

/**
 * Initialize Cloudinary configuration
 */
export const initializeCloudinary = () => {
  if (!process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error('Missing Cloudinary configuration environment variables');
  }

  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  return cloudinary;
};

/**
 * Cloudinary folder structure for organized asset management
 */
export const CLOUDINARY_FOLDERS = {
  // Media library base (main source for saree images)
  MEDIA_LIBRARY: 'radhag-sarees',
  
  // User uploads
  USER_UPLOADS: 'saree-tryon/user-images',
  USER_UPLOADS_TEMP: 'saree-tryon/user-images/temp',
  
  // Saree product assets (from media library)
  SAREE_IMAGES: 'radhag-sarees',
  SAREE_MASKS: 'saree-tryon/saree-assets/masks',
  SAREE_OVERLAYS: 'saree-tryon/saree-assets/overlays',
  SAREE_TEXTURES: 'saree-tryon/saree-assets/textures',
  
  // Try-on outputs
  TRYON_OUTPUTS: 'saree-tryon/outputs/tryon-results',
  TRYON_TEMP: 'saree-tryon/outputs/temp',
  
  // Processing cache
  PROCESSING_CACHE: 'saree-tryon/cache/processing',
};

/**
 * Cloudinary paths utility
 * Generates organized URLs for saree assets by SKU
 * 
 * Actual Cloudinary structure:
 * radhag-sarees/categories/[category]/products/[sku]/variants/[sku-variant]/
 *   ├── images/
 *   │   ├── front
 *   │   ├── back
 *   │   └── closeup
 *   └── overlay/
 *       └── overlay
 */
export class CloudinaryPaths {
  /**
   * Get paths for a specific saree by SKU and variant from media library
   * Note: Category must be determined from product data or derived from SKU prefix
   */
  static getSareePaths(sku: string, variant: string = 'default', category: string = 'banarasi') {
    // Extract variant from SKU if not provided separately
    // SKU format: [category-prefix]-[number]-[color] (e.g., BAN-001-BLU)
    const variantCode = variant === 'default' ? sku.toLowerCase() : variant.toLowerCase();
    
    // Build paths based on actual Cloudinary structure
    const imagePath = `radhag-sarees/categories/${category}/products/${sku}/variants/${variantCode}/images`;
    const overlayPath = `radhag-sarees/categories/${category}/products/${sku}/variants/${variantCode}/overlay`;

    return {
      // Front image (primary product image)
      image: {
        folder: imagePath,
        filename: 'front',
        url: (cloudName: string) => 
          `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${imagePath}/front`,
      },
      // Back image
      imageBack: {
        folder: imagePath,
        filename: 'back',
        url: (cloudName: string) => 
          `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${imagePath}/back`,
      },
      // Close-up image
      imageCloseup: {
        folder: imagePath,
        filename: 'closeup',
        url: (cloudName: string) => 
          `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${imagePath}/closeup`,
      },
      // Overlay mask for try-on
      overlay: {
        folder: overlayPath,
        filename: 'overlay',
        url: (cloudName: string) => 
          `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${overlayPath}/overlay`,
      },
      // Legacy mask path (for backward compatibility)
      mask: {
        folder: overlayPath,
        filename: 'mask',
        url: (cloudName: string) => 
          `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${overlayPath}/mask`,
      },
    };
  }

  /**
   * Generate Cloudinary URL with transformations for try-on display
   */
  static generateTransformUrl(
    publicId: string,
    transformations: {
      width?: number;
      height?: number;
      quality?: string;
      fetchFormat?: string;
      radius?: number;
      gravity?: string;
      crop?: string;
      effect?: string;
    } = {}
  ): string {
    const {
      width = 512,
      height = 768,
      quality = 'auto',
      fetchFormat = 'auto',
      radius = 0,
      gravity = 'auto',
      crop = 'fill',
    } = transformations;

    return cloudinary.url(publicId, {
      width,
      height,
      crop,
      quality,
      fetchFormat,
      radius,
      gravity,
      secure: true,
    });
  }

  /**
   * Get optimized URL for saree image display
   */
  static getSareeImageUrl(publicId: string): string {
    return this.generateTransformUrl(publicId, {
      width: 512,
      height: 768,
      quality: 'auto',
      fetchFormat: 'auto',
    });
  }

  /**
   * Get thumbnail URL for variant selector
   */
  static getThumbnailUrl(publicId: string): string {
    return this.generateTransformUrl(publicId, {
      width: 200,
      height: 300,
      quality: 'auto',
      fetchFormat: 'auto',
    });
  }

  /**
   * Get before/after comparison image URL
   */
  static getComparisonUrl(
    beforePublicId: string,
    afterPublicId: string
  ): string {
    // Cloudinary concatenation for side-by-side comparison
    return `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/c_pad,h_384,w_1024/l_${afterPublicId},w_512,fl_layer_apply/${beforePublicId}`;
  }
}

/**
 * Cloudinary Upload Manager
 */
export class CloudinaryUploadManager {
  private cloudinary: typeof cloudinary;

  constructor() {
    this.cloudinary = initializeCloudinary();
  }

  /**
   * Upload user image with automatic optimizations
   */
  async uploadUserImage(
    buffer: Buffer,
    userId: string,
    sessionId: string,
    options: {
      folder?: string;
      tags?: string[];
      isTemp?: boolean;
    } = {}
  ): Promise<{
    publicId: string;
    url: string;
    secureUrl: string;
    width: number;
    height: number;
  }> {
    const {
      folder = CLOUDINARY_FOLDERS.USER_UPLOADS,
      tags = [],
      isTemp = true,
    } = options;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: folder,
          public_id: `user-${userId}-${sessionId}`,
          resource_type: 'auto',
          quality: 'auto',
          format: 'jpg',
          tags: ['user-upload', `user-${userId}`, ...tags],
          // Auto-optimize
          eager: [
            { width: 512, height: 768, crop: 'fill', quality: 'auto' },
            { width: 200, height: 300, crop: 'fill', quality: 'auto' },
          ],
          eager_async: true,
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Upload failed: ${error.message}`));
          } else {
            resolve({
              publicId: result!.public_id,
              url: result!.url,
              secureUrl: result!.secure_url,
              width: result!.width,
              height: result!.height,
            });
          }
        }
      );

      // Convert buffer to stream and pipe to Cloudinary
      const readable = Readable.from(buffer);
      readable.pipe(stream);
    });
  }

  /**
   * Upload saree product image with variant management
   */
  async uploadSareeImage(
    buffer: Buffer,
    sku: string,
    variant: string = 'default',
    imageType: 'image' | 'mask' | 'overlay' = 'image'
  ): Promise<string> {
    const paths = CloudinaryPaths.getSareePaths(sku, variant);
    const pathConfig = paths[imageType] as any;

    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: pathConfig.folder,
          public_id: pathConfig.filename,
          resource_type: 'auto',
          quality: imageType === 'mask' ? 'auto' : 'auto',
          format: imageType === 'mask' ? 'png' : 'jpg',
          tags: ['saree-asset', `sku-${sku}`, `variant-${variant}`, `type-${imageType}`],
          overwrite: true,
          eager: imageType === 'image' ? [
            { width: 512, height: 768, crop: 'fill' },
          ] : [],
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Saree upload failed: ${error.message}`));
          } else {
            resolve(result!.public_id);
          }
        }
      );

      const readable = Readable.from(buffer);
      readable.pipe(stream);
    });
  }

  /**
   * Upload try-on output result
   */
  async uploadTryOnOutput(
    buffer: Buffer,
    userId: string,
    sku: string,
    sessionId: string
  ): Promise<{
    publicId: string;
    url: string;
    secureUrl: string;
  }> {
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder: CLOUDINARY_FOLDERS.TRYON_OUTPUTS,
          public_id: `tryon-${userId}-${sku}-${sessionId}`,
          resource_type: 'auto',
          quality: 'auto',
          format: 'jpg',
          tags: ['tryon-output', `user-${userId}`, `sku-${sku}`],
          overwrite: true,
        },
        (error, result) => {
          if (error) {
            reject(new Error(`Try-on output upload failed: ${error.message}`));
          } else {
            resolve({
              publicId: result!.public_id,
              url: result!.url,
              secureUrl: result!.secure_url,
            });
          }
        }
      );

      const readable = Readable.from(buffer);
      readable.pipe(stream);
    });
  }

  /**
   * Delete temporary image after processing
   */
  async deleteTempImage(publicId: string): Promise<void> {
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (error) {
      console.error(`Failed to delete temp image ${publicId}:`, error);
      // Don't throw - temp deletion is not critical
    }
  }

  /**
   * Get upload signature for client-side uploads
   */
  getUploadSignature(folder: string = CLOUDINARY_FOLDERS.USER_UPLOADS): {
    signature: string;
    timestamp: number;
    apiKey: string;
    cloudName: string;
    folder: string;
  } {
    const timestamp = Math.floor(Date.now() / 1000);
    const signature = cloudinary.utils.api_sign_request(
      {
        timestamp,
        folder,
        tags: 'user-upload',
      },
      process.env.CLOUDINARY_API_SECRET!
    );

    return {
      signature,
      timestamp,
      apiKey: process.env.CLOUDINARY_API_KEY!,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!,
      folder,
    };
  }
}

/**
 * Saree Asset Manager
 * Organizes and retrieves saree assets from Cloudinary
 */
export class SareeAssetManager {
  /**
   * Get all variants for a saree SKU
   */
  static async getVariants(sku: string): Promise<string[]> {
    // In production, query Cloudinary API for resources in SKU folder
    const resources = await cloudinary.api.resources({
      type: 'upload',
      prefix: `${CLOUDINARY_FOLDERS.SAREE_IMAGES}/${sku}`,
      max_results: 100,
    });

    return Array.from(new Set(
      resources.resources.map((r: any) => {
        const parts = r.public_id.split('/');
        return parts[parts.length - 2] || 'default';
      })
    ));
  }

  /**
   * Create folder structure for new saree
   * (Cloudinary auto-creates folders, but this documents structure)
   */
  static async initializeSareeStructure(sku: string): Promise<void> {
    const paths = CloudinaryPaths.getSareePaths(sku);
    console.log('Saree folder structure initialized for:', sku);
    console.log('Image folder:', paths.image.folder);
    console.log('Mask folder:', paths.mask.folder);
    console.log('Overlay folder:', paths.overlay.folder);
    
    // Cloudinary automatically creates folders on first upload
    // No explicit folder creation needed
  }

  /**
   * Validate saree assets exist and are accessible
   */
  static async validateSareeAssets(
    sku: string,
    variant: string = 'default'
  ): Promise<{
    hasImage: boolean;
    hasMask: boolean;
    hasOverlay: boolean;
    allPresent: boolean;
  }> {
    const paths = CloudinaryPaths.getSareePaths(sku, variant);

    const checks = await Promise.all([
      this.resourceExists(paths.image.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!)),
      this.resourceExists(paths.mask.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!)),
      this.resourceExists(paths.overlay.url(process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!)),
    ]);

    return {
      hasImage: checks[0],
      hasMask: checks[1],
      hasOverlay: checks[2],
      allPresent: checks.every(c => c),
    };
  }

  /**
   * Check if resource exists in Cloudinary
   */
  private static async resourceExists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Get signed URL for private assets
   */
  static getSignedAssetUrl(publicId: string, expiresIn: number = 3600): string {
    return cloudinary.url(publicId, {
      secure: true,
      sign_url: true,
      expires_at: Math.floor(Date.now() / 1000) + expiresIn,
    });
  }
}

/**
 * Batch folder structure setup for common SKUs
 */
export async function setupCloudinaryFolders(skus: string[]): Promise<void> {
  console.log('Setting up Cloudinary folder structure for:', skus);
  
  for (const sku of skus) {
    await SareeAssetManager.initializeSareeStructure(sku);
  }
  
  console.log('Folder structure setup complete');
}

export { cloudinary };
export default CloudinaryUploadManager;
