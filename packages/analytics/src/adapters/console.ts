import type { 
  AnalyticsAdapter, 
  AnalyticsConfig, 
  AnalyticsContext, 
  EventName, 
  EventProperties 
} from '../types';

/**
 * Console Analytics Adapter
 * Outputs analytics events to the console for debugging and development
 */
export class ConsoleAdapter implements AnalyticsAdapter {
  readonly name = 'console';
  private config: AnalyticsConfig = { enabled: false };
  private context: AnalyticsContext | null = null;
  private startTime = Date.now();

  get isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Initialize the console adapter
   */
  initialize(config: AnalyticsConfig, context: AnalyticsContext): void {
    this.config = { enabled: true, debug: true, ...config };
    this.context = context;
    
    if (this.config.debug) {
      console.log('🔍 Console Analytics Adapter initialized');
      console.log('📊 Context:', context);
    }
  }

  /**
   * Track an event with console output
   */
  track<T extends EventName>(event: T, properties: EventProperties<T>): void {
    if (!this.isEnabled) return;

    const timestamp = new Date().toISOString();
    const sessionTime = Date.now() - this.startTime;
    
    // Create formatted output
    const eventData = {
      event,
      timestamp,
      sessionTime: `${(sessionTime / 1000).toFixed(1)}s`,
      context: this.context,
      properties,
    };

    // Color-coded console output based on event type
    const eventColor = this.getEventColor(event);
    const eventIcon = this.getEventIcon(event);
    
    console.group(`${eventIcon} ${event.toUpperCase()}`);
    console.log(`%c${event}`, `color: ${eventColor}; font-weight: bold;`);
    console.log('⏱️  Timestamp:', timestamp);
    console.log('🕒 Session Time:', eventData.sessionTime);
    
    if (this.context?.userId) {
      console.log('👤 User ID:', this.context.userId);
    }
    
    console.log('📱 Device:', this.context?.deviceType);
    console.log('🌐 Source:', this.context?.source);
    
    // Pretty print properties
    console.log('📋 Properties:');
    console.table(properties);
    
    if (this.config.debug) {
      console.log('🔍 Full Event Data:', eventData);
    }
    
    console.groupEnd();
  }

  /**
   * Identify a user
   */
  identify(userId: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    console.group('👤 USER IDENTIFIED');
    console.log(`%cUser ID: ${userId}`, 'color: #4CAF50; font-weight: bold;');
    
    if (properties && Object.keys(properties).length > 0) {
      console.log('📋 User Properties:');
      console.table(properties);
    }
    
    if (this.context) {
      this.context.userId = userId;
      console.log('✅ Context updated with user ID');
    }
    
    console.groupEnd();
  }

  /**
   * Group a user
   */
  group(groupId: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    console.group('👥 USER GROUPED');
    console.log(`%cGroup ID: ${groupId}`, 'color: #2196F3; font-weight: bold;');
    
    if (properties && Object.keys(properties).length > 0) {
      console.log('📋 Group Properties:');
      console.table(properties);
    }
    
    console.groupEnd();
  }

  /**
   * Track a page view
   */
  page(name: string, properties?: Record<string, any>): void {
    if (!this.isEnabled) return;

    console.group('📄 PAGE VIEW');
    console.log(`%cPage: ${name}`, 'color: #FF9800; font-weight: bold;');
    
    if (properties && Object.keys(properties).length > 0) {
      console.log('📋 Page Properties:');
      console.table(properties);
    }
    
    console.groupEnd();
  }

  /**
   * Flush (no-op for console adapter)
   */
  flush(): void {
    if (this.config.debug) {
      console.log('🔍 Console adapter flush (no-op)');
    }
  }

  /**
   * Shutdown the adapter
   */
  shutdown(): void {
    if (this.config.debug) {
      console.log('🔍 Console Analytics Adapter shutdown');
    }
    
    this.config.enabled = false;
    this.context = null;
  }

  /**
   * Get color for event type
   */
  private getEventColor(event: EventName): string {
    const colorMap: Record<string, string> = {
      // E-commerce events
      'view_product': '#4CAF50',
      'add_to_cart': '#FF9800',
      'checkout_started': '#2196F3',
      'purchase': '#9C27B0',
      
      // Try-on events
      'tryon_opened': '#00BCD4',
      'tryon_captured': '#FF5722',
      
      // Navigation events
      'page_view': '#607D8B',
      'search': '#795548',
      
      // User events
      'wishlist_add': '#E91E63',
      'wishlist_remove': '#F44336',
      'review_submitted': '#8BC34A',
      
      // Admin events
      'admin_action': '#3F51B5',
    };

    return colorMap[event] || '#666666';
  }

  /**
   * Get icon for event type
   */
  private getEventIcon(event: EventName): string {
    const iconMap: Record<string, string> = {
      // E-commerce events
      'view_product': '👁️',
      'add_to_cart': '🛒',
      'checkout_started': '💳',
      'purchase': '✅',
      
      // Try-on events
      'tryon_opened': '📱',
      'tryon_captured': '📸',
      
      // Navigation events
      'page_view': '📄',
      'search': '🔍',
      
      // User events
      'wishlist_add': '❤️',
      'wishlist_remove': '💔',
      'review_submitted': '⭐',
      
      // Admin events
      'admin_action': '⚙️',
    };

    return iconMap[event] || '📊';
  }
}

/**
 * Factory function to create a console adapter
 */
export function createConsoleAdapter(options?: { 
  enabled?: boolean; 
  debug?: boolean; 
}): ConsoleAdapter {
  const adapter = new ConsoleAdapter();
  
  if (options?.enabled !== undefined || options?.debug !== undefined) {
    // Pre-configure if options provided
    adapter.initialize(
      { 
        enabled: options?.enabled ?? true, 
        debug: options?.debug ?? true 
      }, 
      {
        sessionId: 'console-session',
        deviceType: 'desktop',
        source: 'web'
      }
    );
  }
  
  return adapter;
}