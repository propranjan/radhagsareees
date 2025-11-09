import * as React from 'react';
import { AnalyticsManager } from '../analytics';
import type { 
  EventName, 
  EventProperties, 
  AnalyticsContext,
  ViewProductEvent,
  AddToCartEvent,
  TryOnOpenedEvent,
  TryOnCapturedEvent,
  CheckoutStartedEvent,
  PurchaseEvent
} from '../types';

/**
 * React Context for Analytics
 */
const AnalyticsContext = React.createContext<AnalyticsManager | null>(null);

/**
 * Analytics Provider Props
 */
interface AnalyticsProviderProps {
  manager: AnalyticsManager;
  children: React.ReactNode;
}

/**
 * Analytics Provider Component
 */
export function AnalyticsProvider({ manager, children }: AnalyticsProviderProps): React.ReactElement {
  React.useEffect(() => {
    // Initialize analytics manager on mount
    manager.initialize().catch(console.error);

    // Cleanup on unmount
    return () => {
      manager.shutdown().catch(console.error);
    };
  }, [manager]);

  return React.createElement(AnalyticsContext.Provider, { value: manager }, children);
}

/**
 * Hook to access analytics manager
 */
export function useAnalytics(): AnalyticsManager {
  const analytics = React.useContext(AnalyticsContext);
  
  if (!analytics) {
    throw new Error('useAnalytics must be used within an AnalyticsProvider');
  }
  
  return analytics;
}

/**
 * Hook for tracking events with type safety
 */
export function useTrackEvent() {
  const analytics = useAnalytics();

  const track = React.useCallback(async <T extends EventName>(
    event: T,
    properties: EventProperties<T>,
    options?: { userId?: string; flush?: boolean }
  ) => {
    try {
      await analytics.track(event, properties, options);
    } catch (error) {
      console.error('Analytics tracking error:', error);
    }
  }, [analytics]);

  return track;
}

/**
 * Hook for e-commerce tracking with specific event helpers
 */
export function useEcommerceTracking() {
  const track = useTrackEvent();

  const trackViewProduct = React.useCallback(async (properties: EventProperties<'view_product'>) => {
    await track('view_product', properties);
  }, [track]);

  const trackAddToCart = React.useCallback(async (properties: EventProperties<'add_to_cart'>) => {
    await track('add_to_cart', properties);
  }, [track]);

  const trackCheckoutStarted = React.useCallback(async (properties: EventProperties<'checkout_started'>) => {
    await track('checkout_started', properties);
  }, [track]);

  const trackPurchase = React.useCallback(async (properties: EventProperties<'purchase'>) => {
    await track('purchase', properties);
  }, [track]);

  return {
    trackViewProduct,
    trackAddToCart,
    trackCheckoutStarted,
    trackPurchase,
  };
}

/**
 * Hook for try-on tracking
 */
export function useTryOnTracking() {
  const track = useTrackEvent();

  const trackTryOnOpened = React.useCallback(async (properties: EventProperties<'tryon_opened'>) => {
    await track('tryon_opened', properties);
  }, [track]);

  const trackTryOnCaptured = React.useCallback(async (properties: EventProperties<'tryon_captured'>) => {
    await track('tryon_captured', properties);
  }, [track]);

  return {
    trackTryOnOpened,
    trackTryOnCaptured,
  };
}

/**
 * Hook for page tracking
 */
export function usePageTracking() {
  const analytics = useAnalytics();

  const trackPage = React.useCallback(async (name: string, properties?: Record<string, any>) => {
    try {
      await analytics.page(name, properties);
    } catch (error) {
      console.error('Page tracking error:', error);
    }
  }, [analytics]);

  // Auto-track page views on route changes
  React.useEffect(() => {
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : '';
    const pageName = currentPath.replace(/^\//, '') || 'home';
    
    trackPage(pageName, {
      path: currentPath,
      title: typeof document !== 'undefined' ? document.title : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    });
  }, [trackPage]);

  return { trackPage };
}

/**
 * Hook for user identification
 */
export function useUserTracking() {
  const analytics = useAnalytics();

  const identifyUser = React.useCallback(async (userId: string, properties?: Record<string, any>) => {
    try {
      await analytics.identify(userId, properties);
    } catch (error) {
      console.error('User identification error:', error);
    }
  }, [analytics]);

  const groupUser = React.useCallback(async (groupId: string, properties?: Record<string, any>) => {
    try {
      await analytics.group(groupId, properties);
    } catch (error) {
      console.error('User grouping error:', error);
    }
  }, [analytics]);

  return {
    identifyUser,
    groupUser,
  };
}

/**
 * HOC for automatic component tracking
 */
export function withAnalytics<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  eventName: string,
  getProperties?: (props: P) => Record<string, any>
): React.ComponentType<P> {
  return function AnalyticsWrappedComponent(props: P): React.ReactElement {
    const track = useTrackEvent();

    React.useEffect(() => {
      const properties = getProperties ? getProperties(props) : {};
      track(eventName as EventName, properties as any).catch(console.error);
    }, [props, track]);

    return React.createElement(Component, props);
  };
}

/**
 * Hook for tracking component lifecycle events
 */
export function useComponentTracking(
  componentName: string,
  additionalProperties?: Record<string, any>
) {
  const track = useTrackEvent();

  React.useEffect(() => {
    // Track component mount
    track('page_view' as EventName, {
      page: componentName,
      title: componentName,
      path: `/${componentName.toLowerCase()}`,
      ...additionalProperties,
    } as any).catch(console.error);
  }, [componentName, additionalProperties, track]);
}

/**
 * Hook for tracking form interactions
 */
export function useFormTracking(formName: string) {
  const track = useTrackEvent();

  const trackFormStart = React.useCallback(async (properties?: Record<string, any>) => {
    await track('page_view' as EventName, {
      page: `${formName}_form_start`,
      title: `${formName} Form Started`,
      path: `/forms/${formName}`,
      ...properties,
    } as any);
  }, [formName, track]);

  const trackFormSubmit = React.useCallback(async (properties?: Record<string, any>) => {
    await track('page_view' as EventName, {
      page: `${formName}_form_submit`,
      title: `${formName} Form Submitted`,
      path: `/forms/${formName}/submit`,
      ...properties,
    } as any);
  }, [formName, track]);

  const trackFormError = React.useCallback(async (error: string, properties?: Record<string, any>) => {
    await track('page_view' as EventName, {
      page: `${formName}_form_error`,
      title: `${formName} Form Error`,
      path: `/forms/${formName}/error`,
      error,
      ...properties,
    } as any);
  }, [formName, track]);

  return {
    trackFormStart,
    trackFormSubmit,
    trackFormError,
  };
}

/**
 * Hook for tracking search events
 */
export function useSearchTracking() {
  const track = useTrackEvent();

  const trackSearch = React.useCallback(async (
    query: string,
    options?: {
      category?: string;
      filters?: Record<string, any>;
      resultsCount?: number;
      source?: string;
    }
  ) => {
    await track('search' as EventName, {
      query,
      category: options?.category,
      filters: options?.filters,
      resultsCount: options?.resultsCount || 0,
      source: options?.source || 'header',
    } as any);
  }, [track]);

  return { trackSearch };
}

/**
 * Hook for batch tracking optimization
 */
export function useBatchTracking() {
  const analytics = useAnalytics();
  const [queue, setQueue] = React.useState<Array<{ event: EventName; properties: any }>>([]);

  const addToQueue = React.useCallback((event: EventName, properties: any) => {
    setQueue(prev => [...prev, { event, properties }]);
  }, []);

  const flushQueue = React.useCallback(async () => {
    if (queue.length === 0) return;

    const events = [...queue];
    setQueue([]);

    for (const { event, properties } of events) {
      try {
        await analytics.track(event, properties);
      } catch (error) {
        console.error('Batch tracking error:', error);
      }
    }

    await analytics.flush();
  }, [analytics, queue]);

  // Auto-flush on unmount
  React.useEffect(() => {
    return () => {
      if (queue.length > 0) {
        flushQueue().catch(console.error);
      }
    };
  }, [queue.length, flushQueue]);

  return {
    addToQueue,
    flushQueue,
    queueSize: queue.length,
  };
}