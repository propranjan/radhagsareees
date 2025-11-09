"use client";

import { ProductCard } from '@radhagsareees/ui';
import Link from 'next/link';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';

export default function CatalogPage() {
  // Mock products data - in real app, this would come from API/database
  const products = [
    {
      id: '1',
      name: 'Royal Red Silk Saree',
      price: 12999,
      originalPrice: 15999,
      image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
      rating: 4.8,
      reviewCount: 24,
      category: 'Silk Sarees',
      isNew: true,
      isSale: true,
    },
    {
      id: '2',
      name: 'Elegant Blue Cotton Saree',
      price: 2999,
      originalPrice: 3999,
      image: 'https://images.unsplash.com/photo-1594736797933-d0401ba0ad84?w=500',
      rating: 4.2,
      reviewCount: 18,
      category: 'Cotton Sarees',
      isNew: false,
      isSale: true,
    },
    // Add more mock products...
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">Saree Collection</h1>
              <p className="text-gray-600 mt-2">Discover our complete range of beautiful sarees</p>
            </div>
            <div className="flex items-center space-x-4">
              <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
              </button>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button className="p-2 hover:bg-gray-50">
                  <Grid className="w-4 h-4" />
                </button>
                <button className="p-2 hover:bg-gray-50 border-l border-gray-300">
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar */}
          <div className="w-64 flex-shrink-0">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
              <div className="space-y-2">
                {['All Sarees', 'Silk Sarees', 'Cotton Sarees', 'Designer Sarees', 'Wedding Sarees'].map((category) => (
                  <label key={category} className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-primary-600" />
                    <span className="ml-2 text-gray-700">{category}</span>
                  </label>
                ))}
              </div>

              <h3 className="font-semibold text-gray-900 mb-4 mt-6">Price Range</h3>
              <div className="space-y-2">
                {['Under ₹2,000', '₹2,000 - ₹5,000', '₹5,000 - ₹10,000', 'Above ₹10,000'].map((range) => (
                  <label key={range} className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-primary-600" />
                    <span className="ml-2 text-gray-700">{range}</span>
                  </label>
                ))}
              </div>

              <h3 className="font-semibold text-gray-900 mb-4 mt-6">Rating</h3>
              <div className="space-y-2">
                {['4+ Stars', '3+ Stars', '2+ Stars'].map((rating) => (
                  <label key={rating} className="flex items-center">
                    <input type="checkbox" className="rounded border-gray-300 text-primary-600" />
                    <span className="ml-2 text-gray-700">{rating}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Products Grid */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <p className="text-gray-600">Showing {products.length} products</p>
              <select className="border border-gray-300 rounded-lg px-3 py-2">
                <option>Sort by: Featured</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
                <option>Newest First</option>
                <option>Customer Rating</option>
              </select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Link key={product.id} href={`/product/${product.id}`}>
                  <ProductCard 
                    product={product}
                    className="h-full"
                    onAddToCart={(product: any) => console.log('Add to cart:', product)}
                    onToggleWishlist={(product: any) => console.log('Toggle wishlist:', product)}
                  />
                </Link>
              ))}
            </div>

            {/* Load More */}
            <div className="text-center mt-12">
              <button className="bg-primary-600 hover:bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold transition-colors">
                Load More Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}