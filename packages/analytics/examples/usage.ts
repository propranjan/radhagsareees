/**
 * Analytics Usage Examples
 * Demonstrates how to use the analytics package for key e-commerce events
 */

import React from 'react';
import {
  AnalyticsManager,
  createConsoleAdapter,
  createPostHogAdapter,
  createServerSafeAdapter,
  ProductTracking,
  TryOnTracking,
  EcommerceTracking,
  ContextBuilder,
  ANALYTICS_EVENTS,
  setupAnalytics,
} from '@radhagsareees/analytics';

// ==================================================
// 1. Basic Setup
// ==================================================

/**
 * Setup analytics for web application
 */
export function setupWebAnalytics() {
  const analytics = setupAnalytics({
    console: process.env.NODE_ENV === 'development',
    posthog: process.env.NODE_ENV === 'production' ? {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_API_KEY!,
      endpoint: process.env.NEXT_PUBLIC_POSTHOG_ENDPOINT,
      debug: false,
    } : undefined,
    context: ContextBuilder.createClientContext(),
  });

  return analytics;
}

/**
 * Setup analytics for admin application
 */
export function setupAdminAnalytics(userId: string) {
  const analytics = setupAnalytics({
    console: true, // Always enable console for admin
    posthog: {
      apiKey: process.env.NEXT_PUBLIC_POSTHOG_API_KEY!,
      debug: process.env.NODE_ENV === 'development',
    },
    context: {
      ...ContextBuilder.createClientContext(userId),
      source: 'admin',
    },
  });

  return analytics;
}

/**
 * Setup server-side analytics
 */
export function setupServerAnalytics(request: any) {
  const context = ContextBuilder.createServerContext({
    headers: request.headers,
    ip: request.ip,
    userId: request.user?.id,
  });

  const analytics = new AnalyticsManager({
    adapters: [
      createServerSafeAdapter(
        createPostHogAdapter({
          apiKey: process.env.POSTHOG_API_KEY!,
          debug: false,
        })
      ),
    ],
    context,
  });

  return analytics;
}

// ==================================================
// 2. E-commerce Event Examples
// ==================================================

/**
 * Track product view
 */
export async function trackProductView(
  analytics: AnalyticsManager,
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
    brand?: string;
    images?: string[];
  },
  source: 'catalog' | 'search' | 'recommendation' | 'direct' = 'direct'
) {
  const properties = ProductTracking.createViewProductEvent(product, { source });
  
  await analytics.track(ANALYTICS_EVENTS.VIEW_PRODUCT, properties);
}

/**
 * Track add to cart
 */
export async function trackAddToCart(
  analytics: AnalyticsManager,
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
    quantity: number;
    variant?: string;
    size?: string;
  },
  cart: {
    total: number;
    itemCount: number;
  }
) {
  const properties = ProductTracking.createAddToCartEvent(product, cart);
  
  await analytics.track(ANALYTICS_EVENTS.ADD_TO_CART, properties);
}

/**
 * Track checkout started
 */
export async function trackCheckoutStarted(
  analytics: AnalyticsManager,
  cart: {
    total: number;
    currency: string;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      quantity: number;
    }>;
    couponCode?: string;
    discountAmount?: number;
  }
) {
  const properties = EcommerceTracking.createCheckoutStartedEvent({
    ...cart,
    itemCount: cart.items.length,
  });
  
  await analytics.track(ANALYTICS_EVENTS.CHECKOUT_STARTED, properties);
}

/**
 * Track purchase completion
 */
export async function trackPurchase(
  analytics: AnalyticsManager,
  order: {
    orderId: string;
    revenue: number;
    currency: string;
    tax?: number;
    shipping?: number;
    paymentMethod: string;
    shippingMethod: string;
    items: Array<{
      productId: string;
      productName: string;
      category: string;
      price: number;
      quantity: number;
    }>;
    isNewCustomer?: boolean;
  }
) {
  const properties = EcommerceTracking.createPurchaseEvent({
    ...order,
    customerType: order.isNewCustomer ? 'new' : 'returning',
  });
  
  await analytics.track(ANALYTICS_EVENTS.PURCHASE, properties);
}

// ==================================================
// 3. Try-On Event Examples
// ==================================================

/**
 * Track try-on modal opened
 */
export async function trackTryOnOpened(
  analytics: AnalyticsManager,
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
  },
  options?: {
    loadTime?: number;
  }
) {
  const properties = TryOnTracking.createTryOnOpenedEvent(product, {
    tryOnType: 'virtual',
    loadTime: options?.loadTime,
  });
  
  await analytics.track(ANALYTICS_EVENTS.TRYON_OPENED, properties);
}

/**
 * Track try-on photo captured
 */
export async function trackTryOnCaptured(
  analytics: AnalyticsManager,
  product: {
    id: string;
    name: string;
    category: string;
    price: number;
    currency: string;
  },
  capture: {
    processingTime: number;
    qualityScore?: number;
    saved?: boolean;
    shared?: boolean;
  }
) {
  const properties = TryOnTracking.createTryOnCapturedEvent(
    product,
    {
      captureMethod: 'photo',
      processingTime: capture.processingTime,
      qualityScore: capture.qualityScore,
      saved: capture.saved,
      shared: capture.shared,
    },
    { tryOnType: 'virtual' }
  );
  
  await analytics.track(ANALYTICS_EVENTS.TRYON_CAPTURED, properties);
}

// ==================================================
// 4. React Component Examples
// ==================================================

/**
 * Product page component with analytics
 */
import { useEcommerceTracking, usePageTracking } from '@radhagsareees/analytics';

export function ProductPage({ product }: { product: any }) {
  const { trackViewProduct, trackAddToCart } = useEcommerceTracking();
  const { trackPage } = usePageTracking();

  // Track page view on mount
  React.useEffect(() => {
    trackPage(`product_${product.id}`, {
      productId: product.id,
      productName: product.name,
      category: product.category,
    });

    // Track product view
    trackViewProduct({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
      brand: product.brand,
      images: product.images,
      source: 'direct',
    });
  }, [product, trackViewProduct, trackPage]);

  const handleAddToCart = async (quantity: number) => {
    await trackAddToCart({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
      quantity,
      cartTotal: 0, // Would come from cart state
      cartItemCount: 0, // Would come from cart state
      source: 'product_page',
    });

    // Add to cart logic here...
  };

  // Return JSX - In actual implementation, would return:
  // <div>
  //   <h1>{product.name}</h1>
  //   <p>Price: ₹{product.price}</p>
  //   <button onClick={() => handleAddToCart(1)}>
  //     Add to Cart
  //   </button>
  // </div>
  return null;
}

/**
 * Try-on modal component with analytics
 */
import { useTryOnTracking } from '@radhagsareees/analytics';
import { PerformanceUtils } from '@radhagsareees/analytics';

export function TryOnModal({ product, onClose }: { product: any; onClose: () => void }) {
  const { trackTryOnOpened, trackTryOnCaptured } = useTryOnTracking();
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const trackOpening = async () => {
      const { duration } = await PerformanceUtils.measureTiming(
        async () => {
          // Simulate ML model loading
          await new Promise(resolve => setTimeout(resolve, 2000));
          setIsLoading(false);
        },
        'try-on-initialization'
      );

      await trackTryOnOpened({
        productId: product.id,
        productName: product.name,
        category: product.category,
        price: product.price,
        currency: 'INR',
      }, { loadTime: duration });
    };

    trackOpening();
  }, [product, trackTryOnOpened]);

  const handleCapture = async () => {
    const { duration } = await PerformanceUtils.measureTiming(
      async () => {
        // Simulate photo processing
        await new Promise(resolve => setTimeout(resolve, 500));
      },
      'try-on-capture'
    );

    await trackTryOnCaptured({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
    }, {
      processingTime: duration,
      qualityScore: 0.85,
      saved: false,
      shared: false,
    });
  };

  // Return JSX - In actual implementation, would return:
  // <div className="try-on-modal">
  //   {isLoading ? (
  //     <div>Loading try-on...</div>
  //   ) : (
  //     <div>
  //       <div>Try-on preview for {product.name}</div>
  //       <button onClick={handleCapture}>Capture Photo</button>
  //       <button onClick={onClose}>Close</button>
  //     </div>
  //   )}
  // </div>
  return null;
}

// ==================================================
// 5. Advanced Usage Examples
// ==================================================

/**
 * E-commerce funnel tracking with error handling
 */
export class EcommerceFunnelTracker {
  constructor(private analytics: AnalyticsManager) {}

  async trackFunnelStep(
    step: 'view' | 'cart' | 'checkout' | 'purchase',
    data: any,
    onError?: (error: Error) => void
  ) {
    try {
      switch (step) {
        case 'view':
          await trackProductView(this.analytics, data.product, data.source);
          break;
        case 'cart':
          await trackAddToCart(this.analytics, data.product, data.cart);
          break;
        case 'checkout':
          await trackCheckoutStarted(this.analytics, data.cart);
          break;
        case 'purchase':
          await trackPurchase(this.analytics, data.order);
          break;
      }
    } catch (error) {
      console.error(`Funnel tracking error at step ${step}:`, error);
      onError?.(error as Error);
    }
  }

  async trackAbandonedCart(cartData: any) {
    // Custom event for abandoned cart
    await this.analytics.track('page_view', {
      page: 'cart_abandoned',
      title: 'Cart Abandoned',
      path: '/cart/abandoned',
      cartTotal: cartData.total,
      itemCount: cartData.items.length,
      timeOnPage: cartData.timeSpent,
    });
  }
}

/**
 * A/B testing with analytics
 */
export async function trackExperiment(
  analytics: AnalyticsManager,
  experimentName: string,
  variant: string,
  eventName: string,
  properties: any
) {
  // Add experiment data to properties
  const enrichedProperties = {
    ...properties,
    experiment: experimentName,
    variant: variant,
  };

  await analytics.track(eventName as any, enrichedProperties);
}

// ==================================================
// 6. Error Handling and Debugging
// ==================================================

/**
 * Analytics error handler
 */
export function handleAnalyticsError(error: Error, adapter: string, event?: any) {
  console.error(`Analytics error in ${adapter}:`, error);

  // Log to external service in production
  if (process.env.NODE_ENV === 'production') {
    // Send to error tracking service
    console.log('Would send to error tracking:', { error, adapter, event });
  }

  // Optionally retry the event
  if (event && adapter === 'posthog') {
    setTimeout(() => {
      console.log('Retrying failed analytics event:', event);
      // Retry logic here
    }, 5000);
  }
}