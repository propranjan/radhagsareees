/**
 * Feature Flag React Components
 * 
 * Provides React components and hooks for feature flag integration.
 * Separated from utilities for better JSX handling.
 */

'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import type { FeatureFlag, FeatureFlagContext } from '../../lib/feature-flags';

/**
 * Client-side feature flag context
 */
const ClientFeatureFlagContext = createContext<FeatureFlagContext | null>(null);

/**
 * Feature flag provider component
 * Pass server-rendered flags to prevent hydration mismatches
 */
export function FeatureFlagProvider({
  children,
  initialFlags,
}: {
  children: React.ReactNode;
  initialFlags: FeatureFlagContext;
}) {
  const [flagContext, setFlagContext] = useState<FeatureFlagContext>(initialFlags);

  // Sync with cookie changes in development
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;

    // Check for cookie updates periodically
    const checkCookieUpdates = () => {
      const updatedFlags = { ...flagContext.flags };
      let hasChanges = false;

      // Check each flag for cookie overrides
      for (const flagName of Object.keys(updatedFlags) as FeatureFlag[]) {
        const cookieKey = `ff_${flagName}`;
        const cookieValue = getCookie(cookieKey);
        
        if (cookieValue !== null) {
          const parsedValue = parseClientFlagValue(cookieValue);
          if (parsedValue !== null && parsedValue !== updatedFlags[flagName]) {
            updatedFlags[flagName] = parsedValue;
            hasChanges = true;
          }
        }
      }

      if (hasChanges) {
        setFlagContext({
          flags: updatedFlags,
          timestamp: Date.now(),
        });
      }
    };

    // Check immediately and set up polling for development
    checkCookieUpdates();
    const interval = setInterval(checkCookieUpdates, 1000);

    return () => clearInterval(interval);
  }, [flagContext.flags]);

  return (
    <ClientFeatureFlagContext.Provider value={flagContext}>
      {children}
    </ClientFeatureFlagContext.Provider>
  );
}

/**
 * Hook to access feature flags in React components
 */
export function useFeatureFlags(): FeatureFlagContext {
  const context = useContext(ClientFeatureFlagContext);
  
  if (!context) {
    throw new Error('useFeatureFlags must be used within a FeatureFlagProvider');
  }
  
  return context;
}

/**
 * Hook to check a specific feature flag
 */
export function useFeatureFlag(flag: FeatureFlag): boolean {
  const { flags } = useFeatureFlags();
  return flags[flag] ?? false;
}

/**
 * Hook to check multiple feature flags
 */
export function useFeatureFlagsBatch(flagList: FeatureFlag[]): Record<string, boolean> {
  const { flags } = useFeatureFlags();
  
  const result: Record<string, boolean> = {};
  for (const flag of flagList) {
    result[flag] = flags[flag] ?? false;
  }
  
  return result;
}

/**
 * Conditional rendering component based on feature flag
 */
export function FeatureGate({
  flag,
  children,
  fallback = null,
}: {
  flag: FeatureFlag;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const isEnabled = useFeatureFlag(flag);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Multi-flag conditional rendering
 */
export function MultiFeatureGate({
  flags,
  mode = 'all', // 'all' requires all flags to be true, 'any' requires at least one
  children,
  fallback = null,
}: {
  flags: FeatureFlag[];
  mode?: 'all' | 'any';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}) {
  const flagValues = useFeatureFlagsBatch(flags);
  
  const isEnabled = mode === 'all' 
    ? flags.every(flag => flagValues[flag])
    : flags.some(flag => flagValues[flag]);
  
  return isEnabled ? <>{children}</> : <>{fallback}</>;
}

/**
 * Higher-order component for feature flag gating
 */
export function withFeatureFlag<P extends object>(
  flag: FeatureFlag,
  FallbackComponent?: React.ComponentType<P>
) {
  return function FeatureFlagHOC(WrappedComponent: React.ComponentType<P>) {
    const ComponentWithFeatureFlag = (props: P) => {
      const isEnabled = useFeatureFlag(flag);
      
      if (!isEnabled) {
        return FallbackComponent ? <FallbackComponent {...props} /> : null;
      }
      
      return <WrappedComponent {...props} />;
    };
    
    ComponentWithFeatureFlag.displayName = `withFeatureFlag(${WrappedComponent.displayName || WrappedComponent.name})`;
    
    return ComponentWithFeatureFlag;
  };
}

/**
 * Custom hook for feature flag with loading state
 * Useful for preventing flash of content during hydration
 */
export function useFeatureFlagWithLoading(flag: FeatureFlag): {
  isEnabled: boolean;
  isLoading: boolean;
} {
  const [isLoading, setIsLoading] = useState(true);
  const isEnabled = useFeatureFlag(flag);
  
  useEffect(() => {
    // Simulate hydration delay
    const timer = setTimeout(() => setIsLoading(false), 0);
    return () => clearTimeout(timer);
  }, []);
  
  return { isEnabled, isLoading };
}

/**
 * Helper functions
 */
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  
  return null;
}

function parseClientFlagValue(value: string | null): boolean | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  if (normalized === 'true' || normalized === '1') return true;
  if (normalized === 'false' || normalized === '0') return false;
  
  return null;
}