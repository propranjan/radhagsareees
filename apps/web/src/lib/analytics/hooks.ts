/**
 * React hooks for analytics in the web app
 */

'use client';

import React, { useEffect, useCallback, useContext, createContext, type ReactNode } from 'react';
import { WebAnalyticsService } from './events';
import { getClientAnalytics } from './index';

/**
 * Analytics context for React components
 */
const WebAnalyticsContext = createContext<WebAnalyticsService | null>(null);

/**
 * Props for Analytics Provider
 */
interface AnalyticsProviderProps {
  children: ReactNode;
  userId?: string;
}

/**
 * Analytics provider component
 */
export function WebAnalyticsProvider({ children, userId }: AnalyticsProviderProps) {
  const analytics = getClientAnalytics(userId);
  const service = new WebAnalyticsService(analytics);

  useEffect(() => {
    // Initialize analytics on mount
    service.initialize().catch(console.error);

    // Cleanup on unmount
    return () => {
      service.shutdown().catch(console.error);
    };
  }, [service]);

  return React.createElement(WebAnalyticsContext.Provider, { value: service }, children);
}

/**
 * Hook to access web analytics service
 */
export function useWebAnalytics(): WebAnalyticsService {
  const analytics = useContext(WebAnalyticsContext);
  
  if (!analytics) {
    throw new Error('useWebAnalytics must be used within a WebAnalyticsProvider');
  }
  
  return analytics;
}

/**
 * Hook for product page analytics
 */
export function useProductAnalytics() {
  const analytics = useWebAnalytics();

  const trackView = useCallback(async (product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency?: string;
    brand?: string;
    images?: string[];
  }, source?: 'catalog' | 'search' | 'recommendation' | 'direct') => {
    await analytics.product.trackView(product, source);
  }, [analytics.product]);

  const trackAddToCart = useCallback(async (
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
      quantity: number;
      variant?: string;
    },
    cart: { total: number; itemCount: number }
  ) => {
    await analytics.product.trackAddToCart(product, cart, 'product_page');
  }, [analytics.product]);

  return { trackView, trackAddToCart };
}

/**
 * Hook for try-on analytics
 */
export function useTryOnAnalytics() {
  const analytics = useWebAnalytics();

  const trackOpened = useCallback(async (product: {
    id: string;
    name: string;
    category: string;
    price: number;
  }, loadTime?: number) => {
    await analytics.tryOn.trackOpened(product, { loadTime });
  }, [analytics.tryOn]);

  const trackCaptured = useCallback(async (
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
    },
    processingTime: number,
    qualityScore?: number
  ) => {
    await analytics.tryOn.trackCaptured(product, {
      processingTime,
      qualityScore,
      saved: true,
    });
  }, [analytics.tryOn]);

  return { trackOpened, trackCaptured };
}

/**
 * Hook for checkout analytics
 */
export function useCheckoutAnalytics() {
  const analytics = useWebAnalytics();

  const trackStarted = useCallback(async (cart: {
    total: number;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    await analytics.checkout.trackStarted(cart);
  }, [analytics.checkout]);

  const trackPurchase = useCallback(async (order: {
    orderId: string;
    revenue: number;
    paymentMethod: string;
    shippingMethod: string;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      quantity: number;
    }>;
  }) => {
    await analytics.checkout.trackPurchase(order);
  }, [analytics.checkout]);

  return { trackStarted, trackPurchase };
}

/**
 * Hook for search analytics
 */
export function useSearchAnalytics() {
  const analytics = useWebAnalytics();

  const trackSearch = useCallback(async (
    query: string,
    resultsCount: number,
    source?: 'header' | 'catalog' | 'autocomplete'
  ) => {
    await analytics.search.trackSearch(query, { resultsCount, source });
  }, [analytics.search]);

  return { trackSearch };
}

/**
 * Hook for automatic page view tracking
 */
export function usePageTracking(pageName: string, category?: string) {
  const analytics = useWebAnalytics();

  useEffect(() => {
    const trackPageView = async () => {
      const loadTime = performance.now();
      
      await analytics.search.trackPageView(pageName, {
        category,
        loadTime,
      });
    };

    trackPageView().catch(console.error);
  }, [analytics.search, pageName, category]);
}

/**
 * Hook for user identification
 */
export function useUserIdentification() {
  const analytics = useWebAnalytics();

  const identifyUser = useCallback(async (
    userId: string,
    isNewUser?: boolean,
    signupMethod?: string
  ) => {
    analytics.updateUser(userId);
    await analytics.user.trackUserIdentified(userId, {
      isNewUser,
      signupMethod,
    });
  }, [analytics]);

  return { identifyUser };
}

/**
 * Hook for wishlist tracking
 */
export function useWishlistTracking() {
  const analytics = useWebAnalytics();

  const trackAdd = useCallback(async (
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
    },
    wishlistSize: number
  ) => {
    await analytics.user.trackWishlist('add', product, wishlistSize);
  }, [analytics.user]);

  const trackRemove = useCallback(async (
    product: {
      id: string;
      name: string;
      category: string;
      price: number;
    },
    wishlistSize: number
  ) => {
    await analytics.user.trackWishlist('remove', product, wishlistSize);
  }, [analytics.user]);

  return { trackAdd, trackRemove };
}

/**
 * Hook for performance measurement with analytics
 */
export function usePerformanceTracking() {
  const measureAndTrack = useCallback(async <T>(
    operation: () => T | Promise<T>,
    operationName: string,
    additionalProperties?: Record<string, any>
  ): Promise<{ result: T; duration: number }> => {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const duration = performance.now() - startTime;
      
      // Track performance event (could extend analytics to include performance events)
      console.log(`Operation "${operationName}" completed in ${duration.toFixed(2)}ms`, {
        operation: operationName,
        duration,
        ...additionalProperties,
      });
      
      return { result, duration };
    } catch (error) {
      const duration = performance.now() - startTime;
      console.error(`Operation "${operationName}" failed after ${duration.toFixed(2)}ms:`, error);
      throw error;
    }
  }, []);

  return { measureAndTrack };
}

/**
 * Custom hook for error boundary analytics
 */
export function useErrorTracking() {
  const analytics = useWebAnalytics();

  const trackError = useCallback(async (
    error: Error,
    errorInfo?: {
      componentStack?: string;
      errorBoundary?: string;
      userId?: string;
    }
  ) => {
    try {
      // Track error as a custom event
      await analytics.getManager().track('page_view', {
        page: 'error_occurred',
        title: 'Application Error',
        path: typeof window !== 'undefined' ? window.location.pathname : '',
        error: error.message,
        errorStack: error.stack,
        componentStack: errorInfo?.componentStack,
        errorBoundary: errorInfo?.errorBoundary,
      });
    } catch (trackingError) {
      console.error('Failed to track error:', trackingError);
    }
  }, [analytics]);

  return { trackError };
}