/**
 * Feature Flag Demo Component
 * 
 * Standalone example demonstrating feature flag functionality
 * with both server-side and client-side implementations.
 */

'use client';

import React, { useState, useEffect } from 'react';
import { ClientFeatureFlagUtils } from '../../lib/feature-flags-client';

// Mock feature flags for demo (normally would come from server)
const mockFeatureFlags = {
  tryon_v2: false,
  reviews_moderation_strict: true,
};

export function FeatureFlagDemo() {
  const [flags, setFlags] = useState(mockFeatureFlags);
  const [cookieOverrides, setCookieOverrides] = useState<Record<string, boolean>>({});

  // Load cookie overrides on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const overrides = ClientFeatureFlagUtils.getCurrentCookieOverrides();
      setCookieOverrides(overrides);
      
      // Apply overrides to flags for demo
      const updatedFlags = { ...flags };
      Object.entries(overrides).forEach(([flag, value]) => {
        if (flag in updatedFlags) {
          (updatedFlags as any)[flag] = value;
        }
      });
      setFlags(updatedFlags);
    }
  }, []);

  const toggleFlag = (flagName: string, value: boolean) => {
    if (process.env.NODE_ENV === 'development') {
      ClientFeatureFlagUtils.setCookieOverride(flagName as any, value);
      
      // Update local state for immediate UI feedback
      setFlags(prev => ({ ...prev, [flagName]: value }));
      setCookieOverrides(prev => ({ ...prev, [flagName]: value }));
    }
  };

  const clearAllOverrides = () => {
    ClientFeatureFlagUtils.clearAllCookieOverrides();
    setFlags(mockFeatureFlags);
    setCookieOverrides({});
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Feature Flag System Demo</h1>
        <p className="text-gray-600">
          Demonstrating feature flag functionality with cookie overrides for development testing.
        </p>
      </div>

      {/* Feature Flag Controls */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Feature Flag Controls</h2>
          <div className="space-y-4">
            {Object.entries(flags).map(([flagName, value]) => (
              <div key={flagName} className="flex items-center justify-between">
                <div>
                  <label className="font-medium text-gray-900">{flagName}</label>
                  {cookieOverrides[flagName] !== undefined && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Override
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleFlag(flagName, true)}
                    className={`px-3 py-1 text-sm rounded ${
                      value 
                        ? 'bg-green-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    ON
                  </button>
                  <button
                    onClick={() => toggleFlag(flagName, false)}
                    className={`px-3 py-1 text-sm rounded ${
                      !value 
                        ? 'bg-red-600 text-white' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    OFF
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t">
            <button
              onClick={clearAllOverrides}
              className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
            >
              Clear All Overrides
            </button>
          </div>
        </div>

        <div className="bg-gray-50 p-6 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">Current State</h2>
          <div className="space-y-3">
            {Object.entries(flags).map(([flagName, value]) => (
              <div key={flagName} className="flex justify-between items-center">
                <span className="font-medium">{flagName}:</span>
                <span className={`px-2 py-1 rounded text-sm font-medium ${
                  value 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {value ? 'Enabled' : 'Disabled'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Feature Demonstrations */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900">Feature Demonstrations</h2>

        {/* Try-On V2 Feature Demo */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Enhanced Try-On Experience (tryon_v2)</h3>
          
          {flags.tryon_v2 ? (
            <div className="space-y-4">
              {/* Enhanced Try-On Button */}
              <button className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white px-6 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-purple-800 transition-all duration-200 flex items-center justify-center gap-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>Try On Virtually (Enhanced)</span>
                  <span className="text-xs bg-purple-500 px-2 py-1 rounded-full">V2</span>
                </div>
              </button>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <h4 className="font-medium text-purple-900 mb-2">Enhanced Features Available:</h4>
                <ul className="text-sm text-purple-800 space-y-1">
                  <li>• Server-side AI processing</li>
                  <li>• Advanced pose detection</li>
                  <li>• Real-time fabric simulation</li>
                  <li>• Enhanced lighting effects</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Standard Try-On Button */}
              <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors flex items-center justify-center gap-2">
                <span>Try On Virtually</span>
              </button>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-600 text-sm">
                  Standard try-on experience. Enable the tryon_v2 flag to see enhanced features.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Reviews Moderation Demo */}
        <div className="border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Review Moderation (reviews_moderation_strict)</h3>
          
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h4 className="font-medium text-gray-900">Moderation Status</h4>
                <p className="text-sm text-gray-600 mt-1">
                  {flags.reviews_moderation_strict 
                    ? "Strict moderation enabled - All reviews require approval before publishing"
                    : "Standard moderation - Reviews are published immediately with post-moderation"
                  }
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Development Notes */}
      <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
        <h3 className="font-medium text-yellow-800 mb-2">Development Notes</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Cookie overrides only work in development mode</li>
          <li>• Changes persist until cookies are cleared or expired (24 hours)</li>
          <li>• Open browser console and try: <code>FeatureFlags.logCurrentState()</code></li>
          <li>• Server-side flags would be loaded from environment variables in production</li>
        </ul>
      </div>
    </div>
  );
}