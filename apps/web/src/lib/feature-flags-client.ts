/**
 * Client-Side Feature Flag Utilities
 * 
 * Browser-specific utilities for feature flag management.
 * Cookie manipulation and development helpers.
 */

import type { FeatureFlag } from './feature-flags';

/**
 * Utility functions for client-side flag management
 */
export const ClientFeatureFlagUtils = {
  /**
   * Set cookie override for development testing
   */
  setCookieOverride(flag: FeatureFlag, value: boolean): void {
    if (process.env.NODE_ENV !== 'development') {
      console.warn('Cookie overrides only available in development');
      return;
    }
    
    const cookieKey = `ff_${flag}`;
    const cookieValue = value.toString();
    
    document.cookie = `${cookieKey}=${cookieValue}; path=/; max-age=86400`;
    
    // Log for development feedback
    console.log(`🚩 Feature flag override: ${flag} = ${value}`);
  },

  /**
   * Clear cookie override
   */
  clearCookieOverride(flag: FeatureFlag): void {
    const cookieKey = `ff_${flag}`;
    document.cookie = `${cookieKey}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
    
    console.log(`🚩 Feature flag override cleared: ${flag}`);
  },

  /**
   * Clear all cookie overrides
   */
  clearAllCookieOverrides(): void {
    const flags: FeatureFlag[] = ['tryon_v2', 'reviews_moderation_strict'];
    
    flags.forEach(flag => this.clearCookieOverride(flag));
    console.log('🚩 All feature flag overrides cleared');
  },

  /**
   * Get current cookie overrides
   */
  getCurrentCookieOverrides(): Record<string, boolean> {
    const overrides: Record<string, boolean> = {};
    const flags: FeatureFlag[] = ['tryon_v2', 'reviews_moderation_strict'];
    
    flags.forEach(flag => {
      const cookieKey = `ff_${flag}`;
      const cookieValue = getCookie(cookieKey);
      const parsedValue = parseClientFlagValue(cookieValue);
      
      if (parsedValue !== null) {
        overrides[flag] = parsedValue;
      }
    });
    
    return overrides;
  },

  /**
   * Log current flag state to console (development only)
   */
  logCurrentState(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    const overrides = this.getCurrentCookieOverrides();
    
    console.group('🚩 Client Feature Flags State');
    console.log('Cookie Overrides:', overrides);
    console.log('To set override: ClientFeatureFlagUtils.setCookieOverride("flag_name", true/false)');
    console.log('To clear override: ClientFeatureFlagUtils.clearCookieOverride("flag_name")');
    console.groupEnd();
  },
};

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

// Make utils available globally in development
if (process.env.NODE_ENV === 'development') {
  if (typeof window !== 'undefined') {
    (window as any).FeatureFlags = ClientFeatureFlagUtils;
  }
}