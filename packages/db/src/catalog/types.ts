/**
 * Radha G Sarees - Product Catalog Types
 * 
 * Type definitions for the complete saree product catalog
 * with Cloudinary integration support.
 */

export interface CloudinaryImageSet {
  front: string;
  back: string;
  closeup: string;
}

export interface CloudinaryOverlay {
  overlay: string;
}

export interface VariantData {
  sku: string;
  color: string;
  colorHex: string;
  mrp: number;
  price: number;
  stock: number;
  images: CloudinaryImageSet;
  overlayPng: string;
}

export interface ProductData {
  sku: string;
  title: string;
  slug: string;
  description: string;
  care: string;
  fabric: string;
  occasion: string[];
  features: string[];
  variants: VariantData[];
  isNew?: boolean;
  isFeatured?: boolean;
}

export interface CategoryData {
  name: string;
  slug: string;
  description: string;
  image: string;
  sortOrder: number;
  products: ProductData[];
}

export interface CatalogData {
  cloudName: string;
  baseUrl: string;
  categories: CategoryData[];
}

// Cloudinary folder structure types
export interface CloudinaryFolderStructure {
  root: string;
  categories: string;
  getCategoryPath: (categorySlug: string) => string;
  getProductPath: (categorySlug: string, productSku: string) => string;
  getVariantPath: (categorySlug: string, productSku: string, variantSku: string) => string;
  getImagePath: (categorySlug: string, productSku: string, variantSku: string, imageType: keyof CloudinaryImageSet) => string;
  getOverlayPath: (categorySlug: string, productSku: string, variantSku: string) => string;
}
