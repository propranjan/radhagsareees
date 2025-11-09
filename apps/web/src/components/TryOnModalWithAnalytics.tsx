/**
 * Enhanced TryOn Modal with comprehensive analytics tracking
 */

"use client";

import React, { useState, useEffect, useRef, Suspense, lazy } from "react";
import { X, ShoppingCart, Download, RotateCcw, Zap, Camera, Loader2 } from "lucide-react";
import { TryOnStorageManager } from "../lib/tryon-storage";
import { useMLLibraries } from "../lib/performance/lazy-loading";
import { useTryOnAnalytics, usePerformanceTracking } from "../lib/analytics/hooks";

// Import TryOnCanvas directly for now to avoid dynamic import issues
import { TryOnCanvas } from "@radhagsareees/ui";

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  garmentImageUrl: string;
  productName: string;
  productId: string;
  category: string;
  price: number;
  variantInfo: string;
  onAddToCart: () => void;
}

export function TryOnModalWithAnalytics({
  isOpen,
  onClose,
  garmentImageUrl,
  productName,
  productId,
  category,
  price,
  variantInfo,
  onAddToCart,
}: TryOnModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const canvasRef = useRef<any>(null);
  const storageManager = useRef<TryOnStorageManager>(new TryOnStorageManager());
  
  // Analytics hooks
  const { trackOpened, trackCaptured } = useTryOnAnalytics();
  const { measureAndTrack } = usePerformanceTracking();
  
  // ML libraries loading state
  const mlState = useMLLibraries();

  // Track try-on modal opened and load ML libraries
  useEffect(() => {
    if (isOpen && !mlState.isLoaded) {
      const initializeTryOn = async () => {
        // Measure ML library loading time with analytics
        const { duration: loadTime } = await measureAndTrack(
          () => mlState.loadLibraries(),
          'ml-libraries-loading',
          { productId, category }
        );

        // Track try-on opened event
        await trackOpened({
          id: productId,
          name: productName,
          category,
          price,
        }, loadTime);

        console.log(`ML libraries loaded in ${loadTime.toFixed(2)}ms`);
      };

      initializeTryOn().catch(error => {
        console.error('Failed to initialize try-on:', error);
      });
    } else if (isOpen && mlState.isLoaded) {
      // If already loaded, just track the opening
      trackOpened({
        id: productId,
        name: productName,
        category,
        price,
      }).catch(console.error);
    }
  }, [isOpen, mlState.isLoaded, productId, productName, category, price, trackOpened, measureAndTrack, mlState]);

  // Handle photo capture with analytics
  const handleCapture = async () => {
    if (!canvasRef.current) return;

    setIsProcessing(true);

    try {
      // Measure photo capture and processing time
      const { result: captureResult, duration: processingTime } = await measureAndTrack(
        async () => {
          // Capture photo from canvas
          const imageData = canvasRef.current.capturePhoto();
          
          // Simulate quality scoring (in real app, this would be actual ML scoring)
          const quality = Math.random() * 0.4 + 0.6; // 0.6 to 1.0
          
          // Save to storage
          const savedImageId = storageManager.current.saveCapturedImage({
            imageDataUrl: imageData,
            productName,
            variantInfo,
            garmentImageUrl,
            qualityScore: quality,
            timestamp: new Date().toISOString(),
          });

          return {
            imageData,
            quality,
            saved: Boolean(savedImageId),
          };
        },
        'photo-capture-processing',
        { productId, category, variant: variantInfo }
      );

      // Update state
      setLastCapturedImage(captureResult.imageData);
      setQualityScore(captureResult.quality);

      // Track capture event with analytics
      await trackCaptured({
        id: productId,
        name: productName,
        category,
        price,
      }, processingTime, captureResult.quality);

    } catch (error) {
      console.error('Capture failed:', error);
      
      // You could track capture failures here
      // await analytics.track('tryon_capture_failed', { error: error.message, productId });
      
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle add to cart from try-on
  const handleAddToCartFromTryOn = async () => {
    // Call the original add to cart handler
    onAddToCart();

    // Additional analytics could be tracked here for try-on conversion
    console.log('Add to cart from try-on experience', {
      productId,
      hadCapturedPhoto: !!lastCapturedImage,
      qualityScore,
    });
  };

  // Handle download with analytics
  const handleDownload = async () => {
    if (!lastCapturedImage) return;

    try {
      // Create download link
      const link = document.createElement('a');
      link.href = lastCapturedImage;
      link.download = `tryon-${productName}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Track download event (could be added to analytics package)
      console.log('Try-on photo downloaded', {
        productId,
        productName,
        qualityScore,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error('Download failed:', error);
    }
  };

  // Handle modal close
  const handleClose = () => {
    onClose();
    
    // Could track modal close analytics
    console.log('Try-on modal closed', {
      productId,
      hadInteraction: !!lastCapturedImage,
      timeSpent: Date.now(), // Would need to track open time
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-4xl bg-white rounded-lg shadow-xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Virtual Try-On</h2>
            <p className="text-sm text-gray-600">{productName} - {variantInfo}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {mlState.isLoading && (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
              <p className="text-lg font-medium text-gray-900 mb-2">
                Loading Virtual Try-On
              </p>
              <p className="text-sm text-gray-600 text-center">
                Initializing ML models for the best try-on experience...
              </p>
              {mlState.progress > 0 && (
                <div className="w-64 bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${mlState.progress}%` }}
                  />
                </div>
              )}
            </div>
          )}

          {mlState.error && (
            <div className="flex flex-col items-center justify-center h-96">
              <div className="text-red-500 mb-4">
                <X className="w-12 h-12" />
              </div>
              <p className="text-lg font-medium text-gray-900 mb-2">
                Try-On Unavailable
              </p>
              <p className="text-sm text-gray-600 text-center mb-4">
                {mlState.error.message}
              </p>
              <button
                onClick={() => mlState.loadLibraries()}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {mlState.isLoaded && (
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Try-On Canvas */}
              <div className="space-y-4">
                <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                  <Suspense fallback={
                    <div className="w-full h-full flex items-center justify-center">
                      <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
                    </div>
                  }>
                    <TryOnCanvas
                      garmentImageUrl={garmentImageUrl}
                      onReady={(modelInfo: any) => {
                        console.log('TryOn model ready:', modelInfo);
                      }}
                      onPoseState={(poseOk: any) => {
                        // Could use this for UI feedback
                        console.log('Pose detection:', poseOk);
                      }}
                      onCapture={(capturedData: any) => {
                        console.log('TryOn captured:', capturedData);
                      }}
                      className="w-full h-full"
                    />
                  </Suspense>
                </div>

                {/* Controls */}
                <div className="flex gap-2">
                  <button
                    onClick={handleCapture}
                    disabled={isProcessing}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isProcessing ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <Camera className="w-5 h-5" />
                    )}
                    {isProcessing ? 'Processing...' : 'Capture Photo'}
                  </button>

                  {lastCapturedImage && (
                    <button
                      onClick={handleDownload}
                      className="px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                      <Download className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Quality Score */}
                {qualityScore && (
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-500" />
                    <span className="text-gray-600">
                      Quality Score: {(qualityScore * 100).toFixed(0)}%
                    </span>
                  </div>
                )}
              </div>

              {/* Preview & Actions */}
              <div className="space-y-6">
                {lastCapturedImage ? (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      Your Try-On Photo
                    </h3>
                    <div className="aspect-[3/4] bg-gray-100 rounded-lg overflow-hidden">
                      <img
                        src={lastCapturedImage}
                        alt="Try-on capture"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="aspect-[3/4] bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 flex items-center justify-center">
                    <div className="text-center">
                      <Camera className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        Capture a photo to see your try-on result
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCartFromTryOn}
                    className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5" />
                    Add to Cart
                  </button>

                  {lastCapturedImage && (
                    <button
                      onClick={() => {
                        // Share functionality could be implemented here
                        console.log('Sharing try-on photo');
                      }}
                      className="w-full px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Share Photo
                    </button>
                  )}
                </div>

                {/* Tips */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="font-medium text-blue-900 mb-2">Try-On Tips</h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Ensure good lighting for best results</li>
                    <li>• Face the camera directly</li>
                    <li>• Remove glasses if possible</li>
                    <li>• Keep your pose natural</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}