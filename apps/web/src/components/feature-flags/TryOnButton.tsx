/**
 * Feature Flag Gated Try-On Button
 * 
 * Demonstrates how to gate UI components behind feature flags
 * with server-side rendering safety and fallback options.
 */

import React from 'react';
import { FeatureGate, useFeatureFlag } from './FeatureFlagProvider';

interface TryOnButtonProps {
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  children?: React.ReactNode;
}

/**
 * Enhanced Try-On Button with V2 Features (Client-Side)
 * Only shows when tryon_v2 flag is enabled
 */
export function EnhancedTryOnButton({ 
  onClick, 
  disabled = false,
  className = "",
  children = "Try On Virtually (Enhanced)" 
}: TryOnButtonProps) {
  return (
    <FeatureGate flag="tryon_v2">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg 
          font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 
          flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        {/* Enhanced V2 indicator */}
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>{children}</span>
          <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">V2</span>
        </div>
      </button>
    </FeatureGate>
  );
}

/**
 * Client-Side Feature Flag Gated Try-On Button
 * Uses React context for client-side rendering
 */
export function ClientTryOnButton({ 
  onClick, 
  disabled = false,
  className = "",
  children = "Try On Virtually" 
}: TryOnButtonProps) {
  return (
    <FeatureGate 
      flag="tryon_v2" 
      fallback={
        // Standard try-on button when flag is disabled
        <button
          onClick={onClick}
          disabled={disabled}
          className={`
            w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium 
            hover:bg-purple-700 transition-colors flex items-center justify-center gap-2
            disabled:opacity-50 disabled:cursor-not-allowed
            ${className}
          `}
        >
          <span>{children}</span>
        </button>
      }
    >
      {/* Enhanced try-on button with V2 features */}
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg 
          font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 
          flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
        `}
      >
        <div className="flex items-center gap-2">
          {/* Lightning bolt icon for enhanced features */}
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <span>Try On Virtually (Enhanced)</span>
          <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">V2</span>
        </div>
      </button>
    </FeatureGate>
  );
}