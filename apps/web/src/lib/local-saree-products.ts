/**
 * Local Saree Product Database
 * Maps SKUs to local image files for development/demo
 */

import { getLocalSareeImageUrl } from './services/local-images.service';

export interface LocalSareeProduct {
  sku: string;
  name: string;
  price: number;
  description: string;
  color: string;
  image: string; // Local image URL
  variants: Array<{
    id: string;
    name: string;
    color: string;
    price: number;
    image: string;
  }>;
}

/**
 * Local saree products with images from C:\Users\2025\Pictures\Saree
 */
export const LOCAL_SAREE_PRODUCTS: Record<string, LocalSareeProduct> = {
  'AH-4725976': {
    sku: 'AH-4725976',
    name: 'Elegant Silk Saree',
    price: 4500,
    description: 'Beautiful handwoven silk saree with traditional patterns',
    color: 'Maroon',
    image: getLocalSareeImageUrl('AH-4725976'),
    variants: [
      {
        id: 'default',
        name: 'Classic',
        color: 'Maroon',
        price: 4500,
        image: getLocalSareeImageUrl('AH-4725976'),
      },
    ],
  },
  'BS-3278237': {
    sku: 'BS-3278237',
    name: 'Premium Cotton Saree',
    price: 3200,
    description: 'Lightweight cotton saree perfect for daily wear',
    color: 'Navy Blue',
    image: getLocalSareeImageUrl('BS-3278237'),
    variants: [
      {
        id: 'default',
        name: 'Classic',
        color: 'Navy Blue',
        price: 3200,
        image: getLocalSareeImageUrl('BS-3278237'),
      },
    ],
  },
  'HB-2106880': {
    sku: 'HB-2106880',
    name: 'Designer Saree Collection',
    price: 6800,
    description: 'Exclusive designer saree with intricate embroidery',
    color: 'Gold',
    image: getLocalSareeImageUrl('HB-2106880'),
    variants: [
      {
        id: 'default',
        name: 'Signature',
        color: 'Gold',
        price: 6800,
        image: getLocalSareeImageUrl('HB-2106880'),
      },
    ],
  },
  'NF-2833493': {
    sku: 'NF-2833493',
    name: 'Festive Silk Saree',
    price: 5200,
    description: 'Luxurious silk saree for special occasions',
    color: 'Red',
    image: getLocalSareeImageUrl('NF-2833493'),
    variants: [
      {
        id: 'default',
        name: 'Premium',
        color: 'Red',
        price: 5200,
        image: getLocalSareeImageUrl('NF-2833493'),
      },
    ],
  },
  'NS-4524562': {
    sku: 'NS-4524562',
    name: 'Ethnic Printed Saree',
    price: 2800,
    description: 'Traditional printed saree with ethnic motifs',
    color: 'Green',
    image: getLocalSareeImageUrl('NS-4524562'),
    variants: [
      {
        id: 'default',
        name: 'Traditional',
        color: 'Green',
        price: 2800,
        image: getLocalSareeImageUrl('NS-4524562'),
      },
    ],
  },
};

/**
 * Get a local saree product by SKU
 */
export function getLocalSareeProduct(sku: string): LocalSareeProduct | undefined {
  return LOCAL_SAREE_PRODUCTS[sku];
}

/**
 * Get all local saree products
 */
export function getAllLocalSareeProducts(): LocalSareeProduct[] {
  return Object.values(LOCAL_SAREE_PRODUCTS);
}

/**
 * Search local saree products by name or color
 */
export function searchLocalSareeProducts(query: string): LocalSareeProduct[] {
  const lowerQuery = query.toLowerCase();
  return Object.values(LOCAL_SAREE_PRODUCTS).filter(
    (product) =>
      product.name.toLowerCase().includes(lowerQuery) ||
      product.color.toLowerCase().includes(lowerQuery) ||
      product.description.toLowerCase().includes(lowerQuery)
  );
}
