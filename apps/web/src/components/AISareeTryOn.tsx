/**
 * AI Saree Try-On Component
 * Complete UI for try-on workflow with image upload, variant selection, and preview
 */

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';
import { useTryOn } from '@/lib/hooks/useTryOn';
import { useImageUpload } from '@/lib/hooks/useImageUpload';
import BeforeAfterSlider from './tryon/BeforeAfterSlider';
import VariantSelector from './tryon/VariantSelector';
import ShareButton from './tryon/ShareButton';
import CameraCapture from './tryon/CameraCapture';
import { Loader, AlertCircle, Check, Upload, Camera } from 'lucide-react';

interface SareeProduct {
  sku: string;
  name: string;
  price: number;
  image: string;
  variants?: Array<{
    id: string;
    name: string;
    image: string;
  }>;
}

interface AISareeTryOnProps {
  product: SareeProduct;
  userId?: string;
  onSuccess?: (result: any) => void;
}

export function AISareeTryOn({
  product,
  userId,
  onSuccess,
}: AISareeTryOnProps) {
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [selectedVariant, setSelectedVariant] = useState(product.variants?.[0]?.id || 'default');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showCameraCapture, setShowCameraCapture] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hooks
  const {
    uploadImage,
    uploading: uploadingImage,
    progress: uploadProgress,
    error: uploadImageError,
    cancel: cancelUpload,
  } = useImageUpload({
    onSuccess: (url) => {
      setUploadedImage(url);
      setUploadError(null);
    },
    onError: (error) => {
      setUploadError(error.message);
    },
  });

  const {
    generateTryOn,
    loading: generatingTryOn,
    error: tryOnError,
    originalImage,
    tryOnImage,
    processingTime,
  } = useTryOn({
    onSuccess: (result) => {
      onSuccess?.(result);
    },
  });

  /**
   * Handle camera capture
   */
  const handleCameraCapture = async (blob: Blob) => {
    try {
      console.log('Camera capture received blob:', blob.size, 'bytes');
      
      // Validate blob
      if (blob.size > 10 * 1024 * 1024) {
        setUploadError('Image size must be less than 10MB');
        return;
      }

      // Create File from Blob
      const file = new File([blob], 'camera-photo.jpg', { type: 'image/jpeg' });
      console.log('File created:', file.name, file.size, 'bytes');

      // Upload to Cloudinary
      console.log('Uploading to Cloudinary...');
      const result = await uploadImage(file);

      if (result) {
        console.log('Upload successful, URL:', result.url);
        // Ready to generate try-on
        await generateTryOn(result.url, product.sku, selectedVariant);
      } else {
        console.error('Upload returned null');
        setUploadError('Failed to upload image');
      }

      // Close camera modal
      setShowCameraCapture(false);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process camera photo';
      console.error('Camera capture error:', message, error);
      setUploadError(message);
    }
  };

  /**
   * Handle image selection and upload
   */
  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    if (!file.type.startsWith('image/')) {
      setUploadError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setUploadError('Image size must be less than 10MB');
      return;
    }

    // Upload to Cloudinary
    const result = await uploadImage(file);

    if (result) {
      // Ready to generate try-on
      await generateTryOn(result.url, product.sku, selectedVariant);
    }
  };

  /**
   * Handle try-on generation
   */
  const handleGenerateTryOn = async () => {
    if (!uploadedImage) {
      setUploadError('Please upload an image first');
      return;
    }

    await generateTryOn(uploadedImage, product.sku, selectedVariant);
  };

  /**
   * Handle variant change
   */
  const handleVariantChange = (variantId: string) => {
    setSelectedVariant(variantId);
    // Regenerate try-on with new variant
    if (uploadedImage) {
      generateTryOn(uploadedImage, product.sku, variantId);
    }
  };

  const hasResults = originalImage && tryOnImage;
  const isLoading = uploadingImage || generatingTryOn;
  const error = uploadError || uploadImageError || tryOnError;

  return (
    <div className="w-full max-w-6xl mx-auto py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">{product.name} Try-On</h1>
        <p className="text-gray-600">
          See how this saree looks on you with our AI-powered virtual try-on
        </p>
      </div>

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Upload and Controls */}
        <div className="lg:col-span-1 space-y-6">
          {/* Image Upload */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Upload Your Photo</h2>

            <div className="space-y-3 mb-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors duration-200
                  ${uploadingImage ? 'border-blue-300 bg-blue-50' : 'border-gray-300 hover:border-blue-500'}
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  disabled={uploadingImage}
                  className="hidden"
                />

                {uploadedImage && !uploadingImage ? (
                  <>
                    <Check className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-600 font-medium">Image uploaded</p>
                  </>
                ) : uploadingImage ? (
                  <>
                    <Loader className="w-8 h-8 text-blue-500 mx-auto mb-2 animate-spin" />
                    <p className="text-blue-600 font-medium mb-2">Uploading...</p>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full transition-all"
                        style={{ width: `${uploadProgress.percentage}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-500 mt-2">{uploadProgress.percentage}%</p>
                    <button
                      onClick={cancelUpload}
                      className="text-red-500 text-sm mt-2 hover:underline"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-700 font-medium">Click to upload</p>
                    <p className="text-sm text-gray-500">or drag and drop</p>
                    <p className="text-xs text-gray-400 mt-2">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </>
                )}
              </div>

              {/* Camera Capture Button */}
              <button
                onClick={() => setShowCameraCapture(true)}
                disabled={uploadingImage}
                className={`
                  w-full py-3 px-4 rounded-lg font-semibold flex items-center justify-center gap-2
                  transition-all duration-200
                  ${
                    uploadingImage
                      ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      : 'bg-purple-600 hover:bg-purple-700 text-white active:scale-95'
                  }
                `}
              >
                <Camera className="w-5 h-5" />
                Take a Photo
              </button>
            </div>

            {uploadedImage && (
              <div className="mt-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                <div className="relative w-full h-32 rounded-lg overflow-hidden bg-gray-100">
                  <Image
                    src={uploadedImage}
                    alt="Uploaded"
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Variant Selector */}
          {product.variants && product.variants.length > 1 && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Select Variant</h2>
              <VariantSelector
                variants={product.variants}
                selectedVariant={selectedVariant}
                onSelect={handleVariantChange}
                disabled={!uploadedImage || generatingTryOn}
              />
            </div>
          )}

          {/* Product Info */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Product Details</h2>
            <p className="text-sm text-gray-600 mb-2">
              <strong>SKU:</strong> {product.sku}
            </p>
            <p className="text-sm text-gray-600 mb-4">
              <strong>Price:</strong> ₹{product.price.toLocaleString('en-IN')}
            </p>
            <button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors duration-200"
              disabled={!hasResults}
            >
              {hasResults ? 'Add to Cart' : 'Generate Try-On First'}
            </button>
          </div>
        </div>

        {/* Right Column: Preview */}
        <div className="lg:col-span-2">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-red-900">Error</h3>
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {uploadedImage && !hasResults && (
            <div className="mb-6">
              <button
                onClick={handleGenerateTryOn}
                disabled={generatingTryOn}
                className={`
                  w-full py-4 px-6 rounded-lg font-semibold text-white text-lg
                  transition-all duration-200 flex items-center justify-center gap-2
                  ${
                    generatingTryOn
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-green-600 hover:bg-green-700 active:scale-95'
                  }
                `}
              >
                {generatingTryOn ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Generating Try-On...
                  </>
                ) : (
                  <>
                    <span>✨ Generate Try-On</span>
                  </>
                )}
              </button>

              {generatingTryOn && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-700">
                    This may take a minute. Please wait while we process your try-on...
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Preview Area */}
          {hasResults ? (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Your Try-On Result</h2>

              {/* Before/After Slider */}
              <div className="mb-6">
                <BeforeAfterSlider
                  beforeImage={originalImage}
                  afterImage={tryOnImage}
                  beforeLabel="Your Photo"
                  afterLabel="With Saree"
                />
              </div>

              {/* Stats */}
              {processingTime && (
                <div className="text-center text-sm text-gray-600 mb-6">
                  Generated in {(processingTime / 1000).toFixed(2)}s
                </div>
              )}

              {/* Share Button */}
              <ShareButton
                imageUrl={tryOnImage}
                productName={product.name}
                productPrice={product.price}
              />
            </div>
          ) : !uploadedImage ? (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m0 0h6m0 0l-6-6m0 0l-6-6"
                  />
                </svg>
              </div>
              <h3 className="text-gray-700 font-semibold mb-2">
                Upload a photo to get started
              </h3>
              <p className="text-gray-500 text-sm">
                Use a full-body photo for best results
              </p>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-12 text-center">
              <Loader className="w-12 h-12 mx-auto text-blue-500 animate-spin mb-4" />
              <h3 className="text-gray-700 font-semibold">
                Processing your try-on...
              </h3>
              <p className="text-gray-500 text-sm mt-2">
                This may take up to 3 minutes
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Camera Capture Modal */}
      {showCameraCapture && (
        <CameraCapture
          onPhotoCapture={handleCameraCapture}
          onClose={() => setShowCameraCapture(false)}
        />
      )}
    </div>
  );
}

export default AISareeTryOn;
