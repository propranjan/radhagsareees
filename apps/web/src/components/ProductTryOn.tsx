/**
 * Product Try-On Integration Component
 * Integrates AISareeTryOn component with product pages
 */

'use client';

import { AISareeTryOn } from './AISareeTryOn';

interface ProductTryOnProps {
  productSku: string;
  productName: string;
  productPrice: number;
  productImage: string;
  variants?: Array<{
    id: string;
    name: string;
    image: string;
  }>;
  userId?: string;
  onSuccess?: (result: any) => void;
}

/**
 * Product Try-On component that wraps AISareeTryOn
 * with product-specific data and styling
 */
export function ProductTryOn({
  productSku,
  productName,
  productPrice,
  productImage,
  variants = [],
  userId,
  onSuccess,
}: ProductTryOnProps) {
  return (
    <div className="w-full bg-white rounded-lg">
      <AISareeTryOn
        product={{
          sku: productSku,
          name: productName,
          price: productPrice,
          image: productImage,
          variants,
        }}
        userId={userId}
        onSuccess={onSuccess}
      />
    </div>
  );
}

export default ProductTryOn;
