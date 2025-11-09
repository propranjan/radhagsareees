"use client";

import { useState, useEffect, useRef, Suspense, lazy } from "react";
import { X, ShoppingCart, Download, RotateCcw, Zap, Camera, Loader2 } from "lucide-react";
import { analytics } from "../lib/analytics";
import { TryOnStorageManager } from "../lib/tryon-storage";
import { useMLLibraries } from "../lib/performance/lazy-loading";

// Lazy load TryOnCanvas only when modal opens
const TryOnCanvas = lazy(() => 
  import("@radhagsareees/ui").then(module => ({ 
    default: module.TryOnCanvas 
  }))
);

interface TryOnModalProps {
  isOpen: boolean;
  onClose: () => void;
  garmentImageUrl: string;
  productName: string;
  variantInfo: string;
  onAddToCart: () => void;
}

export function TryOnModal({
  isOpen,
  onClose,
  garmentImageUrl,
  productName,
  variantInfo,
  onAddToCart,
}: TryOnModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastCapturedImage, setLastCapturedImage] = useState<string | null>(null);
  const [qualityScore, setQualityScore] = useState<number | null>(null);
  const canvasRef = useRef<any>(null);
  const storageManager = useRef<TryOnStorageManager>(new TryOnStorageManager());
  
  // ML libraries loading state
  const mlState = useMLLibraries();

  // Load ML libraries when modal opens
  useEffect(() => {
    if (isOpen && !mlState.isLoaded) {
      const startTime = performance.now();
      
      mlState.loadLibraries()
        .then(() => {
          const loadTime = performance.now() - startTime;
          console.log(`ML libraries loaded in ${loadTime.toFixed(2)}ms`);
          
          // Track loading performance
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'ml_libraries_loaded', {
              custom_parameter_load_time: loadTime,
              custom_parameter_trigger: 'tryon_modal_open'
            });
          }
        })
        .catch((error) => {
          console.error('Failed to load ML libraries:', error);
          
          // Track loading error
          if (typeof window !== 'undefined' && (window as any).gtag) {
            (window as any).gtag('event', 'ml_libraries_error', {
              custom_parameter_error: error.message,
              custom_parameter_trigger: 'tryon_modal_open'
            });
          }
        });
    }
  }, [isOpen, mlState]);

  // Load saved try-on settings on modal open
  useEffect(() => {
    if (isOpen) {
      const savedSettings = storageManager.current.loadSettings();
      if (savedSettings && canvasRef.current) {
        // Apply saved settings to canvas
        canvasRef.current.applySettings(savedSettings);
      }
    }
  }, [isOpen]);

  // Handle canvas settings change to persist them
  const handleSettingsChange = (settings: any) => {
    storageManager.current.saveSettings(settings);
  };

  // Handle photo capture
  const handleCapture = async () => {
    if (!canvasRef.current) return;

    try {
      setIsProcessing(true);

      // Get the captured image and quality score from TryOnCanvas
      const result = await canvasRef.current.captureImage();
      
      if (result) {
        setLastCapturedImage(result.imageDataUrl);
        setQualityScore(result.qualityScore);

        // Save capture to user's gallery
        storageManager.current.saveCapturedImage({
          imageDataUrl: result.imageDataUrl,
          productName,
          variantInfo,
          garmentImageUrl,
          qualityScore: result.qualityScore,
          timestamp: new Date().toISOString(),
        });

        // Track capture event
        analytics.track("tryon_captured", {
          product_name: productName,
          variant_info: variantInfo,
          quality_score: result.qualityScore,
          garment_image_url: garmentImageUrl,
        });

        // Track quality score event
        analytics.track("tryon_quality_score", {
          product_name: productName,
          variant_info: variantInfo,
          quality_score: result.qualityScore,
          score_category: result.qualityScore >= 0.8 ? "high" : result.qualityScore >= 0.6 ? "medium" : "low",
        });
      }
    } catch (error) {
      console.error("Error capturing try-on image:", error);
      alert("Failed to capture image. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle download of captured image
  const handleDownload = () => {
    if (!lastCapturedImage) return;

    const link = document.createElement("a");
    link.href = lastCapturedImage;
    link.download = `tryon-${productName.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
    link.click();

    analytics.track("tryon_image_downloaded", {
      product_name: productName,
      variant_info: variantInfo,
      quality_score: qualityScore,
    });
  };

  // Handle reset/retake
  const handleReset = () => {
    setLastCapturedImage(null);
    setQualityScore(null);
    if (canvasRef.current) {
      canvasRef.current.reset();
    }

    analytics.track("tryon_reset", {
      product_name: productName,
      variant_info: variantInfo,
    });
  };

  // Handle add to cart from try-on
  const handleAddToCartFromTryOn = () => {
    analytics.track("tryon_to_cart", {
      product_name: productName,
      variant_info: variantInfo,
      has_captured_image: !!lastCapturedImage,
      quality_score: qualityScore,
    });

    onAddToCart();
  };

  // Handle modal close
  const handleClose = () => {
    // Track modal close with engagement metrics
    const engagementData = {
      product_name: productName,
      variant_info: variantInfo,
      time_spent: Date.now() - (storageManager.current.getSessionStartTime() || Date.now()),
      has_captured_image: !!lastCapturedImage,
      quality_score: qualityScore,
    };

    analytics.track("tryon_closed", engagementData);
    
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-6xl bg-white rounded-lg shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Virtual Try-On</h2>
              <p className="text-sm text-gray-600 mt-1">
                {productName} - {variantInfo}
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Try-On Canvas - Takes up most space */}
              <div className="lg:col-span-3">
                <div className="bg-gray-100 rounded-lg overflow-hidden" style={{ aspectRatio: "4/3", minHeight: "500px" }}>
                  {/* Show loading state while ML libraries are loading */}
                  {mlState.isLoading ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                        <p className="text-gray-600 mb-2">Loading Try-On Engine...</p>
                        <div className="w-48 bg-gray-200 rounded-full h-2 mx-auto">
                          <div 
                            className="bg-purple-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${mlState.progress}%` }}
                          />
                        </div>
                        <p className="text-sm text-gray-500 mt-2">{mlState.progress}% complete</p>
                      </div>
                    </div>
                  ) : mlState.error ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-red-600">
                        <p className="mb-2">Failed to load Try-On engine</p>
                        <button 
                          onClick={() => mlState.loadLibraries()}
                          className="text-purple-600 underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Suspense 
                      fallback={
                        <div className="w-full h-full flex items-center justify-center">
                          <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
                        </div>
                      }
                    >
                      <TryOnCanvas
                        ref={canvasRef}
                        garmentImageUrl={garmentImageUrl}
                        onSettingsChange={handleSettingsChange}
                        onProcessingStart={() => setIsProcessing(true)}
                        onProcessingEnd={() => setIsProcessing(false)}
                        className="w-full h-full"
                      />
                    </Suspense>
                  )}
                </div>

                {/* Canvas Controls */}
                <div className="mt-4 flex items-center justify-center gap-4">
                  <button
                    onClick={handleCapture}
                    disabled={isProcessing}
                    className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Camera className="h-5 w-5" />
                    {isProcessing ? "Processing..." : "Capture Photo"}
                  </button>

                  <button
                    onClick={handleReset}
                    className="flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 transition-colors"
                  >
                    <RotateCcw className="h-5 w-5" />
                    Reset
                  </button>
                </div>
              </div>

              {/* Sidebar - Controls and Results */}
              <div className="lg:col-span-1 space-y-6">
                {/* Instructions */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">How to use:</h3>
                  <ol className="text-sm text-blue-800 space-y-1">
                    <li>1. Position yourself in the frame</li>
                    <li>2. Ensure good lighting</li>
                    <li>3. Use controls to adjust fit</li>
                    <li>4. Capture when satisfied</li>
                  </ol>
                </div>

                {/* Quality Indicator */}
                {qualityScore !== null && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Try-On Quality</h3>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            qualityScore >= 0.8
                              ? "bg-green-500"
                              : qualityScore >= 0.6
                              ? "bg-yellow-500"
                              : "bg-red-500"
                          }`}
                          style={{ width: `${qualityScore * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium">
                        {Math.round(qualityScore * 100)}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {qualityScore >= 0.8
                        ? "Excellent quality! Great for sharing."
                        : qualityScore >= 0.6
                        ? "Good quality. Try adjusting lighting."
                        : "Fair quality. Consider better positioning."}
                    </p>
                  </div>
                )}

                {/* Captured Image Preview */}
                {lastCapturedImage && (
                  <div className="bg-white border rounded-lg p-4">
                    <h3 className="font-medium text-gray-900 mb-2">Captured Photo</h3>
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
                      <img
                        src={lastCapturedImage}
                        alt="Captured try-on"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <button
                      onClick={handleDownload}
                      className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </button>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleAddToCartFromTryOn}
                    className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
                  >
                    <ShoppingCart className="h-5 w-5" />
                    Add to Cart
                  </button>

                  <button
                    onClick={handleClose}
                    className="w-full border border-gray-300 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
                  >
                    Continue Shopping
                  </button>
                </div>

                {/* Tips */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-yellow-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-yellow-900 text-sm">Pro Tips</h4>
                      <ul className="text-xs text-yellow-800 mt-1 space-y-1">
                        <li>• Good lighting improves quality</li>
                        <li>• Stand 3-4 feet from camera</li>
                        <li>• Solid background works best</li>
                        <li>• Try different poses</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}