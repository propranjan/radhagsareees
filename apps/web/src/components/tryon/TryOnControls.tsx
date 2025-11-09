/**
 * Try-On Controls Component - Extracted from TryOnModal
 */
'use client';

import React from 'react';
import { Camera, RotateCcw, Loader2 } from 'lucide-react';

interface TryOnControlsProps {
  isProcessing: boolean;
  onCapture: () => void;
  onReset: () => void;
  disabled?: boolean;
}

export function TryOnControls({ isProcessing, onCapture, onReset, disabled = false }: TryOnControlsProps) {
  return (
    <div className="mt-4 flex items-center justify-center gap-4">
      <button
        onClick={onCapture}
        disabled={isProcessing || disabled}
        className="flex items-center gap-2 bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : (
          <Camera className="h-5 w-5" />
        )}
        {isProcessing ? "Processing..." : "Capture Photo"}
      </button>

      <button
        onClick={onReset}
        disabled={disabled}
        className="flex items-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-gray-700 disabled:opacity-50 transition-colors"
      >
        <RotateCcw className="h-5 w-5" />
        Reset
      </button>
    </div>
  );
}