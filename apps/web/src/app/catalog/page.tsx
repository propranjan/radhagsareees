"use client";

import { ProductCard } from '@radhagsareees/ui';
import Link from 'next/link';
import { Filter, Grid, List, SlidersHorizontal, X, Star } from 'lucide-react';
import { useEffect, useState, Suspense, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useCart } from '@/hooks/useCart';
import Header from '@/components/Header';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

// Filter types
interface Category {
  id: string;
  name: string;
  slug: string;
  productCount: number;
}

interface PriceRange {
  label: string;
  min?: number;
  max?: number;
}

interface RatingFilter {
  label: string;
  value: number;
}

const PRICE_RANGES: PriceRange[] = [
  { label: 'Under ₹5,000', max: 5000 },
  { label: '₹5,000 - ₹10,000', min: 5000, max: 10000 },
  { label: '₹10,000 - ₹25,000', min: 10000, max: 25000 },
  { label: '₹25,000 - ₹50,000', min: 25000, max: 50000 },
  { label: 'Above ₹50,000', min: 50000 },
];

const RATING_FILTERS: RatingFilter[] = [
  { label: '4+ Stars', value: 4 },
  { label: '3+ Stars', value: 3 },
  { label: '2+ Stars', value: 2 },
];

const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-low' },
  { label: 'Price: High to Low', value: 'price-high' },
  { label: 'Customer Rating', value: 'rating' },
];

function CatalogContent() {
  const router = useRouter();
  const { addToCart, adding } = useCart();
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const searchParams = useSearchParams();

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedPriceRange, setSelectedPriceRange] = useState<PriceRange | null>(null);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Initialize filters from URL params
  useEffect(() => {
    const category = searchParams?.get('category');
    if (category) {
      setSelectedCategories([category]);
    }
  }, [searchParams]);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (response.ok) {
          const data = await response.json();
          setCategories(data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };
    fetchCategories();
  }, []);

  // Build query string from filters
  const buildQueryString = useCallback(() => {
    const params = new URLSearchParams();
    
    if (selectedCategories.length > 0) {
      params.set('categories', selectedCategories.join(','));
    }
    
    if (selectedPriceRange) {
      if (selectedPriceRange.min) params.set('minPrice', selectedPriceRange.min.toString());
      if (selectedPriceRange.max) params.set('maxPrice', selectedPriceRange.max.toString());
    }
    
    if (selectedRating) {
      params.set('minRating', selectedRating.toString());
    }
    
    if (sortBy && sortBy !== 'newest') {
      params.set('sortBy', sortBy);
    }
    
    return params.toString();
  }, [selectedCategories, selectedPriceRange, selectedRating, sortBy]);

  // Fetch products when filters change
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const queryString = buildQueryString();
        const url = `/api/products${queryString ? `?${queryString}` : ''}`;
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
    fetchProducts();
  }, [buildQueryString]);

  // Toggle category selection
  const toggleCategory = (slug: string) => {
    setSelectedCategories(prev => 
      prev.includes(slug) 
        ? prev.filter(c => c !== slug)
        : [...prev, slug]
    );
  };

  // Handle price range selection
  const handlePriceChange = (range: PriceRange) => {
    setSelectedPriceRange(prev => 
      prev?.label === range.label ? null : range
    );
  };

  // Handle rating selection
  const handleRatingChange = (rating: number) => {
    setSelectedRating(prev => prev === rating ? null : rating);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedPriceRange(null);
    setSelectedRating(null);
    setSortBy('newest');
  };

  // Check if any filters are active
  const hasActiveFilters = selectedCategories.length > 0 || selectedPriceRange || selectedRating;

  const handleAddToCart = async (product: any) => {
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

  // Get title based on selected categories
  const getPageTitle = () => {
    if (selectedCategories.length === 0) return 'All Sarees';
    if (selectedCategories.length === 1) {
      const cat = categories.find(c => c.slug === selectedCategories[0]);
      return cat?.name || 'Sarees';
    }
    return `${selectedCategories.length} Categories Selected`;
  };

  // Filter Sidebar Component
  const FilterSidebar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div className={`bg-white rounded-lg shadow-sm p-6 ${isMobile ? '' : ''}`}>
      {/* Mobile header */}
      {isMobile && (
        <div className="flex items-center justify-between mb-4 pb-4 border-b">
          <h2 className="text-lg font-semibold">Filters</h2>
          <button onClick={() => setShowMobileFilters(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="w-full mb-4 py-2 text-sm text-primary-600 hover:text-primary-700 border border-primary-600 rounded-lg"
        >
          Clear All Filters
        </button>
      )}

      {/* Categories */}
      <h3 className="font-semibold text-gray-900 mb-4">Categories</h3>
      <div className="space-y-2 mb-6">
        {categories.map((category) => (
          <label key={category.id} className="flex items-center cursor-pointer group">
            <input
              type="checkbox"
              checked={selectedCategories.includes(category.slug)}
              onChange={() => toggleCategory(category.slug)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-gray-700 group-hover:text-gray-900">
              {category.name}
            </span>
            <span className="ml-auto text-xs text-gray-400">
              ({category.productCount})
            </span>
          </label>
        ))}
      </div>

      {/* Price Range */}
      <h3 className="font-semibold text-gray-900 mb-4">Price Range</h3>
      <div className="space-y-2 mb-6">
        {PRICE_RANGES.map((range) => (
          <label key={range.label} className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name="priceRange"
              checked={selectedPriceRange?.label === range.label}
              onChange={() => handlePriceChange(range)}
              className="border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-gray-700 group-hover:text-gray-900">
              {range.label}
            </span>
          </label>
        ))}
      </div>

      {/* Rating */}
      <h3 className="font-semibold text-gray-900 mb-4">Rating</h3>
      <div className="space-y-2">
        {RATING_FILTERS.map((filter) => (
          <label key={filter.label} className="flex items-center cursor-pointer group">
            <input
              type="radio"
              name="rating"
              checked={selectedRating === filter.value}
              onChange={() => handleRatingChange(filter.value)}
              className="border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="ml-2 text-gray-700 group-hover:text-gray-900 flex items-center gap-1">
              {filter.label}
              <span className="flex">
                {[...Array(filter.value)].map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                ))}
              </span>
            </span>
          </label>
        ))}
      </div>

      {/* Mobile apply button */}
      {isMobile && (
        <button
          onClick={() => setShowMobileFilters(false)}
          className="w-full mt-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700"
        >
          Apply Filters ({products.length} products)
        </button>
      )}
    </div>
  );

  if (loading && products.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Mobile Filter Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowMobileFilters(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white overflow-y-auto">
            <FilterSidebar isMobile />
          </div>
        </div>
      )}
      
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-serif font-bold text-gray-900">{getPageTitle()}</h1>
              <p className="text-gray-600 mt-2">
                {selectedCategories.length === 0 
                  ? 'Discover our complete range of beautiful sarees' 
                  : `Browse our curated collection`}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {/* Mobile filter button */}
              <button 
                onClick={() => setShowMobileFilters(true)}
                className="lg:hidden flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <SlidersHorizontal className="w-4 h-4" />
                <span>Filters</span>
                {hasActiveFilters && (
                  <span className="bg-primary-600 text-white text-xs px-2 py-0.5 rounded-full">
                    {(selectedCategories.length > 0 ? 1 : 0) + (selectedPriceRange ? 1 : 0) + (selectedRating ? 1 : 0)}
                  </span>
                )}
              </button>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-50'}`}
                  aria-label="Grid view"
                  aria-pressed={viewMode === 'grid'}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 border-l border-gray-300 transition-colors ${viewMode === 'list' ? 'bg-primary-100 text-primary-600' : 'hover:bg-gray-50'}`}
                  aria-label="List view"
                  aria-pressed={viewMode === 'list'}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              {selectedCategories.map(slug => {
                const cat = categories.find(c => c.slug === slug);
                return (
                  <span key={slug} className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                    {cat?.name || slug}
                    <button onClick={() => toggleCategory(slug)} className="hover:text-primary-900">
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
              {selectedPriceRange && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {selectedPriceRange.label}
                  <button onClick={() => setSelectedPriceRange(null)} className="hover:text-primary-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedRating && (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-sm">
                  {selectedRating}+ Stars
                  <button onClick={() => setSelectedRating(null)} className="hover:text-primary-900">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              <button 
                onClick={clearAllFilters}
                className="text-sm text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Filters Sidebar - Desktop */}
          <div className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-4">
              <FilterSidebar />
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
              <p className="text-gray-600">
                {loading ? 'Loading...' : `Showing ${products.length} products`}
              </p>
              <select 
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-primary-500 focus:border-primary-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            {loading && (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            )}

            {!loading && products.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">No products found matching your filters.</p>
                <button 
                  onClick={clearAllFilters}
                  className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
                >
                  Clear all filters
                </button>
              </div>
            )}

            {!loading && products.length > 0 && (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
                : "flex flex-col gap-4"
              }>
                {products.map((product) => (
                  <div 
                    key={product.id} 
                    onClick={(e) => {
                      if (!(e.target as HTMLElement).closest('button')) {
                        router.push(`/product/${product.slug}`);
                      }
                    }} 
                    className={`cursor-pointer ${viewMode === 'list' ? 'bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden' : ''}`}
                  >
                    {viewMode === 'grid' ? (
                      <ProductCard 
                        product={product}
                        className="h-full"
                        onAddToCart={() => handleAddToCart(product)}
                        onToggleWishlist={() => console.log('Toggle wishlist:', product)}
                      />
                    ) : (
                      <div className="flex flex-col sm:flex-row gap-4 p-4">
                        <div className="sm:w-48 h-48 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                          <img 
                            src={product.image} 
                            alt={product.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <p className="text-sm text-primary-600 font-medium">{product.category}</p>
                                <h3 className="text-lg font-semibold text-gray-900 mt-1">{product.name}</h3>
                              </div>
                              {product.isNew && (
                                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">New</span>
                              )}
                            </div>
                            <p className="text-gray-600 text-sm mt-2 line-clamp-2">{product.description || 'Beautiful handcrafted saree with exquisite design and premium quality fabric.'}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <div className="flex items-center text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <span className="text-gray-700 text-sm ml-1">{product.rating?.toFixed(1) || '4.5'}</span>
                              </div>
                              <span className="text-gray-400 text-sm">({product.reviewCount || 0} reviews)</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4">
                            <div className="flex items-center gap-2">
                              <span className="text-xl font-bold text-gray-900">₹{product.price?.toLocaleString()}</span>
                              {product.originalPrice && product.originalPrice > product.price && (
                                <span className="text-gray-400 line-through text-sm">₹{product.originalPrice?.toLocaleString()}</span>
                              )}
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAddToCart(product);
                              }}
                              className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                            >
                              Add to Cart
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    }>
      <CatalogContent />
    </Suspense>
  );
}