/**
 * Try-On Sidebar Component - Extracted from TryOnModal
 */
'use client';

import React from 'react';
import { Zap, Download, ShoppingCart } from 'lucide-react';

interface TryOnSidebarProps {
  qualityScore: number | null;
  capturedImage: string | null;
  onDownload: () => void;
  onAddToCart: () => void;
  onClose: () => void;
}

export function TryOnSidebar({ 
  qualityScore, 
  capturedImage, 
  onDownload, 
  onAddToCart, 
  onClose 
}: TryOnSidebarProps) {
  return (
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
        <QualityIndicator score={qualityScore} />
      )}

      {/* Captured Image Preview */}
      {capturedImage && (
        <CapturedImagePreview 
          imageUrl={capturedImage}
          onDownload={onDownload}
        />
      )}

      {/* Action Buttons */}
      <div className="space-y-3">
        <button
          onClick={onAddToCart}
          className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-800 transition-colors"
        >
          <ShoppingCart className="h-5 w-5" />
          Add to Cart
        </button>

        <button
          onClick={onClose}
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
  );
}

interface QualityIndicatorProps {
  score: number;
}

function QualityIndicator({ score }: QualityIndicatorProps) {
  const getQualityColor = (score: number) => {
    if (score >= 0.8) return "bg-green-500";
    if (score >= 0.6) return "bg-yellow-500";
    return "bg-red-500";
  };

  const getQualityMessage = (score: number) => {
    if (score >= 0.8) return "Excellent quality! Great for sharing.";
    if (score >= 0.6) return "Good quality. Try adjusting lighting.";
    return "Fair quality. Consider better positioning.";
  };

  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-2">Try-On Quality</h3>
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full ${getQualityColor(score)}`}
            style={{ width: `${score * 100}%` }}
          />
        </div>
        <span className="text-sm font-medium">
          {Math.round(score * 100)}%
        </span>
      </div>
      <p className="text-xs text-gray-600 mt-1">
        {getQualityMessage(score)}
      </p>
    </div>
  );
}

interface CapturedImagePreviewProps {
  imageUrl: string;
  onDownload: () => void;
}

function CapturedImagePreview({ imageUrl, onDownload }: CapturedImagePreviewProps) {
  return (
    <div className="bg-white border rounded-lg p-4">
      <h3 className="font-medium text-gray-900 mb-2">Captured Photo</h3>
      <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-3">
        <img
          src={imageUrl}
          alt="Captured try-on"
          className="w-full h-full object-cover"
        />
      </div>
      <button
        onClick={onDownload}
        className="w-full flex items-center justify-center gap-2 bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors"
      >
        <Download className="h-4 w-4" />
        Download
      </button>
    </div>
  );
}