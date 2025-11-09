import * as React from 'react';
import type { 
  AnalyticsAdapter, 
  AnalyticsConfig, 
  AnalyticsContext, 
  EventName, 
  EventProperties 
} from '../types';

// Lazy import PostHog to handle SSR
let posthog: any = null;
const loadPostHog = async () => {
  if (typeof window !== 'undefined' && !posthog) {
    const { default: ph } = await import('posthog-js');
    posthog = ph;
  }
  return posthog;
};

/**
 * PostHog Analytics Adapter
 * Sends analytics events to PostHog for product analytics and feature flags
 */
export class PostHogAdapter implements AnalyticsAdapter {
  readonly name = 'posthog';
  private config: PostHogConfig = { enabled: false };
  private context: AnalyticsContext | null = null;
  private isPostHogReady = false;

  get isEnabled(): boolean {
    return this.config.enabled && !!this.config.apiKey;
  }

  /**
   * Initialize PostHog
   */
  async initialize(config: AnalyticsConfig, context: AnalyticsContext): Promise<void> {
    this.config = { ...config, enabled: true } as PostHogConfig;
    this.context = context;

    if (!this.config.apiKey) {
      console.warn('PostHog API key not provided, adapter disabled');
      this.config.enabled = false;
      return;
    }

    try {
      // Load PostHog if not already loaded
      posthog = await loadPostHog();
      
      if (!posthog) {
        console.warn('PostHog could not be loaded (likely SSR)');
        this.config.enabled = false;
        return;
      }

      // Initialize PostHog
      posthog.init(this.config.apiKey, {
        api_host: this.config.endpoint || 'https://app.posthog.com',
        debug: this.config.debug ?? false,
        capture_pageview: false, // We'll handle this manually
        capture_pageleave: true,
        session_recording: {
          recordCrossOriginIframes: false,
        },
        autocapture: {
          css_selector_allowlist: [
            '[data-track]',
            '.analytics-track',
          ],
        },
        // Privacy settings
        respect_dnt: true,
        opt_out_capturing_by_default: false,
        // Performance settings
        batch_size: this.config.batchSize || 10,
        request_timeout_ms: this.config.timeout || 30000,
      });

      // Set initial properties
      if (context.userId) {
        posthog.identify(context.userId, {
          device_type: context.deviceType,
          source: context.source,
          user_agent: context.userAgent,
          referrer: context.referrer,
          ...context.userProperties,
        });
      }

      // Set super properties (sent with every event)
      posthog.register({
        device_type: context.deviceType,
        source: context.source,
        session_id: context.sessionId,
        app_version: process.env.NEXT_PUBLIC_APP_VERSION,
        environment: process.env.NODE_ENV,
      });

      this.isPostHogReady = true;
      
      if (this.config.debug) {
        console.log('PostHog Analytics Adapter initialized');
      }

    } catch (error) {
      console.error('Failed to initialize PostHog:', error);
      this.config.enabled = false;
    }
  }

  /**
   * Track an event with PostHog
   */
  async track<T extends EventName>(event: T, properties: EventProperties<T>): Promise<void> {
    if (!this.isEnabled || !this.isPostHogReady) {
      if (this.config.debug) {
        console.warn('PostHog not ready, skipping event:', event);
      }
      return;
    }

    try {
      // Transform properties for PostHog
      const postHogProperties = this.transformProperties(properties);
      
      // Add context properties
      const enrichedProperties = {
        ...postHogProperties,
        timestamp: Date.now(),
        session_id: this.context?.sessionId,
        device_type: this.context?.deviceType,
        source: this.context?.source,
      };

      posthog.capture(event, enrichedProperties);

      if (this.config.debug) {
        console.log('PostHog event sent:', { event, properties: enrichedProperties });
      }

    } catch (error) {
      console.error('PostHog track error:', error);
    }
  }

  /**
   * Identify a user in PostHog
   */
  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled || !this.isPostHogReady) return;

    try {
      const userProperties = {
        ...properties,
        device_type: this.context?.deviceType,
        source: this.context?.source,
        first_seen: new Date().toISOString(),
      };

      posthog.identify(userId, userProperties);

      if (this.context) {
        this.context.userId = userId;
      }

      if (this.config.debug) {
        console.log('PostHog user identified:', { userId, properties: userProperties });
      }

    } catch (error) {
      console.error('PostHog identify error:', error);
    }
  }

  /**
   * Group a user in PostHog
   */
  async group(groupId: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled || !this.isPostHogReady) return;

    try {
      // PostHog groups require a group type
      const groupType = properties?.type || 'company';
      
      posthog.group(groupType, groupId, {
        ...properties,
        group_type: groupType,
      });

      if (this.config.debug) {
        console.log('PostHog group set:', { groupType, groupId, properties });
      }

    } catch (error) {
      console.error('PostHog group error:', error);
    }
  }

  /**
   * Track a page view in PostHog
   */
  async page(name: string, properties?: Record<string, any>): Promise<void> {
    if (!this.isEnabled || !this.isPostHogReady) return;

    try {
      const pageProperties = {
        ...properties,
        page_name: name,
        timestamp: Date.now(),
      };

      posthog.capture('$pageview', pageProperties);

      if (this.config.debug) {
        console.log('PostHog pageview:', { name, properties: pageProperties });
      }

    } catch (error) {
      console.error('PostHog page error:', error);
    }
  }

  /**
   * Flush PostHog events
   */
  async flush(): Promise<void> {
    if (!this.isEnabled || !this.isPostHogReady) return;

    try {
      // PostHog doesn't have a public flush method, but we can force send
      // This is a workaround using private API
      if ((posthog as any)._send_queued_events) {
        (posthog as any)._send_queued_events();
      }
    } catch (error) {
      console.error('PostHog flush error:', error);
    }
  }

  /**
   * Shutdown PostHog
   */
  async shutdown(): Promise<void> {
    if (this.isPostHogReady) {
      try {
        await this.flush();
        // PostHog doesn't have a proper shutdown method
        // We'll just mark as not ready
        this.isPostHogReady = false;
        
        if (this.config.debug) {
          console.log('PostHog adapter shutdown');
        }
      } catch (error) {
        console.error('PostHog shutdown error:', error);
      }
    }
  }

  /**
   * Get feature flag value
   */
  getFeatureFlag(key: string, defaultValue?: any): any {
    if (!this.isEnabled || !this.isPostHogReady) {
      return defaultValue;
    }

    try {
      return posthog.getFeatureFlag(key) || defaultValue;
    } catch (error) {
      console.error('PostHog feature flag error:', error);
      return defaultValue;
    }
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(key: string): boolean {
    if (!this.isEnabled || !this.isPostHogReady) {
      return false;
    }

    try {
      return posthog.isFeatureEnabled(key);
    } catch (error) {
      console.error('PostHog feature flag check error:', error);
      return false;
    }
  }

  /**
   * Reload feature flags
   */
  async reloadFeatureFlags(): Promise<void> {
    if (!this.isEnabled || !this.isPostHogReady) return;

    try {
      posthog.reloadFeatureFlags();
    } catch (error) {
      console.error('PostHog reload feature flags error:', error);
    }
  }

  /**
   * Transform properties for PostHog compatibility
   */
  private transformProperties(properties: any): Record<string, any> {
    const transformed: Record<string, any> = {};

    for (const [key, value] of Object.entries(properties)) {
      // PostHog prefers snake_case
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      
      // Handle different data types
      if (value === null || value === undefined) {
        transformed[snakeKey] = null;
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // Flatten nested objects
        transformed[snakeKey] = JSON.stringify(value);
      } else {
        transformed[snakeKey] = value;
      }
    }

    return transformed;
  }
}

/**
 * Extended configuration for PostHog
 */
interface PostHogConfig extends AnalyticsConfig {
  apiKey?: string;
}

/**
 * Factory function to create a PostHog adapter
 */
export function createPostHogAdapter(config: {
  apiKey: string;
  endpoint?: string;
  debug?: boolean;
  enabled?: boolean;
}): PostHogAdapter {
  const adapter = new PostHogAdapter();
  return adapter;
}

/**
 * PostHog utilities for React components
 */
export const PostHogUtils = {
  /**
   * Track click event with PostHog
   */
  trackClick: (element: HTMLElement, eventName: string, properties?: Record<string, any>) => {
    element.addEventListener('click', () => {
      if (posthog) {
        posthog.capture(eventName, properties);
      }
    });
  },

  /**
   * Add PostHog tracking attributes to element
   */
  addTrackingAttributes: (element: HTMLElement, eventName: string, properties?: Record<string, any>) => {
    element.setAttribute('data-track', eventName);
    if (properties) {
      element.setAttribute('data-track-properties', JSON.stringify(properties));
    }
  },

  /**
   * Create a tracking decorator for React components
   */
  withTracking: <T extends Record<string, any>>(
    Component: React.ComponentType<T>,
    eventName: string,
    getProperties?: (props: T) => Record<string, any>
  ): React.ComponentType<T> => {
    return (props: T) => {
      React.useEffect(() => {
        const properties = getProperties ? getProperties(props) : {};
        posthog.capture(eventName, properties);
      }, []);

      return React.createElement(Component, props);
    };
  },
};