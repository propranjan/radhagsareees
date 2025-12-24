/**
 * Try-On Demo Page with Local Images
 * Demonstrates using local saree images instead of Cloudinary
 */

'use client';

import { useState } from 'react';
import { AISareeTryOn } from '@/components/AISareeTryOn';
import { getAllLocalSareeProducts } from '@/lib/local-saree-products';
import Image from 'next/image';

export default function TryOnDemoPage() {
  const [selectedSku, setSelectedSku] = useState('AH-4725976');
  const products = getAllLocalSareeProducts();
  const selectedProduct = products.find((p) => p.sku === selectedSku);

  if (!selectedProduct) {
    return <div>Product not found</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Saree Try-On Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Upload your photo and see how sarees look on you
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Product Selector Sidebar */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Available Sarees</h2>
            <div className="space-y-3">
              {products.map((product) => (
                <button
                  key={product.sku}
                  onClick={() => setSelectedSku(product.sku)}
                  className={`w-full p-3 text-left rounded-lg border-2 transition-all ${
                    selectedSku === product.sku
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex gap-2">
                    <div className="flex-shrink-0 w-12 h-12 relative">
                      <Image
                        src={product.image}
                        alt={product.name}
                        fill
                        className="object-cover rounded"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{product.name}</p>
                      <p className="text-xs text-gray-600">{product.color}</p>
                      <p className="text-sm text-green-600 font-bold">
                        ₹{product.price.toLocaleString()}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Try-On Component */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <AISareeTryOn
                product={selectedProduct}
                onSuccess={(result) => {
                  console.log('Try-on completed:', result);
                }}
              />
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              📸 Upload Your Photo
            </h3>
            <p className="text-blue-800 text-sm">
              Choose a clear front-facing photo for best try-on results
            </p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              ✨ Select Saree
            </h3>
            <p className="text-green-800 text-sm">
              Pick from our collection of beautiful sarees to try
            </p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-purple-900 mb-2">
              🎯 Get Results
            </h3>
            <p className="text-purple-800 text-sm">
              See how the saree looks and share with friends
            </p>
          </div>
        </div>

        {/* Local Images Notice */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-yellow-800 text-sm">
            <strong>Note:</strong> This demo uses local saree images from{' '}
            <code className="bg-yellow-100 px-2 py-1 rounded">
              C:\Users\2025\Pictures\Saree
            </code>{' '}
            for fast development and testing. Replace with Cloudinary images in production.
          </p>
        </div>
      </div>
    </div>
  );
}
