/**
 * @radhagsarees/analytics
 * 
 * TypeScript-safe analytics package for Radha G Sarees e-commerce platform
 * 
 * Features:
 * - Type-safe event tracking with TypeScript
 * - Multiple analytics adapters (Console, PostHog, No-op)
 * - React hooks for easy integration
 * - Server-side rendering support
 * - Batch event processing
 * - Error handling and retry logic
 */

// Core analytics functionality
export { AnalyticsManager, createEvent } from './analytics';
import { AnalyticsManager } from './analytics';

// All event types and interfaces
export type {
  // Core types
  AnalyticsEvent,
  AnalyticsAdapter,
  AnalyticsConfig,
  AnalyticsContext,
  AnalyticsManagerConfig,
  EventName,
  EventProperties,
  BaseEventProperties,

  // Specific event types
  ViewProductEvent,
  AddToCartEvent,
  TryOnOpenedEvent,
  TryOnCapturedEvent,
  CheckoutStartedEvent,
  PurchaseEvent,
  SearchEvent,
  PageViewEvent,
  WishlistEvent,
  ReviewEvent,
  AdminEvent,
} from './types';

// Analytics adapters
export {
  // Console adapter
  ConsoleAdapter,
  createConsoleAdapter,
  
  // PostHog adapter
  PostHogAdapter,
  createPostHogAdapter,
  PostHogUtils,
  
  // No-op and server-safe adapters
  NoOpAdapter,
  ServerSafeAdapter,
  createNoOpAdapter,
  createServerSafeAdapter,
  isServer,
  isClient,
} from './adapters';

// React hooks (optional peer dependency)
export {
  AnalyticsProvider,
  useAnalytics,
  useTrackEvent,
  useEcommerceTracking,
  useTryOnTracking,
  usePageTracking,
  useUserTracking,
  useComponentTracking,
  useFormTracking,
  useSearchTracking,
  useBatchTracking,
  withAnalytics,
} from './hooks';

// Event utilities
export {
  ProductTracking,
  TryOnTracking,
  EcommerceTracking,
  SessionUtils,
  ContextBuilder,
  PerformanceUtils,
} from './utils';

// Utility functions and constants
export const ANALYTICS_EVENTS = {
  // E-commerce events
  VIEW_PRODUCT: 'view_product' as const,
  ADD_TO_CART: 'add_to_cart' as const,
  CHECKOUT_STARTED: 'checkout_started' as const,
  PURCHASE: 'purchase' as const,
  
  // Try-on events
  TRYON_OPENED: 'tryon_opened' as const,
  TRYON_CAPTURED: 'tryon_captured' as const,
  
  // Navigation events
  PAGE_VIEW: 'page_view' as const,
  SEARCH: 'search' as const,
  
  // User events
  WISHLIST_ADD: 'wishlist_add' as const,
  WISHLIST_REMOVE: 'wishlist_remove' as const,
  REVIEW_SUBMITTED: 'review_submitted' as const,
  REVIEW_HELPFUL: 'review_helpful' as const,
  
  // Admin events
  ADMIN_ACTION: 'admin_action' as const,
} as const;

/**
 * Default analytics configuration
 */
export const DEFAULT_CONFIG = {
  enableBatching: true,
  batchSize: 10,
  flushInterval: 30000, // 30 seconds
  timeout: 30000,
  retries: 3,
} as const;

/**
 * Utility to create analytics manager with common configuration
 */
export function createAnalyticsManager(options: {
  adapters: Array<any>; // AnalyticsAdapter but avoiding circular import
  context: {
    userId?: string;
    sessionId: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    source?: 'web' | 'admin' | 'api';
    userAgent?: string;
    referrer?: string;
  };
  config?: {
    enableBatching?: boolean;
    batchSize?: number;
    flushInterval?: number;
    onError?: (error: Error, adapter: string, event?: any) => void;
  };
}): AnalyticsManager {
  const context = {
    deviceType: 'desktop' as const,
    source: 'web' as const,
    ...options.context,
  };

  const config = {
    ...DEFAULT_CONFIG,
    ...options.config,
    adapters: options.adapters,
    context,
  };

  return new AnalyticsManager(config);
}

/**
 * Quick setup function for common use cases
 */
export function setupAnalytics(options: {
  console?: boolean;
  posthog?: {
    apiKey: string;
    endpoint?: string;
    debug?: boolean;
  };
  context: {
    userId?: string;
    sessionId: string;
    deviceType?: 'desktop' | 'mobile' | 'tablet';
    source?: 'web' | 'admin' | 'api';
  };
}): AnalyticsManager {
  const adapters: any[] = [];

  // Add console adapter if requested
  if (options.console) {
    const { createConsoleAdapter } = require('./adapters/console');
    adapters.push(createConsoleAdapter({ enabled: true, debug: true }));
  }

  // Add PostHog adapter if configured
  if (options.posthog) {
    const { createPostHogAdapter } = require('./adapters/posthog');
    adapters.push(createPostHogAdapter(options.posthog));
  }

  // Add no-op adapter if no other adapters (safe fallback)
  if (adapters.length === 0) {
    const { createNoOpAdapter } = require('./adapters/noop');
    adapters.push(createNoOpAdapter());
  }

  return createAnalyticsManager({
    adapters,
    context: options.context,
  });
}