/**
 * Radha G Sarees - Cloudinary Utilities
 * 
 * Utility functions for generating predictable Cloudinary folder paths
 * and URLs for product images. NO API secrets are included.
 */

import type { CloudinaryImageSet, CloudinaryFolderStructure } from './types';

// Default cloud name - set to actual cloud name for production
const DEFAULT_CLOUD_NAME = 'dmkm5eqtk';

/**
 * Get Cloudinary cloud name from environment or use default
 */
export function getCloudName(): string {
  return process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 
         process.env.CLOUDINARY_CLOUD_NAME || 
         DEFAULT_CLOUD_NAME;
}

/**
 * Generate the base Cloudinary URL
 */
export function getBaseUrl(cloudName?: string): string {
  const cloud = cloudName || getCloudName();
  return `https://res.cloudinary.com/${cloud}/image/upload`;
}

/**
 * Sanitize string for use in Cloudinary paths
 * - Converts to lowercase
 * - Replaces spaces with hyphens
 * - Removes special characters
 */
export function sanitizeForPath(str: string): string {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Create Cloudinary folder structure utilities
 */
export function createCloudinaryStructure(cloudName?: string): CloudinaryFolderStructure {
  const cloud = cloudName || getCloudName();
  const root = 'radhag-sarees';
  const categories = `${root}/categories`;
  
  return {
    root,
    categories,
    
    getCategoryPath: (categorySlug: string) => {
      return `${categories}/${sanitizeForPath(categorySlug)}`;
    },
    
    getProductPath: (categorySlug: string, productSku: string) => {
      return `${categories}/${sanitizeForPath(categorySlug)}/products/${sanitizeForPath(productSku)}`;
    },
    
    getVariantPath: (categorySlug: string, productSku: string, variantSku: string) => {
      return `${categories}/${sanitizeForPath(categorySlug)}/products/${sanitizeForPath(productSku)}/variants/${sanitizeForPath(variantSku)}`;
    },
    
    getImagePath: (categorySlug: string, productSku: string, variantSku: string, imageType: keyof CloudinaryImageSet) => {
      const variantPath = `${categories}/${sanitizeForPath(categorySlug)}/products/${sanitizeForPath(productSku)}/variants/${sanitizeForPath(variantSku)}`;
      return `${variantPath}/images/${imageType}.jpg`;
    },
    
    getOverlayPath: (categorySlug: string, productSku: string, variantSku: string) => {
      const variantPath = `${categories}/${sanitizeForPath(categorySlug)}/products/${sanitizeForPath(productSku)}/variants/${sanitizeForPath(variantSku)}`;
      return `${variantPath}/overlay/overlay.png`;
    }
  };
}

/**
 * Generate full Cloudinary URL for an image
 */
export function getCloudinaryUrl(
  path: string,
  options?: {
    cloudName?: string;
    transformations?: string;
  }
): string {
  const baseUrl = getBaseUrl(options?.cloudName);
  const transforms = options?.transformations ? `${options.transformations}/` : '';
  return `${baseUrl}/${transforms}${path}`;
}

/**
 * Generate image set URLs for a variant
 */
export function getVariantImageUrls(
  categorySlug: string,
  productSku: string,
  variantSku: string,
  options?: {
    cloudName?: string;
    transformations?: string;
  }
): CloudinaryImageSet {
  const structure = createCloudinaryStructure(options?.cloudName);
  
  return {
    front: getCloudinaryUrl(
      structure.getImagePath(categorySlug, productSku, variantSku, 'front'),
      options
    ),
    back: getCloudinaryUrl(
      structure.getImagePath(categorySlug, productSku, variantSku, 'back'),
      options
    ),
    closeup: getCloudinaryUrl(
      structure.getImagePath(categorySlug, productSku, variantSku, 'closeup'),
      options
    )
  };
}

/**
 * Generate overlay URL for a variant
 */
export function getVariantOverlayUrl(
  categorySlug: string,
  productSku: string,
  variantSku: string,
  options?: {
    cloudName?: string;
    transformations?: string;
  }
): string {
  const structure = createCloudinaryStructure(options?.cloudName);
  return getCloudinaryUrl(
    structure.getOverlayPath(categorySlug, productSku, variantSku),
    options
  );
}

/**
 * Generate category image URL
 */
export function getCategoryImageUrl(
  categorySlug: string,
  options?: {
    cloudName?: string;
    transformations?: string;
  }
): string {
  const structure = createCloudinaryStructure(options?.cloudName);
  return getCloudinaryUrl(
    `${structure.getCategoryPath(categorySlug)}/category-banner.jpg`,
    options
  );
}

/**
 * Responsive image transformations preset
 */
export const imageTransformations = {
  thumbnail: 'w_150,h_150,c_fill,q_auto,f_auto',
  card: 'w_400,h_500,c_fill,q_auto,f_auto',
  productPage: 'w_800,h_1000,c_fill,q_auto,f_auto',
  fullSize: 'w_1200,h_1500,c_fill,q_auto,f_auto',
  overlay: 'w_600,h_800,c_fit,q_auto,f_png',
  categoryBanner: 'w_1200,h_400,c_fill,q_auto,f_auto',
};

/**
 * Generate SKU for a product
 */
export function generateProductSku(categorySlug: string, index: number): string {
  const prefix = categorySlug.substring(0, 3).toUpperCase();
  return `${prefix}-${String(index).padStart(3, '0')}`;
}

/**
 * Generate SKU for a variant
 */
export function generateVariantSku(productSku: string, colorCode: string): string {
  return `${productSku}-${colorCode.toUpperCase()}`;
}

/**
 * Export folder structure documentation for reference
 */
export const folderStructureDoc = `
Cloudinary Folder Structure for Radha G Sarees:
================================================

radhag-sarees/
├── categories/
│   ├── banarasi/
│   │   ├── category-banner.jpg
│   │   └── products/
│   │       ├── BAN-001/
│   │       │   └── variants/
│   │       │       ├── BAN-001-RED/
│   │       │       │   ├── images/
│   │       │       │   │   ├── front.jpg
│   │       │       │   │   ├── back.jpg
│   │       │       │   │   └── closeup.jpg
│   │       │       │   └── overlay/
│   │       │       │       └── overlay.png
│   │       │       ├── BAN-001-BLUE/
│   │       │       │   └── ...
│   │       │       └── BAN-001-GREEN/
│   │       │           └── ...
│   │       ├── BAN-002/
│   │       │   └── ...
│   │       └── ...
│   ├── organza/
│   │   └── ...
│   ├── georgette/
│   │   └── ...
│   └── ... (other categories)

Image Naming Convention:
- front.jpg: Main front view of the saree
- back.jpg: Back/pallu view of the saree  
- closeup.jpg: Closeup of fabric/work detail
- overlay.png: Transparent PNG for virtual try-on

URL Pattern:
https://res.cloudinary.com/{cloud}/image/upload/radhag-sarees/categories/{category}/products/{product-sku}/variants/{variant-sku}/images/{image-type}.jpg
`;
