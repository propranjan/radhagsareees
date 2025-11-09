/**
 * E-commerce event tracking utilities for web app
 */

import {
  type AnalyticsManager,
  ProductTracking,
  TryOnTracking,
  EcommerceTracking,
  ANALYTICS_EVENTS,
} from '@radhagsareees/analytics';

/**
 * Product page analytics
 */
export class ProductPageAnalytics {
  constructor(private analytics: AnalyticsManager) {}

  /**
   * Track product view event
   */
  async trackView(product: {
    id: string;
    name: string;
    category: string;
    subcategory?: string;
    price: number;
    currency?: string;
    brand?: string;
    isOnSale?: boolean;
    salePrice?: number;
    images?: string[];
    tags?: string[];
  }, source?: 'catalog' | 'search' | 'recommendation' | 'direct') {
    try {
      const properties = ProductTracking.createViewProductEvent({
        ...product,
        currency: product.currency || 'INR',
      }, { source });

      await this.analytics.track(ANALYTICS_EVENTS.VIEW_PRODUCT, properties);
    } catch (error) {
      console.error('Failed to track product view:', error);
    }
  }

  /**
   * Track add to cart event
   */
  async trackAddToCart(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
    quantity: number;
    variant?: string;
    size?: string;
    color?: string;
  }, cart: {
    total: number;
    itemCount: number;
  }, source?: 'product_page' | 'catalog' | 'recommendation') {
    try {
      const properties = ProductTracking.createAddToCartEvent({
        ...product,
        currency: product.currency || 'INR',
      }, cart, { source });

      await this.analytics.track(ANALYTICS_EVENTS.ADD_TO_CART, properties);
    } catch (error) {
      console.error('Failed to track add to cart:', error);
    }
  }
}

/**
 * Try-on analytics
 */
export class TryOnAnalytics {
  constructor(private analytics: AnalyticsManager) {}

  /**
   * Track try-on modal opened
   */
  async trackOpened(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
  }, options?: {
    loadTime?: number;
    tryOnType?: 'virtual' | 'ar';
  }) {
    try {
      const properties = TryOnTracking.createTryOnOpenedEvent({
        ...product,
        currency: product.currency || 'INR',
      }, {
        tryOnType: options?.tryOnType || 'virtual',
        loadTime: options?.loadTime,
      });

      await this.analytics.track(ANALYTICS_EVENTS.TRYON_OPENED, properties);
    } catch (error) {
      console.error('Failed to track try-on opened:', error);
    }
  }

  /**
   * Track try-on photo captured
   */
  async trackCaptured(product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
  }, capture: {
    processingTime: number;
    qualityScore?: number;
    saved?: boolean;
    shared?: boolean;
    captureMethod?: 'photo' | 'video';
  }) {
    try {
      const properties = TryOnTracking.createTryOnCapturedEvent({
        ...product,
        currency: product.currency || 'INR',
      }, {
        captureMethod: capture.captureMethod || 'photo',
        processingTime: capture.processingTime,
        qualityScore: capture.qualityScore,
        saved: capture.saved,
        shared: capture.shared,
      });

      await this.analytics.track(ANALYTICS_EVENTS.TRYON_CAPTURED, properties);
    } catch (error) {
      console.error('Failed to track try-on captured:', error);
    }
  }
}

/**
 * Checkout and purchase analytics
 */
export class CheckoutAnalytics {
  constructor(private analytics: AnalyticsManager) {}

  /**
   * Track checkout started
   */
  async trackStarted(cart: {
    total: number;
    currency?: string;
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
  }) {
    try {
      const properties = EcommerceTracking.createCheckoutStartedEvent({
        ...cart,
        currency: cart.currency || 'INR',
        itemCount: cart.items.length,
      });

      await this.analytics.track(ANALYTICS_EVENTS.CHECKOUT_STARTED, properties);
    } catch (error) {
      console.error('Failed to track checkout started:', error);
    }
  }

  /**
   * Track purchase completion
   */
  async trackPurchase(order: {
    orderId: string;
    revenue: number;
    currency?: string;
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
    isNewCustomer?: boolean;
    loyaltyPoints?: number;
  }) {
    try {
      const properties = EcommerceTracking.createPurchaseEvent({
        ...order,
        currency: order.currency || 'INR',
        customerType: order.isNewCustomer ? 'new' : 'returning',
      });

      await this.analytics.track(ANALYTICS_EVENTS.PURCHASE, properties);
    } catch (error) {
      console.error('Failed to track purchase:', error);
    }
  }
}

/**
 * Search and navigation analytics
 */
export class SearchAnalytics {
  constructor(private analytics: AnalyticsManager) {}

  /**
   * Track search query
   */
  async trackSearch(query: string, options?: {
    category?: string;
    filters?: Record<string, any>;
    resultsCount?: number;
    source?: 'header' | 'catalog' | 'autocomplete';
  }) {
    try {
      await this.analytics.track(ANALYTICS_EVENTS.SEARCH, {
        query,
        category: options?.category,
        filters: options?.filters,
        resultsCount: options?.resultsCount || 0,
        source: options?.source || 'header',
      });
    } catch (error) {
      console.error('Failed to track search:', error);
    }
  }

  /**
   * Track page view
   */
  async trackPageView(page: string, options?: {
    title?: string;
    path?: string;
    category?: string;
    loadTime?: number;
  }) {
    try {
      await this.analytics.track(ANALYTICS_EVENTS.PAGE_VIEW, {
        page,
        title: options?.title || document?.title || page,
        path: options?.path || (typeof window !== 'undefined' ? window.location.pathname : ''),
        category: options?.category,
        loadTime: options?.loadTime,
      });
    } catch (error) {
      console.error('Failed to track page view:', error);
    }
  }
}

/**
 * User engagement analytics
 */
export class UserAnalytics {
  constructor(private analytics: AnalyticsManager) {}

  /**
   * Track user registration/login
   */
  async trackUserIdentified(userId: string, properties?: {
    isNewUser?: boolean;
    signupMethod?: string;
    referrer?: string;
  }) {
    try {
      await this.analytics.identify(userId, {
        isNewUser: properties?.isNewUser,
        signupMethod: properties?.signupMethod,
        referrer: properties?.referrer,
        firstSeen: properties?.isNewUser ? new Date().toISOString() : undefined,
      });
    } catch (error) {
      console.error('Failed to identify user:', error);
    }
  }

  /**
   * Track wishlist actions
   */
  async trackWishlist(action: 'add' | 'remove', product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
  }, wishlistSize: number) {
    try {
      await this.analytics.track(
        action === 'add' ? ANALYTICS_EVENTS.WISHLIST_ADD : ANALYTICS_EVENTS.WISHLIST_REMOVE,
        {
          productId: product.id,
          productName: product.name,
          category: product.category,
          price: product.price,
          currency: product.currency || 'INR',
          wishlistSize,
        }
      );
    } catch (error) {
      console.error('Failed to track wishlist action:', error);
    }
  }

  /**
   * Track review submission
   */
  async trackReview(product: {
    id: string;
    name?: string;
  }, review: {
    rating: number;
    hasPhotos?: boolean;
    hasVideo?: boolean;
    reviewLength?: number;
    verified?: boolean;
  }) {
    try {
      await this.analytics.track(ANALYTICS_EVENTS.REVIEW_SUBMITTED, {
        productId: product.id,
        rating: review.rating,
        hasPhotos: review.hasPhotos,
        hasVideo: review.hasVideo,
        reviewLength: review.reviewLength,
        verified: review.verified,
      });
    } catch (error) {
      console.error('Failed to track review:', error);
    }
  }
}

/**
 * Combined analytics service for easy usage
 */
export class WebAnalyticsService {
  public product: ProductPageAnalytics;
  public tryOn: TryOnAnalytics;
  public checkout: CheckoutAnalytics;
  public search: SearchAnalytics;
  public user: UserAnalytics;

  constructor(private analytics: AnalyticsManager) {
    this.product = new ProductPageAnalytics(analytics);
    this.tryOn = new TryOnAnalytics(analytics);
    this.checkout = new CheckoutAnalytics(analytics);
    this.search = new SearchAnalytics(analytics);
    this.user = new UserAnalytics(analytics);
  }

  /**
   * Initialize analytics
   */
  async initialize(): Promise<void> {
    await this.analytics.initialize();
  }

  /**
   * Flush all pending events
   */
  async flush(): Promise<void> {
    await this.analytics.flush();
  }

  /**
   * Shutdown analytics
   */
  async shutdown(): Promise<void> {
    await this.analytics.shutdown();
  }

  /**
   * Update user context
   */
  updateUser(userId: string): void {
    this.analytics.updateContext({ userId });
  }

  /**
   * Get the underlying analytics manager
   */
  getManager(): AnalyticsManager {
    return this.analytics;
  }
}