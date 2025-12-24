/**
 * Local Image Service
 * Serves saree images from local file system instead of Cloudinary
 * Maps local image files to product SKUs
 */

export const LOCAL_SAREE_IMAGES = {
  // Map SKU to local image filename
  'AH-4725976': 'ah4725976_c.jpg',
  'BS-3278237': 'bs3278237_pp.webp',
  'HB-2106880': 'hb2106880_pp.webp',
  'NF-2833493': 'nf2833493_pp.jpg',
  'NS-4524562': 'ns4524562_pp.webp',
};

/**
 * Generate local image URL for a saree by SKU
 */
export function getLocalSareeImageUrl(sku: string, filename?: string): string {
  const imageFilename = filename || LOCAL_SAREE_IMAGES[sku as keyof typeof LOCAL_SAREE_IMAGES];
  
  if (!imageFilename) {
    // Fallback to placeholder if image not found
    return '/images/placeholder-saree.jpg';
  }

  return `/api/images/saree/${imageFilename}`;
}

/**
 * Check if a SKU has a local image available
 */
export function hasLocalImage(sku: string): boolean {
  return sku in LOCAL_SAREE_IMAGES;
}

/**
 * Get all available local saree images
 */
export function getAllLocalImages(): Record<string, string> {
  return { ...LOCAL_SAREE_IMAGES };
}
