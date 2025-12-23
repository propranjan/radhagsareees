/**
 * Radha G Sarees - Cloudinary React Utilities
 * 
 * React hooks and components for using Cloudinary images
 */

import {
  getCloudinaryUrl,
  getVariantImageUrls,
  getVariantOverlayUrl,
  getCategoryImageUrl,
  imageTransformations,
} from './cloudinary';
import type { CloudinaryImageSet } from './types';

/**
 * Hook to get responsive image URLs for a variant
 */
export function useVariantImages(
  categorySlug: string,
  productSku: string,
  variantSku: string,
  cloudName?: string
) {
  const images = getVariantImageUrls(categorySlug, productSku, variantSku, { cloudName });
  const overlay = getVariantOverlayUrl(categorySlug, productSku, variantSku, { cloudName });

  return {
    // Original URLs
    images,
    overlay,
    
    // With transformations
    thumbnail: {
      front: addTransformation(images.front, imageTransformations.thumbnail),
      back: addTransformation(images.back, imageTransformations.thumbnail),
      closeup: addTransformation(images.closeup, imageTransformations.thumbnail),
    },
    card: {
      front: addTransformation(images.front, imageTransformations.card),
      back: addTransformation(images.back, imageTransformations.card),
      closeup: addTransformation(images.closeup, imageTransformations.card),
    },
    productPage: {
      front: addTransformation(images.front, imageTransformations.productPage),
      back: addTransformation(images.back, imageTransformations.productPage),
      closeup: addTransformation(images.closeup, imageTransformations.productPage),
    },
    fullSize: {
      front: addTransformation(images.front, imageTransformations.fullSize),
      back: addTransformation(images.back, imageTransformations.fullSize),
      closeup: addTransformation(images.closeup, imageTransformations.fullSize),
    },
    overlayForTryOn: addTransformation(overlay, imageTransformations.overlay),
  };
}

/**
 * Hook to get category banner image
 */
export function useCategoryImage(categorySlug: string, cloudName?: string) {
  const url = getCategoryImageUrl(categorySlug, { cloudName });
  
  return {
    original: url,
    banner: addTransformation(url, imageTransformations.categoryBanner),
    thumbnail: addTransformation(url, imageTransformations.thumbnail),
  };
}

/**
 * Add transformation to Cloudinary URL
 */
function addTransformation(url: string, transformation: string): string {
  // Insert transformation after /upload/
  return url.replace('/upload/', `/upload/${transformation}/`);
}

/**
 * Get srcset for responsive images
 */
export function getResponsiveSrcSet(
  baseUrl: string,
  widths: number[] = [400, 800, 1200, 1600]
): string {
  return widths
    .map((width) => {
      const transformedUrl = baseUrl.replace(
        '/upload/',
        `/upload/w_${width},c_fill,q_auto,f_auto/`
      );
      return `${transformedUrl} ${width}w`;
    })
    .join(', ');
}

/**
 * Get placeholder blur data URL (base64 tiny image)
 */
export function getBlurPlaceholder(url: string): string {
  return url.replace(
    '/upload/',
    '/upload/w_10,h_10,c_fill,q_10,e_blur:1000,f_auto/'
  );
}

/**
 * Image loader for Next.js Image component
 */
export function cloudinaryLoader({
  src,
  width,
  quality,
}: {
  src: string;
  width: number;
  quality?: number;
}): string {
  const q = quality || 75;
  
  // If it's already a Cloudinary URL
  if (src.includes('res.cloudinary.com')) {
    return src.replace(
      '/upload/',
      `/upload/w_${width},q_${q},f_auto/`
    );
  }
  
  // Otherwise, construct the URL
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'demo';
  return `https://res.cloudinary.com/${cloudName}/image/upload/w_${width},q_${q},f_auto/${src}`;
}

/**
 * Get all product images for a catalog product
 */
export function getProductImages(
  categorySlug: string,
  productSku: string,
  variants: Array<{ sku: string; color: string }>
): Array<{
  variantSku: string;
  color: string;
  images: CloudinaryImageSet;
  overlay: string;
}> {
  return variants.map((variant) => ({
    variantSku: variant.sku,
    color: variant.color,
    images: getVariantImageUrls(categorySlug, productSku, variant.sku),
    overlay: getVariantOverlayUrl(categorySlug, productSku, variant.sku),
  }));
}

/**
 * Next.js Image component props generator
 */
export function getNextImageProps(
  url: string,
  alt: string,
  size: 'thumbnail' | 'card' | 'productPage' | 'fullSize' = 'card'
) {
  const sizeConfigs = {
    thumbnail: { width: 150, height: 150 },
    card: { width: 400, height: 500 },
    productPage: { width: 800, height: 1000 },
    fullSize: { width: 1200, height: 1500 },
  };

  const { width, height } = sizeConfigs[size];
  const transformation = imageTransformations[size];

  return {
    src: url.replace('/upload/', `/upload/${transformation}/`),
    alt,
    width,
    height,
    placeholder: 'blur' as const,
    blurDataURL: getBlurPlaceholder(url),
    loader: cloudinaryLoader,
  };
}
