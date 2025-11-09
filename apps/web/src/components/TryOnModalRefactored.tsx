/**
 * Refactored TryOnModal - Simplified with contexts and split components
 */
'use client';

import React, { useRef, Suspense, lazy, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { TryOnStorageManager } from '../lib/tryon-storage';
import { useTryOn } from '../contexts/TryOnContext';
import { useProduct } from '../contexts/ProductContext';
import { useMLLibraryManager } from '../hooks/useMLLibraryManager';
import { TryOnControls } from './tryon/TryOnControls';
import { TryOnSidebar } from './tryon/TryOnSidebar';

// Lazy load TryOnCanvas only when modal opens
const TryOnCanvas = lazy(() => 
  import("@radhagsareees/ui").then(module => ({ 
    default: module.TryOnCanvas 
  }))
);

interface TryOnModalProps {
  onAddToCart: () => void;
}

export function TryOnModal({ onAddToCart }: TryOnModalProps) {
  const canvasRef = useRef<any>(null);
  const storageManagerRef = useRef<TryOnStorageManager>(new TryOnStorageManager());
  
  // Context hooks
  const { 
    isModalOpen, 
    closeModal, 
    isProcessing,
    setProcessing,
    currentCapture,
    addCapture,
    updateSettings,
    clearCaptures
  } = useTryOn();
  
  const { product } = useProduct();
  const { isLoaded, isLoading, error, loadLibraries, retryLoad } = useMLLibraryManager();

  // Load ML libraries when modal opens
  useEffect(() => {
    if (isModalOpen && !isLoaded) {
      loadLibraries();
    }
  }, [isModalOpen, isLoaded, loadLibraries]);

  // Load saved try-on settings on modal open
  useEffect(() => {
    if (isModalOpen) {
      const savedSettings = storageManagerRef.current.loadSettings();
      if (savedSettings && canvasRef.current) {
        canvasRef.current.applySettings(savedSettings);
      }
    }
  }, [isModalOpen]);

  // Handle canvas settings change to persist them
  const handleSettingsChange = (settings: any) => {
    storageManagerRef.current.saveSettings(settings);
    updateSettings(settings);
  };

  // Handle photo capture
  const handleCapture = async () => {
    if (!canvasRef.current || !product) return;

    try {
      setProcessing(true);

      // Get the captured image and quality score from TryOnCanvas
      const result = await canvasRef.current.captureImage();
      
      if (result) {
        const captureData = {
          id: `capture-${Date.now()}`,
          imageDataUrl: result.imageDataUrl,
          qualityScore: result.qualityScore,
          timestamp: new Date().toISOString(),
          productInfo: {
            name: product.name,
            variant: product.variantInfo,
            garmentUrl: product.images[0] || '',
          }
        };

        // Add to context
        addCapture(captureData);

        // Save capture to user's gallery
        storageManagerRef.current.saveCapturedImage({
          imageDataUrl: result.imageDataUrl,
          productName: product.name,
          variantInfo: product.variantInfo,
          garmentImageUrl: product.images[0] || '',
          qualityScore: result.qualityScore,
          timestamp: new Date().toISOString(),
        });

        // Track capture event (would use analytics hook here)
        console.log('Try-on captured:', {
          productId: product.id,
          qualityScore: result.qualityScore,
        });
      }
    } catch (error) {
      console.error("Error capturing try-on image:", error);
      alert("Failed to capture image. Please try again.");
    } finally {
      setProcessing(false);
    }
  };

  // Handle download of captured image
  const handleDownload = () => {
    if (!currentCapture || !product) return;

    const link = document.createElement("a");
    link.href = currentCapture.imageDataUrl;
    link.download = `tryon-${product.name.replace(/\s+/g, "-").toLowerCase()}-${Date.now()}.png`;
    link.click();

    console.log('Try-on image downloaded:', {
      productId: product.id,
      captureId: currentCapture.id,
    });
  };

  // Handle reset/retake
  const handleReset = () => {
    clearCaptures();
    if (canvasRef.current) {
      canvasRef.current.reset();
    }

    console.log('Try-on reset:', {
      productId: product?.id,
    });
  };

  // Handle add to cart from try-on
  const handleAddToCartFromTryOn = () => {
    console.log('Try-on to cart:', {
      productId: product?.id,
      hasCapturedImage: !!currentCapture,
      qualityScore: currentCapture?.qualityScore,
    });

    onAddToCart();
  };

  // Handle modal close
  const handleClose = () => {
    console.log('Try-on modal closed:', {
      productId: product?.id,
      hasCaptures: !!currentCapture,
    });
    
    closeModal();
  };

  if (!isModalOpen || !product) return null;

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
                {product.name} - {product.variantInfo}
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
                  {/* Loading State */}
                  {isLoading && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-purple-600" />
                        <p className="text-gray-600 mb-2">Loading Try-On Engine...</p>
                      </div>
                    </div>
                  )}

                  {/* Error State */}
                  {error && (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-center text-red-600">
                        <p className="mb-2">Failed to load Try-On engine</p>
                        <button 
                          onClick={retryLoad}
                          className="text-purple-600 underline"
                        >
                          Try again
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Canvas */}
                  {isLoaded && (
                    <div className="w-full h-full flex items-center justify-center">
                      <p className="text-gray-600">Try-On Canvas Ready</p>
                      {/* TryOnCanvas would be rendered here with proper props */}
                    </div>
                  )}
                </div>

                {/* Controls */}
                <TryOnControls
                  isProcessing={isProcessing}
                  onCapture={handleCapture}
                  onReset={handleReset}
                  disabled={!isLoaded}
                />
              </div>

              {/* Sidebar */}
              <TryOnSidebar
                qualityScore={currentCapture?.qualityScore || null}
                capturedImage={currentCapture?.imageDataUrl || null}
                onDownload={handleDownload}
                onAddToCart={handleAddToCartFromTryOn}
                onClose={handleClose}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}