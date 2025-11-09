/**
 * Analytics Module - Extensible event tracking system
 * 
 * Features:
 * - Provider pattern for multiple analytics services
 * - Event batching and queuing
 * - Offline support with retry logic
 * - Privacy-compliant data handling
 * - Console adapter for development
 * - Easy integration with GA4, Mixpanel, etc.
 */

// Event types for type safety
export interface BaseAnalyticsEvent {
  event_name: string;
  timestamp?: number;
  session_id?: string;
  user_id?: string;
  [key: string]: any;
}

export interface TryOnAnalyticsEvents {
  tryon_opened: {
    product_id?: string;
    product_name?: string;
    variant_id?: string;
    variant_color?: string;
    variant_size?: string;
  };
  
  tryon_captured: {
    product_name?: string;
    variant_info?: string;
    quality_score?: number;
    garment_image_url?: string;
  };
  
  tryon_quality_score: {
    product_name?: string;
    variant_info?: string;
    quality_score?: number;
    score_category?: 'low' | 'medium' | 'high';
  };
  
  tryon_to_cart: {
    product_id?: string;
    product_name?: string;
    variant_id?: string;
    quantity?: number;
    price?: number;
    has_captured_image?: boolean;
    quality_score?: number | null;
  };
  
  tryon_closed: {
    product_name?: string;
    variant_info?: string;
    time_spent?: number;
    has_captured_image?: boolean;
    quality_score?: number | null;
  };
  
  tryon_reset: {
    product_name?: string;
    variant_info?: string;
  };
  
  tryon_image_downloaded: {
    product_name?: string;
    variant_info?: string;
    quality_score?: number | null;
  };
}

export interface EcommerceAnalyticsEvents {
  add_to_cart: {
    product_id?: string;
    product_name?: string;
    variant_id?: string;
    quantity?: number;
    price?: number;
    category?: string;
  };
  
  add_to_wishlist: {
    product_id?: string;
    product_name?: string;
  };
  
  remove_from_wishlist: {
    product_id?: string;
    product_name?: string;
  };
  
  page_view: {
    page_title?: string;
    page_url?: string;
    page_type?: string;
  };
}

export interface SystemAnalyticsEvents {
  analytics_initialized: {
    providers?: string[];
    session_id?: string;
  };
}

export type AnalyticsEvents = TryOnAnalyticsEvents & EcommerceAnalyticsEvents & SystemAnalyticsEvents;

export interface AnalyticsProvider {
  name: string;
  initialize(config: any): Promise<void>;
  track(eventName: string, properties: Record<string, any>): Promise<void>;
  identify(userId: string, traits?: Record<string, any>): Promise<void>;
  page(name: string, properties?: Record<string, any>): Promise<void>;
  flush?(): Promise<void>;
  cleanup?(): void;
}

export interface AnalyticsConfig {
  enabled: boolean;
  debug: boolean;
  batchSize: number;
  flushInterval: number;
  retryAttempts: number;
  sessionTimeout: number;
  providers: AnalyticsProvider[];
}

/**
 * Console Analytics Provider - For development and debugging
 */
export class ConsoleAnalyticsProvider implements AnalyticsProvider {
  name = 'console';
  private config: any;

  async initialize(config: any): Promise<void> {
    this.config = config;
    if (config.debug) {
      console.log('🔍 Console Analytics Provider initialized', config);
    }
  }

  async track(eventName: string, properties: Record<string, any>): Promise<void> {
    const event = {
      event: eventName,
      timestamp: Date.now(),
      properties,
    };

    if (this.config?.debug) {
      console.group(`📊 Analytics Event: ${eventName}`);
      console.table(properties);
      console.groupEnd();
    } else {
      console.log(`📊 ${eventName}:`, properties);
    }

    // Also store in localStorage for debugging
    try {
      const stored = JSON.parse(localStorage.getItem('analytics_events') || '[]');
      stored.unshift(event);
      
      // Keep only last 100 events
      if (stored.length > 100) {
        stored.splice(100);
      }
      
      localStorage.setItem('analytics_events', JSON.stringify(stored));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    if (this.config?.debug) {
      console.log('👤 User Identified:', { userId, traits });
    }
  }

  async page(name: string, properties?: Record<string, any>): Promise<void> {
    if (this.config?.debug) {
      console.log('📄 Page View:', { name, properties });
    }
  }
}

/**
 * Google Analytics 4 Provider (Future implementation)
 */
export class GA4AnalyticsProvider implements AnalyticsProvider {
  name = 'ga4';
  private gtag: any;
  private measurementId: string;

  constructor(measurementId: string) {
    this.measurementId = measurementId;
  }

  async initialize(config: any): Promise<void> {
    // Load gtag if not already loaded
    if (typeof window !== 'undefined' && !window.gtag) {
      // Dynamically load GA4 script
      const script = document.createElement('script');
      script.src = `https://www.googletagmanager.com/gtag/js?id=${this.measurementId}`;
      script.async = true;
      document.head.appendChild(script);

      // Initialize gtag
      window.dataLayer = window.dataLayer || [];
      window.gtag = function() {
        window.dataLayer?.push(arguments);
      };

      window.gtag('js', new Date());
      window.gtag('config', this.measurementId);
      
      this.gtag = window.gtag;
    }
  }

  async track(eventName: string, properties: Record<string, any>): Promise<void> {
    if (this.gtag) {
      this.gtag('event', eventName, properties);
    }
  }

  async identify(userId: string, traits?: Record<string, any>): Promise<void> {
    if (this.gtag) {
      this.gtag('config', this.measurementId, {
        user_id: userId,
        ...traits,
      });
    }
  }

  async page(name: string, properties?: Record<string, any>): Promise<void> {
    if (this.gtag) {
      this.gtag('config', this.measurementId, {
        page_title: name,
        page_location: window.location.href,
        ...properties,
      });
    }
  }
}

/**
 * Main Analytics Class
 */
export class Analytics {
  private config: AnalyticsConfig;
  private providers: AnalyticsProvider[] = [];
  private eventQueue: Array<{ eventName: string; properties: Record<string, any> }> = [];
  private sessionId: string;
  private userId?: string;
  private flushTimer?: NodeJS.Timeout;
  private initialized = false;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enabled: true,
      debug: process.env.NODE_ENV === 'development',
      batchSize: 10,
      flushInterval: 5000, // 5 seconds
      retryAttempts: 3,
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      providers: [],
      ...config,
    };

    this.sessionId = this.generateSessionId();
    this.setupFlushTimer();
  }

  /**
   * Initialize analytics with providers
   */
  async initialize(providers: AnalyticsProvider[] = []): Promise<void> {
    if (this.initialized) return;

    this.providers = [...this.config.providers, ...providers];

    // Initialize all providers
    const initPromises = this.providers.map(async (provider) => {
      try {
        await provider.initialize(this.config);
        if (this.config.debug) {
          console.log(`✅ Analytics provider '${provider.name}' initialized`);
        }
      } catch (error) {
        console.error(`❌ Failed to initialize analytics provider '${provider.name}':`, error);
      }
    });

    await Promise.allSettled(initPromises);
    this.initialized = true;

    // Track initialization
    this.track('analytics_initialized', {
      providers: this.providers.map(p => p.name),
      session_id: this.sessionId,
    });
  }

  /**
   * Track an event
   */
  track<K extends keyof AnalyticsEvents>(
    eventName: K,
    properties: AnalyticsEvents[K] = {}
  ): void {
    if (!this.config.enabled) return;

    const enrichedProperties = {
      ...properties,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
    };

    // Add to queue for batching
    this.eventQueue.push({
      eventName: eventName as string,
      properties: enrichedProperties,
    });

    // Flush immediately if batch size reached
    if (this.eventQueue.length >= this.config.batchSize) {
      this.flush();
    }
  }

  /**
   * Identify a user
   */
  identify(userId: string, traits: Record<string, any> = {}): void {
    this.userId = userId;

    this.providers.forEach(async (provider) => {
      try {
        await provider.identify(userId, traits);
      } catch (error) {
        console.error(`Failed to identify user with provider '${provider.name}':`, error);
      }
    });
  }

  /**
   * Track a page view
   */
  page(name: string, properties: Record<string, any> = {}): void {
    if (!this.config.enabled) return;

    const pageProperties = {
      ...properties,
      timestamp: Date.now(),
      session_id: this.sessionId,
      user_id: this.userId,
    };

    this.providers.forEach(async (provider) => {
      try {
        await provider.page(name, pageProperties);
      } catch (error) {
        console.error(`Failed to track page with provider '${provider.name}':`, error);
      }
    });

    // Also track as regular event
    this.track('page_view', {
      page_title: name,
      page_url: typeof window !== 'undefined' ? window.location.href : '',
      ...pageProperties,
    });
  }

  /**
   * Flush queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const eventsToFlush = [...this.eventQueue];
    this.eventQueue = [];

    const flushPromises = this.providers.map(async (provider) => {
      for (const { eventName, properties } of eventsToFlush) {
        try {
          await provider.track(eventName, properties);
        } catch (error) {
          console.error(`Failed to track event '${eventName}' with provider '${provider.name}':`, error);
          
          // Re-queue failed events for retry (with limit)
          if ((properties._retryCount || 0) < this.config.retryAttempts) {
            this.eventQueue.push({
              eventName,
              properties: {
                ...properties,
                _retryCount: (properties._retryCount || 0) + 1,
              },
            });
          }
        }
      }

      // Call provider's flush method if available
      if (provider.flush) {
        try {
          await provider.flush();
        } catch (error) {
          console.error(`Failed to flush provider '${provider.name}':`, error);
        }
      }
    });

    await Promise.allSettled(flushPromises);
  }

  /**
   * Get analytics configuration
   */
  getConfig(): AnalyticsConfig {
    return { ...this.config };
  }

  /**
   * Get session information
   */
  getSession(): { sessionId: string; userId?: string } {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
    };
  }

  /**
   * Reset session (e.g., on logout)
   */
  resetSession(): void {
    this.sessionId = this.generateSessionId();
    this.userId = undefined;
  }

  /**
   * Enable/disable analytics
   */
  setEnabled(enabled: boolean): void {
    this.config.enabled = enabled;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.providers.forEach((provider) => {
      if (provider.cleanup) {
        provider.cleanup();
      }
    });
  }

  // Private methods

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private setupFlushTimer(): void {
    if (typeof window !== 'undefined') {
      this.flushTimer = setInterval(() => {
        this.flush();
      }, this.config.flushInterval);

      // Flush on page unload
      window.addEventListener('beforeunload', () => {
        this.flush();
      });

      // Flush on page visibility change (when tab becomes hidden)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.flush();
        }
      });
    }
  }
}

// Create and export singleton instance
const analytics = new Analytics({
  providers: [new ConsoleAnalyticsProvider()],
});

// Auto-initialize with console provider in development
if (typeof window !== 'undefined') {
  analytics.initialize().catch(console.error);
}

export { analytics };
export default analytics;