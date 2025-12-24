/**
 * Try-On Page
 * Demo page showcasing the try-on functionality with camera capture
 */

'use client';

import { useState } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import to avoid hydration issues
const ProductTryOn = dynamic(
  () => import('@/components/ProductTryOn').then(mod => ({ default: mod.ProductTryOn })),
  { ssr: false, loading: () => <div className="p-8 text-center">Loading try-on...</div> }
);

export default function TryOnPage() {
  const [selectedProduct, setSelectedProduct] = useState('SAR001');

  // Sample products
  const products: Record<string, any> = {
    SAR001: {
      sku: 'SAR001',
      name: 'Classic Silk Saree',
      price: 4999,
      image: 'https://images.unsplash.com/photo-1609051779562-40ef08632bc1?w=500&h=600',
      variants: [
        {
          id: 'red',
          name: 'Red',
          image: 'https://images.unsplash.com/photo-1609051779562-40ef08632bc1?w=500&h=600',
        },
        {
          id: 'blue',
          name: 'Blue',
          image: 'https://images.unsplash.com/photo-1624589467537-b625b62d4003?w=500&h=600',
        },
      ],
    },
    SAR002: {
      sku: 'SAR002',
      name: 'Designer Saree Collection',
      price: 7499,
      image: 'https://images.unsplash.com/photo-1624589467537-b625b62d4003?w=500&h=600',
      variants: [
        {
          id: 'gold',
          name: 'Gold',
          image: 'https://images.unsplash.com/photo-1624589467537-b625b62d4003?w=500&h=600',
        },
        {
          id: 'silver',
          name: 'Silver',
          image: 'https://images.unsplash.com/photo-1609051779562-40ef08632bc1?w=500&h=600',
        },
      ],
    },
  };

  const currentProduct = products[selectedProduct];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white py-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto px-4 mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Virtual Try-On</h1>
        <p className="text-gray-600">
          Upload your photo or use your camera to see how sarees look on you
        </p>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Product Selector */}
          <div className="lg:col-span-1">
            <h2 className="text-xl font-semibold mb-4">Select a Product</h2>
            <div className="space-y-3">
              {Object.entries(products).map(([key, product]) => (
                <button
                  key={key}
                  onClick={() => setSelectedProduct(key)}
                  className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                    selectedProduct === key
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <p className="font-semibold">{product.name}</p>
                  <p className="text-sm text-gray-600">₹{product.price}</p>
                </button>
              ))}
            </div>

            {/* Instructions */}
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
              <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                <li>Select a saree</li>
                <li>Click "Upload" or "Take a Photo"</li>
                <li>Allow camera access if needed</li>
                <li>Capture or upload image</li>
                <li>See the try-on result</li>
                <li>Share or download</li>
              </ol>
            </div>
          </div>

          {/* Try-On Component */}
          <div className="lg:col-span-3">
            {currentProduct && (
              <ProductTryOn
                productSku={currentProduct.sku}
                productName={currentProduct.name}
                productPrice={currentProduct.price}
                productImage={currentProduct.image}
                variants={currentProduct.variants}
                onSuccess={(result) => {
                  console.log('Try-on completed:', result);
                }}
              />
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 mt-16">
        <h2 className="text-2xl font-bold mb-8 text-center">Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">📸</div>
            <h3 className="font-semibold text-lg mb-2">Live Camera</h3>
            <p className="text-gray-600 text-sm">
              Capture photos directly from your device's camera with real-time preview
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">📁</div>
            <h3 className="font-semibold text-lg mb-2">File Upload</h3>
            <p className="text-gray-600 text-sm">
              Upload existing photos from your device or cloud storage
            </p>
          </div>
          <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="text-4xl mb-4">✨</div>
            <h3 className="font-semibold text-lg mb-2">AI Processing</h3>
            <p className="text-gray-600 text-sm">
              Advanced AI generates realistic try-on results instantly
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
