import type { 
  AnalyticsAdapter, 
  AnalyticsConfig, 
  AnalyticsContext, 
  EventName, 
  EventProperties 
} from '../types';

/**
 * No-Op Analytics Adapter for Server-Side Rendering
 * Provides a safe adapter that does nothing when used on the server
 */
export class NoOpAdapter implements AnalyticsAdapter {
  readonly name = 'noop';
  private _isEnabled = false;

  get isEnabled(): boolean {
    return this._isEnabled;
  }

  /**
   * Initialize (no-op)
   */
  initialize(config: AnalyticsConfig, context: AnalyticsContext): void {
    this._isEnabled = config.enabled;
    
    if (config.debug) {
      console.log('No-Op Analytics Adapter initialized (server-side safe)');
    }
  }

  /**
   * Track an event (no-op)
   */
  track<T extends EventName>(event: T, properties: EventProperties<T>): void {
    // No operation - safe for SSR
  }

  /**
   * Identify a user (no-op)
   */
  identify(userId: string, properties?: Record<string, any>): void {
    // No operation - safe for SSR
  }

  /**
   * Group a user (no-op)
   */
  group(groupId: string, properties?: Record<string, any>): void {
    // No operation - safe for SSR
  }

  /**
   * Track a page view (no-op)
   */
  page(name: string, properties?: Record<string, any>): void {
    // No operation - safe for SSR
  }

  /**
   * Flush (no-op)
   */
  flush(): void {
    // No operation - safe for SSR
  }

  /**
   * Shutdown (no-op)
   */
  shutdown(): void {
    this._isEnabled = false;
  }
}

/**
 * Server-Safe Analytics Adapter
 * Automatically chooses no-op on server, real adapter on client
 */
export class ServerSafeAdapter implements AnalyticsAdapter {
  readonly name = 'server-safe';
  private adapter: AnalyticsAdapter;
  private clientAdapter?: AnalyticsAdapter;
  
  constructor(clientAdapter?: AnalyticsAdapter) {
    // Use no-op by default, switch to client adapter when available
    this.adapter = new NoOpAdapter();
    this.clientAdapter = clientAdapter;
  }

  get isEnabled(): boolean {
    return this.adapter.isEnabled;
  }

  /**
   * Initialize - switches to client adapter if in browser
   */
  async initialize(config: AnalyticsConfig, context: AnalyticsContext): Promise<void> {
    // Check if we're in a browser environment
    if (typeof window !== 'undefined' && this.clientAdapter) {
      this.adapter = this.clientAdapter;
    }

    // Initialize the chosen adapter
    const result = this.adapter.initialize(config, context);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Track an event
   */
  async track<T extends EventName>(event: T, properties: EventProperties<T>): Promise<void> {
    const result = this.adapter.track(event, properties);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Identify a user
   */
  async identify(userId: string, properties?: Record<string, any>): Promise<void> {
    const result = this.adapter.identify(userId, properties);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Group a user
   */
  async group(groupId: string, properties?: Record<string, any>): Promise<void> {
    const result = this.adapter.group(groupId, properties);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Track a page view
   */
  async page(name: string, properties?: Record<string, any>): Promise<void> {
    const result = this.adapter.page(name, properties);
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Flush events
   */
  async flush(): Promise<void> {
    const result = this.adapter.flush();
    if (result instanceof Promise) {
      await result;
    }
  }

  /**
   * Shutdown
   */
  async shutdown(): Promise<void> {
    const result = this.adapter.shutdown();
    if (result instanceof Promise) {
      await result;
    }
  }
}

/**
 * Factory function to create a no-op adapter
 */
export function createNoOpAdapter(): NoOpAdapter {
  return new NoOpAdapter();
}

/**
 * Factory function to create a server-safe adapter
 */
export function createServerSafeAdapter(clientAdapter?: AnalyticsAdapter): ServerSafeAdapter {
  return new ServerSafeAdapter(clientAdapter);
}

/**
 * Utility to detect if code is running on server
 */
export function isServer(): boolean {
  return typeof window === 'undefined';
}

/**
 * Utility to detect if code is running on client
 */
export function isClient(): boolean {
  return typeof window !== 'undefined';
}