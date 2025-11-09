/**
 * Event Instrumentation Utilities
 * Helper functions for creating and tracking specific e-commerce events
 */

import type { 
  EventProperties,
  ViewProductEvent,
  AddToCartEvent,
  TryOnOpenedEvent,
  TryOnCapturedEvent,
  CheckoutStartedEvent,
  PurchaseEvent
} from '../types';

/**
 * Product tracking utilities
 */
export const ProductTracking = {
  /**
   * Create view product event properties
   */
  createViewProductEvent(product: {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    price: number;
    currency: string;
    brand?: string;
    isOnSale?: boolean;
    salePrice?: number;
    images?: string[];
    tags?: string[];
  }, options?: {
    source?: 'catalog' | 'search' | 'recommendation' | 'direct';
  }): EventProperties<'view_product'> {
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      subcategory: product.subcategory,
      price: product.price,
      currency: product.currency,
      brand: product.brand,
      isOnSale: product.isOnSale,
      salePrice: product.salePrice,
      images: product.images,
      tags: product.tags,
      source: options?.source || 'direct',
    };
  },

  /**
   * Create add to cart event properties
   */
  createAddToCartEvent(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
    quantity: number;
    variant?: string;
    size?: string;
    color?: string;
  }, cart: {
    total: number;
    itemCount: number;
  }, options?: {
    source?: 'product_page' | 'catalog' | 'recommendation';
  }): EventProperties<'add_to_cart'> {
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      quantity: product.quantity,
      cartTotal: cart.total,
      cartItemCount: cart.itemCount,
      variant: product.variant,
      size: product.size,
      color: product.color,
      source: options?.source || 'product_page',
    };
  },
};

/**
 * Try-on tracking utilities
 */
export const TryOnTracking = {
  /**
   * Create try-on opened event properties
   */
  createTryOnOpenedEvent(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
  }, options?: {
    tryOnType?: 'virtual' | 'ar';
    loadTime?: number;
  }): EventProperties<'tryon_opened'> {
    // Detect device capabilities
    const deviceCapabilities = {
      hasCamera: typeof navigator !== 'undefined' && 
                 'mediaDevices' in navigator && 
                 'getUserMedia' in navigator.mediaDevices,
      hasWebGL: (() => {
        if (typeof window === 'undefined') return false;
        try {
          const canvas = document.createElement('canvas');
          return !!(canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
        } catch {
          return false;
        }
      })(),
      supportsMediaDevices: typeof navigator !== 'undefined' && 'mediaDevices' in navigator,
    };

    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      tryOnType: options?.tryOnType || 'virtual',
      deviceCapabilities,
      loadTime: options?.loadTime,
    };
  },

  /**
   * Create try-on captured event properties
   */
  createTryOnCapturedEvent(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
  }, capture: {
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
  }, options?: {
    tryOnType?: 'virtual' | 'ar';
  }): EventProperties<'tryon_captured'> {
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: product.currency,
      tryOnType: options?.tryOnType || 'virtual',
      captureMethod: capture.captureMethod,
      processingTime: capture.processingTime,
      qualityScore: capture.qualityScore,
      adjustments: capture.adjustments,
      shared: capture.shared,
      saved: capture.saved,
    };
  },
};

/**
 * E-commerce funnel tracking utilities
 */
export const EcommerceTracking = {
  /**
   * Create checkout started event properties
   */
  createCheckoutStartedEvent(cart: {
    total: number;
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
  }): EventProperties<'checkout_started'> {
    return {
      cartTotal: cart.total,
      currency: cart.currency,
      itemCount: cart.itemCount,
      items: cart.items,
      couponCode: cart.couponCode,
      discountAmount: cart.discountAmount,
      shippingMethod: cart.shippingMethod,
      paymentMethod: cart.paymentMethod,
    };
  },

  /**
   * Create purchase event properties
   */
  createPurchaseEvent(order: {
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
  }): EventProperties<'purchase'> {
    return {
      orderId: order.orderId,
      revenue: order.revenue,
      currency: order.currency,
      tax: order.tax,
      shipping: order.shipping,
      couponCode: order.couponCode,
      discountAmount: order.discountAmount,
      paymentMethod: order.paymentMethod,
      shippingMethod: order.shippingMethod,
      items: order.items,
      customerType: order.customerType,
      loyaltyPoints: order.loyaltyPoints,
    };
  },
};

/**
 * Session utilities
 */
export const SessionUtils = {
  /**
   * Generate a session ID
   */
  generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  /**
   * Get or create session ID from storage
   */
  getSessionId(): string {
    if (typeof window === 'undefined') {
      return this.generateSessionId();
    }

    const storageKey = 'radha_analytics_session';
    let sessionId = sessionStorage.getItem(storageKey);
    
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem(storageKey, sessionId);
    }
    
    return sessionId;
  },

  /**
   * Detect device type
   */
  getDeviceType(): 'desktop' | 'mobile' | 'tablet' {
    if (typeof window === 'undefined') return 'desktop';

    const userAgent = navigator.userAgent.toLowerCase();
    
    if (/mobile|android|iphone|ipod|blackberry|opera mini|iemobile|wpdesktop/.test(userAgent)) {
      return 'mobile';
    }
    
    if (/tablet|ipad/.test(userAgent)) {
      return 'tablet';
    }
    
    return 'desktop';
  },

  /**
   * Get page source/referrer information
   */
  getSourceInfo(): {
    source: 'web' | 'admin' | 'api';
    referrer?: string;
    userAgent?: string;
  } {
    if (typeof window === 'undefined') {
      return { source: 'web' };
    }

    // Determine source based on hostname or path
    const hostname = window.location.hostname;
    const pathname = window.location.pathname;
    
    let source: 'web' | 'admin' | 'api' = 'web';
    if (pathname.startsWith('/admin')) {
      source = 'admin';
    } else if (pathname.startsWith('/api')) {
      source = 'api';
    }

    return {
      source,
      referrer: document.referrer || undefined,
      userAgent: navigator.userAgent,
    };
  },
};

/**
 * Context builder utility
 */
export const ContextBuilder = {
  /**
   * Create analytics context for client-side
   */
  createClientContext(userId?: string): {
    userId?: string;
    sessionId: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    source: 'web' | 'admin' | 'api';
    userAgent?: string;
    referrer?: string;
  } {
    const sourceInfo = SessionUtils.getSourceInfo();
    
    return {
      userId,
      sessionId: SessionUtils.getSessionId(),
      deviceType: SessionUtils.getDeviceType(),
      ...sourceInfo,
    };
  },

  /**
   * Create analytics context for server-side
   */
  createServerContext(request?: {
    headers?: Record<string, string>;
    ip?: string;
    userId?: string;
  }): {
    userId?: string;
    sessionId: string;
    deviceType: 'desktop' | 'mobile' | 'tablet';
    source: 'web' | 'admin' | 'api';
    userAgent?: string;
    ip?: string;
  } {
    const userAgent = request?.headers?.['user-agent'];
    let deviceType: 'desktop' | 'mobile' | 'tablet' = 'desktop';
    
    if (userAgent) {
      const ua = userAgent.toLowerCase();
      if (/mobile|android|iphone|ipod/.test(ua)) {
        deviceType = 'mobile';
      } else if (/tablet|ipad/.test(ua)) {
        deviceType = 'tablet';
      }
    }

    return {
      userId: request?.userId,
      sessionId: SessionUtils.generateSessionId(),
      deviceType,
      source: 'web', // Default to web for server-side
      userAgent,
      ip: request?.ip,
    };
  },
};

/**
 * Performance utilities for analytics
 */
export const PerformanceUtils = {
  /**
   * Measure and track timing
   */
  measureTiming<T>(
    operation: () => T | Promise<T>,
    operationName: string
  ): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    
    const finish = (result: T): { result: T; duration: number } => ({
      result,
      duration: performance.now() - startTime,
    });

    try {
      const result = operation();
      
      if (result instanceof Promise) {
        return result.then(finish);
      }
      
      return Promise.resolve(finish(result));
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`Operation "${operationName}" failed after ${duration}ms:`, error);
      throw error;
    }
  },

  /**
   * Debounce function for batching events
   */
  debounce<T extends (...args: any[]) => void>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  /**
   * Throttle function for rate limiting
   */
  throttle<T extends (...args: any[]) => void>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },
};