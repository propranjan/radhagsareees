/**
 * Radha G Sarees - Catalog Module
 * 
 * Complete product catalog with Cloudinary integration
 */

// Types
export type {
  CloudinaryImageSet,
  CloudinaryOverlay,
  VariantData,
  ProductData,
  CategoryData,
  CatalogData,
  CloudinaryFolderStructure,
} from './types';

// Cloudinary utilities
export {
  getCloudName,
  getBaseUrl,
  sanitizeForPath,
  createCloudinaryStructure,
  getCloudinaryUrl,
  getVariantImageUrls,
  getVariantOverlayUrl,
  getCategoryImageUrl,
  imageTransformations,
  generateProductSku,
  generateVariantSku,
  folderStructureDoc,
} from './cloudinary';

// Cloudinary React utilities
export {
  useVariantImages,
  useCategoryImage,
  getResponsiveSrcSet,
  getBlurPlaceholder,
  cloudinaryLoader,
  getProductImages,
  getNextImageProps,
} from './cloudinary-react';

// Product catalog data
export {
  productCatalog,
  catalogStats,
} from './product-catalog';

// Seed function
export { seedCatalog } from './seed-catalog';
