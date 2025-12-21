"use client";

import { ProductCard } from '@radhagsareees/ui';
import Link from 'next/link';
import { Filter, Grid, List, SlidersHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function CatalogPage() {
  const router = useRouter();
  const { addToCart, adding } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    const category = searchParams?.get('category') || '';
    setSelectedCategory(category);
    fetchProducts(category);
  }, [searchParams]);

  const fetchProducts = async (category?: string) => {
    try {
      setLoading(true);
      const url = category ? `/api/products?category=${category}` : '/api/products';
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setProducts(data.products || []);
      }
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (product: any) => {
    // Get the first variant of the product to add to cart
    const response = await fetch(`/api/products/${product.slug}`);
    if (response.ok) {
      const fullProduct = await response.json();
      if (fullProduct.variants && fullProduct.variants.length > 0) {
        const firstVariant = fullProduct.variants[0];
        const result = await addToCart(fullProduct.id, firstVariant.id, 1);
        
        if (result.success) {
          setShowSuccess(true);
          setTimeout(() => setShowSuccess(false), 3000);
        } else if (result.needsAuth) {
          router.push('/auth/login');
        }
      }
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

  const categoryTitle = selectedCategory 
    ? selectedCategory.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : 'All Sarees';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">{categoryTitle}</h1>
              <p className="text-gray-600 mt-2">
                {selectedCategory 
                  ? `Browse our collection of ${categoryTitle.toLowerCase()}` 
                  : 'Discover our complete range of beautiful sarees'}
              </p>
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
            {showSuccess && (
              <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
                <span className="text-green-600 font-medium">Added to cart successfully!</span>
                <Link href="/cart" className="text-green-600 hover:underline font-medium">
                  View Cart
                </Link>
              </div>
            )}

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
                <div key={product.id} onClick={(e) => {
                  // Only navigate if not clicking on buttons
                  if (!(e.target as HTMLElement).closest('button')) {
                    router.push(`/products/${product.slug}`);
                  }
                }} className="cursor-pointer">
                  <ProductCard 
                    product={product}
                    className="h-full"
                    onAddToCart={() => handleAddToCart(product)}
                    onToggleWishlist={() => console.log('Toggle wishlist:', product)}
                  />
                </div>
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