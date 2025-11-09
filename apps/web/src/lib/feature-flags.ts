/**
 * Feature Flag System
 * 
 * A lightweight feature flag implementation using environment variables
 * and cookie overrides for development/testing flexibility.
 * 
 * Features:
 * - Environment variable defaults
 * - Cookie-based overrides for testing
 * - SSR-safe client/server evaluation
 * - TypeScript type safety
 * - Development-friendly debugging
 */

import { cookies } from 'next/headers';

/**
 * Available feature flags in the system
 */
export type FeatureFlag = 'tryon_v2' | 'reviews_moderation_strict';

/**
 * Feature flag configuration with defaults and descriptions
 */
export const FEATURE_FLAGS: Record<FeatureFlag, {
  envKey: string;
  defaultValue: boolean;
  description: string;
  cookieKey: string;
}> = {
  tryon_v2: {
    envKey: 'FEATURE_TRYON_V2',
    defaultValue: false,
    cookieKey: 'ff_tryon_v2',
    description: 'Enable experimental server-side try-on v2 functionality',
  },
  reviews_moderation_strict: {
    envKey: 'FEATURE_REVIEWS_MODERATION_STRICT',
    defaultValue: true,
    cookieKey: 'ff_reviews_moderation_strict',
    description: 'Enable strict moderation for product reviews',
  },
} as const;

/**
 * Parse string value to boolean for feature flags
 */
function parseFeatureFlagValue(value: string | undefined): boolean | null {
  if (!value) return null;
  
  const normalized = value.toLowerCase().trim();
  if (normalized === 'true' || normalized === '1' || normalized === 'on') return true;
  if (normalized === 'false' || normalized === '0' || normalized === 'off') return false;
  
  return null;
}

/**
 * Get feature flag value from environment variables
 */
function getEnvFlagValue(flag: FeatureFlag): boolean {
  const config = FEATURE_FLAGS[flag];
  const envValue = process.env[config.envKey];
  const parsed = parseFeatureFlagValue(envValue);
  
  return parsed !== null ? parsed : config.defaultValue;
}

/**
 * Server-side feature flag evaluation
 * Uses environment variables as defaults, with cookie overrides
 */
export async function getServerFeatureFlag(flag: FeatureFlag): Promise<boolean> {
  const config = FEATURE_FLAGS[flag];
  
  try {
    // Get environment default
    const envValue = getEnvFlagValue(flag);
    
    // Check for cookie override (for development/testing)
    const cookieStore = cookies();
    const cookieValue = cookieStore.get(config.cookieKey)?.value;
    const cookieParsed = parseFeatureFlagValue(cookieValue);
    
    // Cookie override takes precedence in development
    if (cookieParsed !== null && process.env.NODE_ENV === 'development') {
      return cookieParsed;
    }
    
    return envValue;
  } catch (error) {
    // Fallback to env value if cookie reading fails
    return getEnvFlagValue(flag);
  }
}

/**
 * Server-side batch feature flag evaluation
 * Efficient for checking multiple flags at once
 */
export async function getServerFeatureFlags(
  flags: FeatureFlag[]
): Promise<Record<string, boolean>> {
  const results: Record<string, boolean> = {};
  
  // Evaluate all flags in parallel
  const promises = flags.map(async (flag) => {
    const value = await getServerFeatureFlag(flag);
    return { flag, value };
  });
  
  const resolvedFlags = await Promise.all(promises);
  
  // Build result object
  for (const { flag, value } of resolvedFlags) {
    results[flag] = value;
  }
  
  return results;
}

/**
 * Get all feature flags for server-side rendering
 * Returns all flags with their current values
 */
export async function getAllServerFeatureFlags(): Promise<Record<FeatureFlag, boolean>> {
  const allFlags = Object.keys(FEATURE_FLAGS) as FeatureFlag[];
  return await getServerFeatureFlags(allFlags) as Record<FeatureFlag, boolean>;
}

/**
 * Feature flag context for SSR hydration
 * Pass this to client components to avoid hydration mismatches
 */
export interface FeatureFlagContext {
  flags: Record<FeatureFlag, boolean>;
  timestamp: number;
}

/**
 * Create feature flag context for client hydration
 */
export async function createFeatureFlagContext(): Promise<FeatureFlagContext> {
  const flags = await getAllServerFeatureFlags();
  
  return {
    flags,
    timestamp: Date.now(),
  };
}

/**
 * Development utilities for feature flag management
 */
export const FeatureFlagUtils = {
  /**
   * Get all available flags with their configuration
   */
  getAllFlags(): Record<FeatureFlag, typeof FEATURE_FLAGS[FeatureFlag]> {
    return FEATURE_FLAGS;
  },

  /**
   * Get current flag values from environment (server-side only)
   */
  getCurrentEnvValues(): Record<FeatureFlag, boolean> {
    const results: Record<string, boolean> = {};
    
    for (const [flag, config] of Object.entries(FEATURE_FLAGS)) {
      results[flag] = getEnvFlagValue(flag as FeatureFlag);
    }
    
    return results as Record<FeatureFlag, boolean>;
  },

  /**
   * Generate cookie override JavaScript for browser console
   * Useful for development testing
   */
  generateCookieOverride(flag: FeatureFlag, value: boolean): string {
    const config = FEATURE_FLAGS[flag];
    return `document.cookie = "${config.cookieKey}=${value}; path=/; max-age=86400";`;
  },

  /**
   * Generate all cookie overrides for testing
   */
  generateAllCookieOverrides(overrides: Partial<Record<FeatureFlag, boolean>>): string {
    const commands: string[] = [];
    
    for (const [flag, value] of Object.entries(overrides)) {
      if (typeof value === 'boolean') {
        commands.push(this.generateCookieOverride(flag as FeatureFlag, value));
      }
    }
    
    return commands.join(' ');
  },

  /**
   * Log current feature flag state (development only)
   */
  logCurrentState(): void {
    if (process.env.NODE_ENV !== 'development') return;
    
    console.group('🚩 Feature Flags Configuration');
    
    for (const [flag, config] of Object.entries(FEATURE_FLAGS)) {
      const envValue = getEnvFlagValue(flag as FeatureFlag);
      console.log(`${flag}: ${envValue} (env: ${config.envKey})`);
    }
    
    console.groupEnd();
  },
};

/**
 * Runtime feature flag validation
 */
export function validateFeatureFlag(flag: string): flag is FeatureFlag {
  return flag in FEATURE_FLAGS;
}

/**
 * Type-safe feature flag checker
 */
export function isValidFeatureFlag(flag: unknown): flag is FeatureFlag {
  return typeof flag === 'string' && validateFeatureFlag(flag);
}

/**
 * Feature flag middleware integration helper
 */
export interface FeatureFlagMiddlewareContext {
  flags: Record<FeatureFlag, boolean>;
  getFlag: (flag: FeatureFlag) => boolean;
  hasFlag: (flag: FeatureFlag) => boolean;
}

/**
 * Create middleware context for feature flags
 */
export async function createFeatureFlagMiddlewareContext(): Promise<FeatureFlagMiddlewareContext> {
  const flags = await getAllServerFeatureFlags();
  
  return {
    flags,
    getFlag: (flag: FeatureFlag) => flags[flag],
    hasFlag: (flag: FeatureFlag) => flags[flag] === true,
  };
}