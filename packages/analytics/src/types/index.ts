/**
 * Analytics Event Types for Radha G Sarees E-commerce Platform
 */

// Base event properties that all events inherit
export interface BaseEventProperties {
  timestamp: number;
  sessionId: string;
  userId?: string;
  deviceType?: 'desktop' | 'mobile' | 'tablet';
  source?: 'web' | 'admin' | 'api';
  userAgent?: string;
  referrer?: string;
}

// Product-related events
export interface ViewProductEvent extends BaseEventProperties {
  event: 'view_product';
  properties: {
    productId: string;
    productName: string;
    category: string;
    subcategory?: string;
    price: number;
    currency: string;
    brand?: string;
    isOnSale?: boolean;
    salePrice?: number;
    images?: string[];
    tags?: string[];
    source?: 'catalog' | 'search' | 'recommendation' | 'direct';
  };
}

export interface AddToCartEvent extends BaseEventProperties {
  event: 'add_to_cart';
  properties: {
    productId: string;
    productName: string;
    category: string;
    price: number;
    currency: string;
    quantity: number;
    cartTotal: number;
    cartItemCount: number;
    variant?: string;
    size?: string;
    color?: string;
    source?: 'product_page' | 'catalog' | 'recommendation';
  };
}

// Try-on related events
export interface TryOnOpenedEvent extends BaseEventProperties {
  event: 'tryon_opened';
  properties: {
    productId: string;
    productName: string;
    category: string;
    price: number;
    currency: string;
    tryOnType: 'virtual' | 'ar';
    deviceCapabilities: {
      hasCamera: boolean;
      hasWebGL: boolean;
      supportsMediaDevices: boolean;
    };
    loadTime?: number;
  };
}

export interface TryOnCapturedEvent extends BaseEventProperties {
  event: 'tryon_captured';
  properties: {
    productId: string;
    productName: string;
    category: string;
    price: number;
    currency: string;
    tryOnType: 'virtual' | 'ar';
    captureMethod: 'photo' | 'video';
    processingTime: number;
    qualityScore?: number;
    adjustments?: {
      brightness?: number;
      contrast?: number;
      saturation?: number;
      position?: { x: number; y: number };
      scale?: number;
    };
    shared?: boolean;
    saved?: boolean;
  };
}

// E-commerce funnel events
export interface CheckoutStartedEvent extends BaseEventProperties {
  event: 'checkout_started';
  properties: {
    cartTotal: number;
    currency: string;
    itemCount: number;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      quantity: number;
      variant?: string;
    }>;
    couponCode?: string;
    discountAmount?: number;
    shippingMethod?: string;
    paymentMethod?: string;
  };
}

export interface PurchaseEvent extends BaseEventProperties {
  event: 'purchase';
  properties: {
    orderId: string;
    revenue: number;
    currency: string;
    tax?: number;
    shipping?: number;
    couponCode?: string;
    discountAmount?: number;
    paymentMethod: string;
    shippingMethod: string;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      quantity: number;
      variant?: string;
    }>;
    customerType?: 'new' | 'returning';
    loyaltyPoints?: number;
  };
}

// Search and navigation events
export interface SearchEvent extends BaseEventProperties {
  event: 'search';
  properties: {
    query: string;
    category?: string;
    filters?: Record<string, string | number | boolean>;
    resultsCount: number;
    source?: 'header' | 'catalog' | 'autocomplete';
  };
}

export interface PageViewEvent extends BaseEventProperties {
  event: 'page_view';
  properties: {
    page: string;
    title: string;
    path: string;
    category?: string;
    loadTime?: number;
  };
}

// User engagement events
export interface WishlistEvent extends BaseEventProperties {
  event: 'wishlist_add' | 'wishlist_remove';
  properties: {
    productId: string;
    productName: string;
    category: string;
    price: number;
    currency: string;
    wishlistSize: number;
  };
}

export interface ReviewEvent extends BaseEventProperties {
  event: 'review_submitted' | 'review_helpful';
  properties: {
    productId: string;
    rating: number;
    hasPhotos?: boolean;
    hasVideo?: boolean;
    reviewLength?: number;
    verified?: boolean;
  };
}

// Admin-specific events
export interface AdminEvent extends BaseEventProperties {
  event: 'admin_action';
  properties: {
    action: 'product_created' | 'product_updated' | 'product_deleted' | 
            'order_processed' | 'user_moderated' | 'inventory_updated' |
            'promotion_created' | 'report_generated';
    entityType: 'product' | 'order' | 'user' | 'promotion' | 'inventory';
    entityId: string;
    adminUserId: string;
    changes?: Record<string, any>;
  };
}

// Union type of all possible events
export type AnalyticsEvent = 
  | ViewProductEvent
  | AddToCartEvent
  | TryOnOpenedEvent
  | TryOnCapturedEvent
  | CheckoutStartedEvent
  | PurchaseEvent
  | SearchEvent
  | PageViewEvent
  | WishlistEvent
  | ReviewEvent
  | AdminEvent;

// Event names type for type safety
export type EventName = AnalyticsEvent['event'];

// Helper type to extract properties for a specific event
export type EventProperties<T extends EventName> = Extract<AnalyticsEvent, { event: T }>['properties'];

// Context information available to all adapters
export interface AnalyticsContext {
  userId?: string;
  sessionId: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  source: 'web' | 'admin' | 'api';
  userAgent?: string;
  referrer?: string;
  ip?: string;
  country?: string;
  city?: string;
  experiments?: Record<string, string | boolean>;
  userProperties?: Record<string, any>;
}

// Configuration for analytics adapters
export interface AnalyticsConfig {
  enabled: boolean;
  debug?: boolean;
  apiKey?: string;
  endpoint?: string;
  batchSize?: number;
  flushInterval?: number;
  retries?: number;
  timeout?: number;
}

// Analytics adapter interface
export interface AnalyticsAdapter {
  readonly name: string;
  readonly isEnabled: boolean;
  
  initialize(config: AnalyticsConfig, context: AnalyticsContext): Promise<void> | void;
  track<T extends EventName>(event: T, properties: EventProperties<T>): Promise<void> | void;
  identify(userId: string, properties?: Record<string, any>): Promise<void> | void;
  group(groupId: string, properties?: Record<string, any>): Promise<void> | void;
  page(name: string, properties?: Record<string, any>): Promise<void> | void;
  flush(): Promise<void> | void;
  shutdown(): Promise<void> | void;
}

// Analytics manager configuration
export interface AnalyticsManagerConfig {
  adapters: AnalyticsAdapter[];
  context: AnalyticsContext;
  enableBatching?: boolean;
  batchSize?: number;
  flushInterval?: number;
  onError?: (error: Error, adapter: string, event?: any) => void;
}