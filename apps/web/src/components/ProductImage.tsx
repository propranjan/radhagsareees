/**
 * ProductImage Component
 * 
 * A reusable component for displaying product images with automatic
 * Cloudinary optimization. Falls back gracefully for non-Cloudinary URLs.
 * 
 * Features:
 * - Automatic Cloudinary URL optimization (q_auto, f_auto)
 * - Responsive sizing with srcSet
 * - Loading skeleton
 * - Error fallback
 * - Alt text for accessibility
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface ProductImageProps {
  src: string | null | undefined;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  sizes?: string;
  className?: string;
  priority?: boolean;
  quality?: number;
}

/**
 * Check if URL is a Cloudinary URL
 */
const isCloudinaryUrl = (url: string): boolean => {
  return url.includes('res.cloudinary.com');
};

/**
 * Add Cloudinary optimization parameters to URL
 * 
 * @param url - Original Cloudinary URL
 * @param options - Optimization options
 * @returns Optimized URL
 */
const optimizeCloudinaryUrl = (
  url: string,
  options: { width?: number; quality?: number } = {}
): string => {
  if (!isCloudinaryUrl(url)) return url;

  try {
    // Parse the URL to insert transformations
    const urlParts = url.split('/upload/');
    if (urlParts.length !== 2) return url;

    const transformations: string[] = [];
    
    // Auto quality (balances quality and file size)
    transformations.push(options.quality ? `q_${options.quality}` : 'q_auto:good');
    
    // Auto format (serves WebP/AVIF where supported)
    transformations.push('f_auto');
    
    // Width for responsive images
    if (options.width) {
      transformations.push(`w_${options.width}`);
      transformations.push('c_limit'); // Don't upscale
    }

    const transformString = transformations.join(',');
    
    // Check if there are existing transformations
    const existingParts = urlParts[1].split('/');
    const hasTransform = existingParts[0].includes('_');
    
    if (hasTransform) {
      // Prepend our transformations
      return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
    } else {
      // Add transformations
      return `${urlParts[0]}/upload/${transformString}/${urlParts[1]}`;
    }
  } catch {
    return url;
  }
};

/**
 * ProductImage - Optimized image component for product photos
 */
export default function ProductImage({
  src,
  alt,
  width = 400,
  height = 400,
  fill = false,
  sizes = '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
  className = '',
  priority = false,
  quality = 80,
}: ProductImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // Handle missing or invalid src
  if (!src || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={fill ? { position: 'absolute', inset: 0 } : { width, height }}
      >
        <Package className="w-12 h-12 text-gray-400" />
      </div>
    );
  }

  // Optimize Cloudinary URLs
  const optimizedSrc = isCloudinaryUrl(src)
    ? optimizeCloudinaryUrl(src, { quality })
    : src;

  // Generate Cloudinary loader for responsive images
  const cloudinaryLoader = isCloudinaryUrl(src)
    ? ({ src: loaderSrc, width: w }: { src: string; width: number }) => {
        return optimizeCloudinaryUrl(loaderSrc, { width: w, quality });
      }
    : undefined;

  return (
    <div className={`relative overflow-hidden ${fill ? 'w-full h-full' : ''}`}>
      {/* Loading skeleton */}
      {isLoading && (
        <div
          className={`absolute inset-0 bg-gray-200 animate-pulse ${className}`}
        />
      )}
      
      <Image
        src={optimizedSrc}
        alt={alt}
        width={fill ? undefined : width}
        height={fill ? undefined : height}
        fill={fill}
        sizes={sizes}
        className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        priority={priority}
        quality={quality}
        loader={cloudinaryLoader}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
}

/**
 * Get optimized image URL without component
 * Useful for background images or other non-Image uses
 */
export function getOptimizedImageUrl(
  url: string,
  options: { width?: number; quality?: number } = {}
): string {
  if (!url) return '';
  return optimizeCloudinaryUrl(url, options);
}
