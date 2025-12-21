'use client';

import { useParams } from 'next/navigation';
import ProductForm from '../../../../components/ProductForm';

export default function EditProductPage() {
  const params = useParams();
  const id = params.id as string;
  
  if (!id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return <ProductForm productId={id} />;
}
