"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import { Star, ShoppingCart, Heart, Share2, Truck } from "lucide-react";
import dynamic from "next/dynamic";
import { ProductReviews } from "../../../components/ProductReviews";
import { ClientTryOnButton } from "../../../components/feature-flags/TryOnButton";
import { analytics } from "../../../lib/analytics";
import { createClient } from '@supabase/supabase-js';

// Dynamically import heavy components to improve initial load time
const TryOnCanvas = dynamic(
  () => import("@radhagsareees/ui").then(mod => ({ default: mod.TryOnCanvas })),
  { ssr: false }
);

const TryOnModal = dynamic(
  () => import("../../../components/TryOnModal").then(mod => ({ default: mod.TryOnModal })),
  { ssr: false }
);

// AI Try-On with camera capture
const AISareeTryOn = dynamic(
  () => import("../../../components/AISareeTryOn"),
  { ssr: false, loading: () => <div className="w-full h-96 bg-gray-100 rounded-lg animate-pulse" /> }
);

// Initialize Supabase client
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

interface Variant {
  id: string;
  sku: string;
  color: string;
  size: string;
  mrp: number;
  price: number;
  overlayPng?: string; // Try-on overlay image URL
  inventory: {
    qtyAvailable: number;
    lowStockThreshold: number;
  };
}

interface Product {
  id: string;
  sku: string; // Base product SKU
  title: string;
  slug: string;
  description: string;
  care: string;
  images: string[];
  categoryId: string;
  category: {
    id: string;
    name: string;
    slug: string;
  };
  isActive: boolean;
  isNew: boolean;
  isFeatured: boolean;
  variants: Variant[];
  averageRating?: number;
  totalReviews?: number;
  createdAt: string;
  updatedAt: string;
}

interface ProductPageProps {
  params: { slug: string };
}

export default function ProductPage({ params }: ProductPageProps) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<Variant | null>(null);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isTryOnModalOpen, setIsTryOnModalOpen] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [userToken, setUserToken] = useState<string | undefined>(undefined);
  const [isAICameraModalOpen, setIsAICameraModalOpen] = useState(false);

  // Get user session for reviews
  useEffect(() => {
    const checkAuth = async () => {
      const supabase = getSupabaseClient();
      if (!supabase) return;
      
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.access_token) {
        setUserToken(session.access_token);
      }
    };
    checkAuth();
  }, []);

  useEffect(() => {
    fetchProduct();
  }, [params.slug]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products/${params.slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          notFound();
        }
        throw new Error("Failed to fetch product");
      }

      const productData = await response.json();
      setProduct(productData);
      
      // Set default variant (first available variant)
      if (productData.variants && productData.variants.length > 0) {
        const firstAvailableVariant = productData.variants.find(
          (v: Variant) => v.inventory.qtyAvailable > 0
        ) || productData.variants[0];
        setSelectedVariant(firstAvailableVariant);
      }
    } catch (error) {
      console.error("Error fetching product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async () => {
    if (!selectedVariant) return;

    try {
      // Get the current session token
      const supabase = getSupabaseClient();
      let headers: HeadersInit = {
        "Content-Type": "application/json",
      };

      if (supabase) {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.access_token) {
          headers["Authorization"] = `Bearer ${session.access_token}`;
        }
      }

      const response = await fetch("/api/cart", {
        method: "POST",
        headers,
        body: JSON.stringify({
          variantId: selectedVariant.id,
          quantity: quantity,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Track add to cart event
        analytics.track("add_to_cart", {
          product_id: product?.id,
          product_name: product?.title,
          variant_id: selectedVariant.id,
          quantity: quantity,
          price: selectedVariant.price,
          category: product?.category.name,
        });

        // Trigger cart update event for header
        window.dispatchEvent(new CustomEvent('cartUpdated'));

        alert("Added to cart successfully!");
      } else if (response.status === 401 || data.needsAuth) {
        // Redirect to login if not authenticated
        window.location.href = '/auth/login?redirect=' + encodeURIComponent(window.location.pathname);
      } else {
        throw new Error(data.error || "Failed to add to cart");
      }
    } catch (error) {
      console.error("Error adding to cart:", error);
      alert("Failed to add to cart. Please try again.");
    }
  };

  const handleTryOn = () => {
    if (!selectedVariant?.overlayPng) {
      alert("Try-on not available for this variant");
      return;
    }

    // Track try-on opened event
    analytics.track("tryon_opened", {
      product_id: product?.id,
      product_name: product?.title,
      variant_id: selectedVariant.id,
      variant_color: selectedVariant.color,
      variant_size: selectedVariant.size,
    });

    setIsTryOnModalOpen(true);
  };

  const handleTryOnToCart = () => {
    // Track try-on to cart event
    analytics.track("tryon_to_cart", {
      product_id: product?.id,
      product_name: product?.title,
      variant_id: selectedVariant?.id,
      quantity: quantity,
      price: selectedVariant?.price,
    });

    handleAddToCart();
    setIsTryOnModalOpen(false);
  };

  const handleWishlistToggle = async () => {
    if (!product) return;

    try {
      const response = await fetch("/api/wishlist", {
        method: isWishlisted ? "DELETE" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productId: product.id,
        }),
      });

      if (response.ok) {
        setIsWishlisted(!isWishlisted);
        analytics.track(isWishlisted ? "remove_from_wishlist" : "add_to_wishlist", {
          product_id: product.id,
          product_name: product.title,
        });
      }
    } catch (error) {
      console.error("Error updating wishlist:", error);
    }
  };

  const getDiscountPercentage = () => {
    if (!selectedVariant) return 0;
    return Math.round(((selectedVariant.mrp - selectedVariant.price) / selectedVariant.mrp) * 100);
  };

  const isInStock = selectedVariant?.inventory?.qtyAvailable ? selectedVariant.inventory.qtyAvailable > 0 : false;
  const isLowStock = selectedVariant?.inventory?.qtyAvailable && selectedVariant?.inventory?.lowStockThreshold 
    ? selectedVariant.inventory.qtyAvailable <= selectedVariant.inventory.lowStockThreshold 
    : false;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading product...</div>
      </div>
    );
  }

  if (!product) {
    return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            {/* Main Image */}
            <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
              <Image
                src={product.images[selectedImageIndex] || "/placeholder-product.jpg"}
                alt={product.title}
                width={600}
                height={600}
                className="w-full h-full object-cover"
                priority
              />
            </div>

            {/* Thumbnail Images */}
            {product.images.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 ${
                      selectedImageIndex === index
                        ? "border-blue-500"
                        : "border-gray-200"
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${product.title} ${index + 1}`}
                      width={100}
                      height={100}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Header */}
            <div>
              <nav className="text-sm text-gray-500 mb-2">
                <span>Home</span> / <span>{product.category.name}</span> / <span className="text-gray-900">{product.title}</span>
              </nav>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.title}</h1>
              
              {/* Rating */}
              {product.averageRating && (
                <div className="flex items-center gap-2 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`h-4 w-4 ${
                          star <= (product.averageRating || 0)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {product.averageRating.toFixed(1)} ({product.totalReviews} reviews)
                  </span>
                </div>
              )}

              {/* Badges */}
              <div className="flex gap-2 mb-4">
                {product.isNew && (
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded">
                    New
                  </span>
                )}
                {product.isFeatured && (
                  <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded">
                    Featured
                  </span>
                )}
              </div>
            </div>

            {/* Price */}
            {selectedVariant && (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-3xl font-bold text-gray-900">
                    ₹{selectedVariant.price.toLocaleString()}
                  </span>
                  {selectedVariant.mrp > selectedVariant.price && (
                    <>
                      <span className="text-xl text-gray-500 line-through">
                        ₹{selectedVariant.mrp.toLocaleString()}
                      </span>
                      <span className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded">
                        {getDiscountPercentage()}% OFF
                      </span>
                    </>
                  )}
                </div>
                <p className="text-sm text-gray-600">Inclusive of all taxes</p>
              </div>
            )}

            {/* Variant Selection */}
            {product.variants.length > 1 && (
              <div className="space-y-4">
                {/* Color Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Color: {selectedVariant?.color}
                  </h3>
                  <div className="flex gap-2">
                    {[...new Set(product.variants.map(v => v.color))].map((color) => {
                      const colorVariant = product.variants.find(v => v.color === color);
                      return (
                        <button
                          key={color}
                          onClick={() => {
                            const newVariant = product.variants.find(v => 
                              v.color === color && 
                              v.size === selectedVariant?.size
                            ) || product.variants.find(v => v.color === color);
                            if (newVariant) setSelectedVariant(newVariant);
                          }}
                          className={`w-8 h-8 rounded-full border-2 ${
                            selectedVariant?.color === color
                              ? "border-gray-900"
                              : "border-gray-300"
                          }`}
                          style={{ backgroundColor: color.toLowerCase() }}
                          title={color}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Size Selection */}
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">
                    Size: {selectedVariant?.size}
                  </h3>
                  <div className="flex gap-2">
                    {[...new Set(product.variants
                      .filter(v => v.color === selectedVariant?.color)
                      .map(v => v.size)
                    )].map((size) => {
                      const sizeVariant = product.variants.find(v => 
                        v.color === selectedVariant?.color && v.size === size
                      );
                      const available = sizeVariant?.inventory?.qtyAvailable ? sizeVariant.inventory.qtyAvailable > 0 : false;
                      
                      return (
                        <button
                          key={size}
                          onClick={() => {
                            if (sizeVariant && available) {
                              setSelectedVariant(sizeVariant);
                            }
                          }}
                          disabled={!available}
                          className={`px-4 py-2 border rounded-md text-sm font-medium ${
                            selectedVariant?.size === size
                              ? "border-gray-900 bg-gray-900 text-white"
                              : available
                              ? "border-gray-300 text-gray-900 hover:border-gray-400"
                              : "border-gray-200 text-gray-400 cursor-not-allowed"
                          }`}
                        >
                          {size}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="space-y-2">
              {isInStock ? (
                <div className="flex items-center gap-2 text-green-600">
                  <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                  <span className="text-sm font-medium">In Stock</span>
                  {isLowStock && (
                    <span className="text-xs text-orange-600">
                      (Only {selectedVariant?.inventory.qtyAvailable} left)
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                  <span className="text-sm font-medium">Out of Stock</span>
                </div>
              )}
            </div>

            {/* Quantity Selection */}
            {isInStock && (
              <div>
                <label className="text-sm font-medium text-gray-900 mb-2 block">
                  Quantity
                </label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                  >
                    -
                  </button>
                  <span className="w-16 text-center text-lg font-medium">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant?.inventory.qtyAvailable || 1, quantity + 1))}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center hover:bg-gray-50"
                  >
                    +
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-4">
              {/* AI Camera Try-On Button */}
              <button
                onClick={() => setIsAICameraModalOpen(true)}
                className="w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Try On with Camera
              </button>

              {/* Try On Button - Feature Flag Gated */}
              {selectedVariant?.overlayPng && (
                <ClientTryOnButton 
                  onClick={handleTryOn}
                  disabled={false}
                />
              )}

              {/* Add to Cart / Out of Stock */}
              <button
                onClick={handleAddToCart}
                disabled={!isInStock}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 ${
                  isInStock
                    ? "bg-gray-900 text-white hover:bg-gray-800"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                <ShoppingCart className="h-5 w-5" />
                {isInStock ? "Add to Cart" : "Out of Stock"}
              </button>

              {/* Secondary Actions */}
              <div className="flex gap-4">
                <button
                  onClick={handleWishlistToggle}
                  className="flex-1 border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Heart className={`h-5 w-5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
                  {isWishlisted ? "Wishlisted" : "Add to Wishlist"}
                </button>

                <button className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                  <Share2 className="h-5 w-5" />
                  Share
                </button>
              </div>
            </div>

            {/* Delivery Info */}
            <div className="border-t pt-6">
              <div className="flex items-start gap-3">
                <Truck className="h-5 w-5 text-gray-600 mt-1" />
                <div>
                  <p className="font-medium text-gray-900">Free Delivery</p>
                  <p className="text-sm text-gray-600">Standard delivery 3-7 business days</p>
                  <p className="text-sm text-gray-600 mt-1">Express delivery available at checkout</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Product Description & Care */}
        <div className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Description</h2>
            <div className="prose text-gray-600">
              <p>{product.description}</p>
            </div>
          </div>

          <div>
            <h2 className="text-xl font-bold text-gray-900 mb-4">Care Instructions</h2>
            <div className="prose text-gray-600">
              <p>{product.care}</p>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews 
            productId={product.id} 
            initialReviews={[]}
            initialAverageRating={0}
            initialRatingDistribution={{}}
            userToken={userToken}
          />
        </div>
      </div>

      {/* Try-On Modal */}
      {isTryOnModalOpen && selectedVariant?.overlayPng && (
        <TryOnModal
          isOpen={isTryOnModalOpen}
          onClose={() => setIsTryOnModalOpen(false)}
          garmentImageUrl={selectedVariant.overlayPng}
          productName={product.title}
          variantInfo={`${selectedVariant.color} - ${selectedVariant.size}`}
          onAddToCart={handleTryOnToCart}
        />
      )}

      {/* AI Camera Try-On Modal */}
      {isAICameraModalOpen && selectedVariant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-2xl font-bold">Virtual Try-On</h2>
              <button
                onClick={() => setIsAICameraModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>
            <div className="p-6">
              <AISareeTryOn
                product={{
                  sku: product!.sku, // Use base product SKU
                  name: product.title,
                  price: selectedVariant.price,
                  image: product.images[0],
                  category: product.category.slug,
                  variants: [
                    {
                      id: selectedVariant.id,
                      sku: selectedVariant.sku, // Variant SKU for Cloudinary paths
                      name: `${selectedVariant.color} - ${selectedVariant.size}`,
                      image: product.images[0],
                    }
                  ]
                }}
                userId={userToken}
                onSuccess={() => {
                  analytics.track("tryon_to_cart", {
                    product_id: product.id,
                    product_name: product.title,
                    variant_id: selectedVariant.id,
                  });
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}