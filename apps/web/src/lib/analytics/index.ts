/**
 * Analytics configuration and initialization for web app
 */

import {
  AnalyticsManager,
  createConsoleAdapter,
  createPostHogAdapter,
  createServerSafeAdapter,
  ContextBuilder,
  type AnalyticsAdapter,
} from '@radhagsareees/analytics';

/**
 * Create analytics manager for client-side usage
 */
export function createWebAnalytics(userId?: string): AnalyticsManager {
  const adapters: AnalyticsAdapter[] = [];

  // Console adapter for development
  if (process.env.NODE_ENV === 'development') {
    adapters.push(createConsoleAdapter({
      enabled: true,
      debug: true,
    }));
  }

  // PostHog adapter for production analytics
  if (process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    adapters.push(createPostHogAdapter({
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
      endpoint: process.env.NEXT_PUBLIC_POSTHOG_ENDPOINT,
      debug: process.env.NODE_ENV === 'development',
      enabled: true,
    }));
  }

  // Fallback to no-op if no adapters configured
  if (adapters.length === 0) {
    const { createNoOpAdapter } = require('@radhagsareees/analytics');
    adapters.push(createNoOpAdapter());
  }

  // Create context
  const context = ContextBuilder.createClientContext(userId);

  // Error handler
  const onError = (error: Error, adapterName: string, event?: any) => {
    console.error(`Analytics error in ${adapterName}:`, error);
    
    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.log('Analytics error:', { error: error.message, adapterName, event });
    }
  };

  return new AnalyticsManager({
    adapters,
    context,
    enableBatching: true,
    batchSize: 10,
    flushInterval: 30000, // 30 seconds
    onError,
  });
}

/**
 * Create analytics manager for server-side usage
 */
export function createServerAnalytics(request?: {
  headers?: Record<string, string>;
  ip?: string;
  userId?: string;
}): AnalyticsManager {
  const context = ContextBuilder.createServerContext(request);

  // Use server-safe adapter that works on both client and server
  const adapters = [
    createServerSafeAdapter(
      process.env.POSTHOG_API_KEY ? createPostHogAdapter({
        apiKey: process.env.POSTHOG_API_KEY,
        debug: false,
        enabled: true,
      }) : undefined
    ),
  ];

  return new AnalyticsManager({
    adapters,
    context,
    enableBatching: false, // Disable batching on server
    onError: (error: Error, adapterName: string, event?: any) => {
      console.error(`Server analytics error in ${adapterName}:`, error);
    },
  });
}

/**
 * Singleton analytics instance for client-side usage
 */
let clientAnalytics: AnalyticsManager | null = null;

export function getClientAnalytics(userId?: string): AnalyticsManager {
  if (!clientAnalytics) {
    clientAnalytics = createWebAnalytics(userId);
  } else if (userId) {
    // Update user context if provided
    clientAnalytics.updateContext({ userId });
  }
  
  return clientAnalytics;
}

/**
 * Initialize analytics on client side
 */
export async function initializeClientAnalytics(userId?: string): Promise<AnalyticsManager> {
  const analytics = getClientAnalytics(userId);
  await analytics.initialize();
  return analytics;
}

/**
 * Cleanup analytics (call on app unmount)
 */
export async function cleanupAnalytics(): Promise<void> {
  if (clientAnalytics) {
    await clientAnalytics.shutdown();
    clientAnalytics = null;
  }
}