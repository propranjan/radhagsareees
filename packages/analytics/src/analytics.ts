import type {
  AnalyticsAdapter,
  AnalyticsManagerConfig,
  EventName,
  EventProperties,
  AnalyticsEvent,
  BaseEventProperties,
  AnalyticsContext,
  ViewProductEvent,
  AddToCartEvent,
  TryOnOpenedEvent,
  TryOnCapturedEvent,
  CheckoutStartedEvent,
  PurchaseEvent
} from './types';

/**
 * Core Analytics Manager
 * Manages multiple analytics adapters and provides a unified interface
 */
export class AnalyticsManager {
  private adapters: AnalyticsAdapter[] = [];
  private context: AnalyticsContext;
  private isInitialized = false;
  private eventQueue: AnalyticsEvent[] = [];
  private batchTimer?: NodeJS.Timeout;
  private config: Required<Pick<AnalyticsManagerConfig, 'enableBatching' | 'batchSize' | 'flushInterval'>> & 
                  Pick<AnalyticsManagerConfig, 'onError'>;

  constructor(config: AnalyticsManagerConfig) {
    this.adapters = config.adapters;
    this.context = config.context;
    this.config = {
      enableBatching: config.enableBatching ?? true,
      batchSize: config.batchSize ?? 10,
      flushInterval: config.flushInterval ?? 30000, // 30 seconds
      onError: config.onError,
    };
  }

  /**
   * Initialize all adapters
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.warn('Analytics manager already initialized');
      return;
    }

    const initPromises = this.adapters.map(async (adapter) => {
      try {
        await adapter.initialize(
          { enabled: adapter.isEnabled },
          this.context
        );
        console.log(`Analytics adapter initialized: ${adapter.name}`);
      } catch (error) {
        console.error(`Failed to initialize ${adapter.name}:`, error);
        this.handleError(error as Error, adapter.name);
      }
    });

    await Promise.allSettled(initPromises);
    this.isInitialized = true;

    // Start batch timer if batching is enabled
    if (this.config.enableBatching) {
      this.startBatchTimer();
    }

    console.log('Analytics manager initialized');
  }

  /**
   * Track an event with type-safe properties
   */
  async track<T extends EventName>(
    event: T,
    properties: EventProperties<T>,
    options?: {
      timestamp?: number;
      userId?: string;
      flush?: boolean;
    }
  ): Promise<void> {
    if (!this.isInitialized) {
      console.warn('Analytics not initialized, queuing event');
    }

    const baseProperties: BaseEventProperties = {
      timestamp: options?.timestamp ?? Date.now(),
      sessionId: this.context.sessionId,
      userId: options?.userId ?? this.context.userId,
      deviceType: this.context.deviceType,
      source: this.context.source,
      userAgent: this.context.userAgent,
      referrer: this.context.referrer,
    };

    const fullEvent = {
      event,
      ...baseProperties,
      properties,
    } as AnalyticsEvent;

    if (this.config.enableBatching && !options?.flush) {
      this.eventQueue.push(fullEvent);
      
      if (this.eventQueue.length >= this.config.batchSize) {
        await this.flush();
      }
    } else {
      await this.sendToAdapters(event, properties);
    }
  }

  /**
   * Identify a user
   */
  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    this.context.userId = userId;
    
    const promises = this.adapters.map(async (adapter) => {
      try {
        await adapter.identify(userId, properties);
      } catch (error) {
        console.error(`Error in ${adapter.name}.identify:`, error);
        this.handleError(error as Error, adapter.name);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Group a user
   */
  async group(groupId: string, properties?: Record<string, any>): Promise<void> {
    const promises = this.adapters.map(async (adapter) => {
      try {
        await adapter.group(groupId, properties);
      } catch (error) {
        console.error(`Error in ${adapter.name}.group:`, error);
        this.handleError(error as Error, adapter.name);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Track a page view
   */
  async page(name: string, properties?: Record<string, any>): Promise<void> {
    const promises = this.adapters.map(async (adapter) => {
      try {
        await adapter.page(name, properties);
      } catch (error) {
        console.error(`Error in ${adapter.name}.page:`, error);
        this.handleError(error as Error, adapter.name);
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Flush all queued events
   */
  async flush(): Promise<void> {
    if (this.eventQueue.length === 0) return;

    const events = [...this.eventQueue];
    this.eventQueue = [];

    const promises = events.map(async (event) => {
      await this.sendToAdapters(event.event, event.properties);
    });

    await Promise.allSettled(promises);

    // Flush all adapters
    const flushPromises = this.adapters.map(async (adapter) => {
      try {
        await adapter.flush();
      } catch (error) {
        console.error(`Error flushing ${adapter.name}:`, error);
        this.handleError(error as Error, adapter.name);
      }
    });

    await Promise.allSettled(flushPromises);
  }

  /**
   * Update context (e.g., when user logs in)
   */
  updateContext(updates: Partial<AnalyticsContext>): void {
    this.context = { ...this.context, ...updates };
  }

  /**
   * Add a new adapter
   */
  addAdapter(adapter: AnalyticsAdapter): void {
    this.adapters.push(adapter);
    
    if (this.isInitialized) {
      const initResult = adapter.initialize({ enabled: adapter.isEnabled }, this.context);
      if (initResult instanceof Promise) {
        initResult.catch((error) => {
          console.error(`Failed to initialize ${adapter.name}:`, error);
          this.handleError(error as Error, adapter.name);
        });
      }
    }
  }

  /**
   * Remove an adapter
   */
  removeAdapter(adapterName: string): void {
    const index = this.adapters.findIndex(adapter => adapter.name === adapterName);
    if (index > -1) {
      const adapter = this.adapters[index];
      this.adapters.splice(index, 1);
      
      const shutdownResult = adapter.shutdown?.();
      if (shutdownResult instanceof Promise) {
        shutdownResult.catch((error) => {
          console.error(`Error shutting down ${adapter.name}:`, error);
        });
      }
    }
  }

  /**
   * Get adapter by name
   */
  getAdapter(name: string): AnalyticsAdapter | undefined {
    return this.adapters.find(adapter => adapter.name === name);
  }

  /**
   * Shutdown all adapters and cleanup
   */
  async shutdown(): Promise<void> {
    // Clear batch timer
    if (this.batchTimer) {
      clearInterval(this.batchTimer);
    }

    // Flush remaining events
    await this.flush();

    // Shutdown all adapters
    const shutdownPromises = this.adapters.map(async (adapter) => {
      try {
        await adapter.shutdown?.();
      } catch (error) {
        console.error(`Error shutting down ${adapter.name}:`, error);
      }
    });

    await Promise.allSettled(shutdownPromises);
    this.isInitialized = false;
    console.log('Analytics manager shutdown complete');
  }

  /**
   * Send event to all adapters
   */
  private async sendToAdapters<T extends EventName>(
    event: T,
    properties: EventProperties<T>
  ): Promise<void> {
    const promises = this.adapters.map(async (adapter) => {
      try {
        await adapter.track(event, properties);
      } catch (error) {
        console.error(`Error in ${adapter.name}.track:`, error);
        this.handleError(error as Error, adapter.name, { event, properties });
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Start batch timer for periodic flushing
   */
  private startBatchTimer(): void {
    this.batchTimer = setInterval(() => {
      if (this.eventQueue.length > 0) {
        this.flush().catch((error) => {
          console.error('Error during batch flush:', error);
        });
      }
    }, this.config.flushInterval);
  }

  /**
   * Handle errors with optional callback
   */
  private handleError(error: Error, adapterName: string, event?: any): void {
    if (this.config.onError) {
      try {
        this.config.onError(error, adapterName, event);
      } catch (callbackError) {
        console.error('Error in error handler:', callbackError);
      }
    }
  }
}

/**
 * Utility functions for creating events with proper typing
 */
export const createEvent = {
  viewProduct: (properties: EventProperties<'view_product'>): Pick<ViewProductEvent, 'event' | 'properties'> => ({
    event: 'view_product',
    properties,
  }),

  addToCart: (properties: EventProperties<'add_to_cart'>): Pick<AddToCartEvent, 'event' | 'properties'> => ({
    event: 'add_to_cart',
    properties,
  }),

  tryOnOpened: (properties: EventProperties<'tryon_opened'>): Pick<TryOnOpenedEvent, 'event' | 'properties'> => ({
    event: 'tryon_opened',
    properties,
  }),

  tryOnCaptured: (properties: EventProperties<'tryon_captured'>): Pick<TryOnCapturedEvent, 'event' | 'properties'> => ({
    event: 'tryon_captured',
    properties,
  }),

  checkoutStarted: (properties: EventProperties<'checkout_started'>): Pick<CheckoutStartedEvent, 'event' | 'properties'> => ({
    event: 'checkout_started',
    properties,
  }),

  purchase: (properties: EventProperties<'purchase'>): Pick<PurchaseEvent, 'event' | 'properties'> => ({
    event: 'purchase',
    properties,
  }),
};

// Re-export types for convenience
export type {
  AnalyticsAdapter,
  AnalyticsEvent,
  EventName,
  EventProperties,
  AnalyticsContext,
  AnalyticsConfig,
  ViewProductEvent,
  AddToCartEvent,
  TryOnOpenedEvent,
  TryOnCapturedEvent,
  CheckoutStartedEvent,
  PurchaseEvent,
} from './types';