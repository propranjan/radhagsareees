/**
 * Feature Flag App Wrapper
 * 
 * Provides feature flag context to the entire application
 * with server-side flag initialization.
 */

import React from 'react';
import { getAllServerFeatureFlags, createFeatureFlagContext } from '../../lib/feature-flags';
import { FeatureFlagProvider } from './FeatureFlagProvider';

interface FeatureFlagAppWrapperProps {
  children: React.ReactNode;
}

/**
 * Server Component that initializes feature flags for the entire app
 */
export default async function FeatureFlagAppWrapper({ children }: FeatureFlagAppWrapperProps) {
  // Get all feature flags on the server
  const featureFlagContext = await createFeatureFlagContext();
  
  return (
    <FeatureFlagProvider initialFlags={featureFlagContext}>
      {children}
    </FeatureFlagProvider>
  );
}