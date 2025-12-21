'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Package } from 'lucide-react';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  productCount: number;
}

// Default fallback categories with placeholder images
const FALLBACK_CATEGORIES = [
  {
    id: '1',
    name: 'Silk Sarees',
    slug: 'silk-sarees',
    image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300&h=400&fit=crop',
    productCount: 0,
  },
  {
    id: '2',
    name: 'Cotton Sarees',
    slug: 'cotton-sarees',
    image: 'https://images.unsplash.com/photo-1594736797933-d0401ba0ad84?w=300&h=400&fit=crop',
    productCount: 0,
  },
  {
    id: '3',
    name: 'Designer Sarees',
    slug: 'designer-sarees',
    image: 'https://images.unsplash.com/photo-1605194125977-7976b2222708?w=300&h=400&fit=crop',
    productCount: 0,
  },
  {
    id: '4',
    name: 'Wedding Sarees',
    slug: 'wedding-sarees',
    image: 'https://images.unsplash.com/photo-1623177341583-0dc44942822c?w=300&h=400&fit=crop',
    productCount: 0,
  },
];

export default function FeaturedCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          // Take first 4 categories for featured section
          const featuredCategories = (data.categories || []).slice(0, 4);
          setCategories(featuredCategories.length > 0 ? featuredCategories : FALLBACK_CATEGORIES);
        } else {
          setCategories(FALLBACK_CATEGORIES);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
        setCategories(FALLBACK_CATEGORIES);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="aspect-[3/4] rounded-xl bg-gray-200"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
      {categories.map((category) => (
        <Link key={category.id} href={`/catalog?category=${category.slug}`} className="group">
          <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-100">
            {category.image ? (
              <img
                src={category.image}
                alt={category.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
                <Package className="w-16 h-16 text-primary-600" />
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
            <div className="absolute bottom-4 left-4 text-white">
              <h3 className="text-lg font-semibold">{category.name}</h3>
              {category.productCount > 0 && (
                <p className="text-sm text-white/80">{category.productCount} products</p>
              )}
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
