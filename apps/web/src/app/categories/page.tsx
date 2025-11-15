'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Package, ArrowRight } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/categories');
      if (response.ok) {
        const data = await response.json();
        setCategories(data.categories || []);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-12">
          <h1 className="text-4xl font-serif font-bold text-gray-900 text-center">
            Shop by Category
          </h1>
          <p className="text-gray-600 text-center mt-4 text-lg">
            Explore our curated collection of beautiful sarees
          </p>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="container mx-auto px-4 py-12">
        {categories.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No categories available</h3>
            <p className="text-gray-500">Categories will appear here once they are added.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/catalog?category=${category.slug}`}
                className="group bg-white rounded-lg shadow-sm hover:shadow-lg transition-shadow overflow-hidden"
              >
                <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center">
                  <Package className="w-16 h-16 text-primary-600 group-hover:scale-110 transition-transform" />
                </div>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                    {category.name}
                  </h3>
                  {category.description && (
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {category.description}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {category.productCount} {category.productCount === 1 ? 'product' : 'products'}
                    </span>
                    <div className="flex items-center text-primary-600 font-medium group-hover:gap-2 transition-all">
                      <span>Shop Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* CTA Section */}
      <div className="bg-primary-600 text-white py-12 mt-12">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-serif font-bold mb-4">
            Can't Find What You're Looking For?
          </h2>
          <p className="text-primary-100 mb-6 text-lg">
            Browse our complete catalog or contact us for personalized recommendations
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/catalog"
              className="bg-white text-primary-600 px-8 py-3 rounded-lg font-semibold hover:bg-primary-50 transition-colors"
            >
              View All Products
            </Link>
            <Link
              href="/contact"
              className="bg-primary-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-800 transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
