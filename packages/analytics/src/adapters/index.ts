/**
 * Analytics Adapters
 * Export all available analytics adapters and their factory functions
 */

export { ConsoleAdapter, createConsoleAdapter } from './console';
export { PostHogAdapter, createPostHogAdapter, PostHogUtils } from './posthog';
export { 
  NoOpAdapter, 
  ServerSafeAdapter, 
  createNoOpAdapter, 
  createServerSafeAdapter,
  isServer,
  isClient 
} from './noop';

// Re-export types
export type { AnalyticsAdapter, AnalyticsConfig, AnalyticsContext } from '../types';