'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Heart, ArrowLeft, Check } from 'lucide-react';
import Header from '@/components/Header';
import Image from 'next/image';
import { useCart } from '@/hooks/useCart';

interface Product {
  id: string;
  title: string;
  description: string;
  images: string[];
  variants: Array<{
    id: string;
    sku: string;
    color: string;
    size: string;
    price: number;
    mrp: number;
  }>;
}

export default function ProductPage({ params }: { params: { slug: string } }) {
  const router = useRouter();
  const { addToCart, adding } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/products/${params.slug}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      }
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!product || !product.variants[selectedVariant]) return;

    const result = await addToCart(
      product.id,
      product.variants[selectedVariant].id,
      quantity
    );

    if (result.success) {
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } else if (result.needsAuth) {
      router.push('/auth/login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Product not found</h1>
          <Link href="/catalog" className="text-primary-600 hover:underline mt-4 inline-block">
            Back to Catalog
          </Link>
        </div>
      </div>
    );
  }

  const variant = product.variants[selectedVariant];
  const discount = variant ? Math.round(((Number(variant.mrp) - Number(variant.price)) / Number(variant.mrp)) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <Link
          href="/catalog"
          className="inline-flex items-center text-gray-600 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Catalog
        </Link>

        {showSuccess && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
            <Check className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-600 font-medium">Added to cart successfully!</span>
            <Link href="/cart" className="ml-auto text-green-600 hover:underline font-medium">
              View Cart
            </Link>
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square bg-white rounded-lg overflow-hidden">
              {product.images[0] ? (
                <Image
                  src={product.images[0]}
                  alt={product.title}
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  No Image Available
                </div>
              )}
            </div>
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              <p className="text-gray-600">{product.description}</p>
            </div>

            {/* Price */}
            {variant && (
              <div className="flex items-baseline space-x-3">
                <span className="text-3xl font-bold text-gray-900">
                  ₹{Number(variant.price).toFixed(2)}
                </span>
                {Number(variant.mrp) > Number(variant.price) && (
                  <>
                    <span className="text-xl text-gray-500 line-through">
                      ₹{Number(variant.mrp).toFixed(2)}
                    </span>
                    <span className="text-green-600 font-semibold">
                      {discount}% OFF
                    </span>
                  </>
                )}
              </div>
            )}

            {/* Variant Selection */}
            {product.variants.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Variant
                </label>
                <div className="grid grid-cols-2 gap-3">
                  {product.variants.map((v, index) => (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(index)}
                      className={`p-3 border-2 rounded-lg text-left transition-colors ${
                        selectedVariant === index
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="font-medium text-gray-900">{v.color}</div>
                      <div className="text-sm text-gray-600">{v.size}</div>
                      <div className="text-sm font-semibold text-gray-900 mt-1">
                        ₹{Number(v.price).toFixed(2)}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  -
                </button>
                <span className="w-16 text-center font-medium text-lg">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50"
                >
                  +
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold flex items-center justify-center space-x-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>{adding ? 'Adding...' : 'Add to Cart'}</span>
              </button>
              <button className="p-3 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Heart className="w-6 h-6 text-gray-600" />
              </button>
            </div>

            {/* Additional Info */}
            <div className="border-t pt-6 space-y-2 text-sm text-gray-600">
              <p>✓ Free shipping on orders above ₹2999</p>
              <p>✓ Easy 7-day returns</p>
              <p>✓ 100% Authentic Products</p>
              {variant && <p>✓ SKU: {variant.sku}</p>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
