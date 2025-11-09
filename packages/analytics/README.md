# Analytics Package Usage Examples

This document demonstrates how to use the `@radhagsarees/analytics` package to track key e-commerce events with TypeScript safety.

## Quick Start

```typescript
import { setupAnalytics, ContextBuilder } from '@radhagsarees/analytics';

// Setup analytics for your application
const analytics = setupAnalytics({
  console: process.env.NODE_ENV === 'development',
  posthog: {
    apiKey: process.env.NEXT_PUBLIC_POSTHOG_API_KEY!,
    debug: false,
  },
  context: ContextBuilder.createClientContext(),
});

// Initialize analytics
await analytics.initialize();
```

## Key E-commerce Events

### 1. Product View Event

```typescript
import { ProductTracking, ANALYTICS_EVENTS } from '@radhagsarees/analytics';

// Track when user views a product
async function trackProductView(productId: string) {
  const properties = ProductTracking.createViewProductEvent({
    id: productId,
    name: 'Beautiful Red Silk Saree',
    category: 'Sarees',
    subcategory: 'Silk Sarees',
    price: 2500,
    currency: 'INR',
    brand: 'Radha G Sarees',
    isOnSale: true,
    salePrice: 2000,
    images: ['/saree1.jpg', '/saree2.jpg'],
    tags: ['silk', 'red', 'traditional'],
  }, {
    source: 'catalog', // 'catalog' | 'search' | 'recommendation' | 'direct'
  });

  await analytics.track(ANALYTICS_EVENTS.VIEW_PRODUCT, properties);
}
```

### 2. Add to Cart Event

```typescript
// Track when user adds item to cart
async function trackAddToCart(productId: string, quantity: number) {
  const properties = ProductTracking.createAddToCartEvent({
    id: productId,
    name: 'Beautiful Red Silk Saree',
    category: 'Sarees',
    price: 2000,
    currency: 'INR',
    quantity: quantity,
    variant: 'Red',
    size: 'Medium',
    color: 'Red',
  }, {
    total: 4000, // Current cart total
    itemCount: 2, // Current cart item count
  }, {
    source: 'product_page', // 'product_page' | 'catalog' | 'recommendation'
  });

  await analytics.track(ANALYTICS_EVENTS.ADD_TO_CART, properties);
}
```

### 3. Try-On Opened Event

```typescript
import { TryOnTracking } from '@radhagsarees/analytics';

// Track when virtual try-on modal opens
async function trackTryOnOpened(productId: string, loadTime?: number) {
  const properties = TryOnTracking.createTryOnOpenedEvent({
    id: productId,
    name: 'Beautiful Red Silk Saree',
    category: 'Sarees',
    price: 2000,
    currency: 'INR',
  }, {
    tryOnType: 'virtual', // 'virtual' | 'ar'
    loadTime: loadTime, // ML model loading time in ms
  });

  await analytics.track(ANALYTICS_EVENTS.TRYON_OPENED, properties);
}
```

### 4. Try-On Captured Event

```typescript
// Track when user captures try-on photo
async function trackTryOnCaptured(
  productId: string,
  processingTime: number,
  qualityScore?: number
) {
  const properties = TryOnTracking.createTryOnCapturedEvent({
    id: productId,
    name: 'Beautiful Red Silk Saree',
    category: 'Sarees',
    price: 2000,
    currency: 'INR',
  }, {
    captureMethod: 'photo', // 'photo' | 'video'
    processingTime: processingTime,
    qualityScore: qualityScore,
    adjustments: {
      brightness: 0.1,
      contrast: 0.05,
      position: { x: 10, y: 20 },
      scale: 1.2,
    },
    shared: false,
    saved: true,
  }, {
    tryOnType: 'virtual',
  });

  await analytics.track(ANALYTICS_EVENTS.TRYON_CAPTURED, properties);
}
```

### 5. Checkout Started Event

```typescript
import { EcommerceTracking } from '@radhagsarees/analytics';

// Track when user starts checkout process
async function trackCheckoutStarted(cartData: any) {
  const properties = EcommerceTracking.createCheckoutStartedEvent({
    total: 4000,
    currency: 'INR',
    itemCount: 2,
    items: [
      {
        productId: 'saree-001',
        productName: 'Red Silk Saree',
        category: 'Sarees',
        price: 2000,
        quantity: 1,
        variant: 'Red-Medium',
      },
      {
        productId: 'saree-002',
        productName: 'Blue Cotton Saree',
        category: 'Sarees',
        price: 2000,
        quantity: 1,
        variant: 'Blue-Large',
      },
    ],
    couponCode: 'SAVE10',
    discountAmount: 400,
    shippingMethod: 'standard',
    paymentMethod: 'credit_card',
  });

  await analytics.track(ANALYTICS_EVENTS.CHECKOUT_STARTED, properties);
}
```

### 6. Purchase Event

```typescript
// Track completed purchase
async function trackPurchase(orderData: any) {
  const properties = EcommerceTracking.createPurchaseEvent({
    orderId: 'ORD-123456',
    revenue: 3600,
    currency: 'INR',
    tax: 360,
    shipping: 100,
    couponCode: 'SAVE10',
    discountAmount: 400,
    paymentMethod: 'credit_card',
    shippingMethod: 'standard',
    items: [
      {
        productId: 'saree-001',
        productName: 'Red Silk Saree',
        category: 'Sarees',
        price: 2000,
        quantity: 1,
        variant: 'Red-Medium',
      },
      {
        productId: 'saree-002',
        productName: 'Blue Cotton Saree',
        category: 'Sarees',
        price: 2000,
        quantity: 1,
        variant: 'Blue-Large',
      },
    ],
    customerType: 'returning',
    loyaltyPoints: 360,
  });

  await analytics.track(ANALYTICS_EVENTS.PURCHASE, properties);
}
```

## React Hooks Usage

### Provider Setup

```tsx
import { AnalyticsProvider, setupAnalytics } from '@radhagsarees/analytics';

function App() {
  const analytics = setupAnalytics({
    console: true,
    posthog: { apiKey: 'your-api-key' },
    context: ContextBuilder.createClientContext(),
  });

  return (
    <AnalyticsProvider manager={analytics}>
      <YourAppContent />
    </AnalyticsProvider>
  );
}
```

### Using Hooks in Components

```tsx
import { useEcommerceTracking, usePageTracking } from '@radhagsarees/analytics';

function ProductPage({ product }) {
  const { trackViewProduct, trackAddToCart } = useEcommerceTracking();
  const { trackPage } = usePageTracking();

  // Auto-track page view
  useEffect(() => {
    trackPage(`product_${product.id}`, {
      productId: product.id,
      category: product.category,
    });

    trackViewProduct({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
      source: 'direct',
    });
  }, [product]);

  const handleAddToCart = async () => {
    await trackAddToCart({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
      quantity: 1,
      cartTotal: 0, // Get from cart context
      cartItemCount: 0, // Get from cart context
      source: 'product_page',
    });
  };

  return (
    <div>
      <h1>{product.name}</h1>
      <button onClick={handleAddToCart}>Add to Cart</button>
    </div>
  );
}
```

### Try-On Component

```tsx
import { useTryOnTracking, PerformanceUtils } from '@radhagsarees/analytics';

function TryOnModal({ product, onClose }) {
  const { trackTryOnOpened, trackTryOnCaptured } = useTryOnTracking();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeTryOn = async () => {
      const { duration } = await PerformanceUtils.measureTiming(
        async () => {
          // Load ML models
          await loadMLModels();
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

    initializeTryOn();
  }, [product]);

  const handleCapture = async () => {
    const { result, duration } = await PerformanceUtils.measureTiming(
      () => capturePhoto(),
      'photo-capture'
    );

    await trackTryOnCaptured({
      productId: product.id,
      productName: product.name,
      category: product.category,
      price: product.price,
      currency: 'INR',
    }, {
      processingTime: duration,
      qualityScore: result.quality,
      saved: true,
    });
  };

  return (
    <div className="try-on-modal">
      {isLoading ? (
        <div>Loading try-on...</div>
      ) : (
        <div>
          <TryOnCanvas product={product} />
          <button onClick={handleCapture}>Capture Photo</button>
        </div>
      )}
    </div>
  );
}
```

## Server-Side Usage

### Next.js API Route

```typescript
// pages/api/analytics/track.ts
import { setupServerAnalytics } from '@radhagsarees/analytics';

export default async function handler(req, res) {
  const analytics = setupServerAnalytics(req);
  
  await analytics.initialize();
  
  // Track server-side event
  await analytics.track('purchase', {
    orderId: req.body.orderId,
    revenue: req.body.total,
    currency: 'INR',
    // ... other properties
  });

  await analytics.shutdown();
  
  res.json({ success: true });
}
```

### Express.js Middleware

```typescript
import { ContextBuilder, createServerSafeAdapter } from '@radhagsarees/analytics';

app.use((req, res, next) => {
  // Add analytics to request
  req.analytics = new AnalyticsManager({
    adapters: [createServerSafeAdapter()],
    context: ContextBuilder.createServerContext(req),
  });
  
  next();
});
```

## Advanced Features

### Performance Tracking

```typescript
import { PerformanceUtils } from '@radhagsarees/analytics';

// Measure operation performance
const { result, duration } = await PerformanceUtils.measureTiming(
  async () => {
    return await heavyComputation();
  },
  'heavy-computation'
);

console.log(`Operation took ${duration}ms`);
```

### Batch Processing

```typescript
import { useBatchTracking } from '@radhagsarees/analytics';

function SearchResults() {
  const { addToQueue, flushQueue } = useBatchTracking();

  // Queue multiple events
  results.forEach(result => {
    addToQueue('search_result_click', {
      query: searchQuery,
      resultId: result.id,
      position: result.position,
    });
  });

  // Flush when done
  useEffect(() => {
    return () => flushQueue();
  }, []);
}
```

### Error Handling

```typescript
// Custom error handler
function handleAnalyticsError(error: Error, adapter: string, event?: any) {
  console.error(`Analytics error in ${adapter}:`, error);
  
  // Send to error tracking
  if (process.env.NODE_ENV === 'production') {
    errorTracker.captureException(error, {
      tags: { adapter, event: event?.event },
      extra: { event },
    });
  }
}

// Setup with error handling
const analytics = new AnalyticsManager({
  adapters: [...],
  context: {...},
  onError: handleAnalyticsError,
});
```

## TypeScript Benefits

### Type Safety

```typescript
// ✅ Type-safe event tracking
await analytics.track('view_product', {
  productId: 'saree-001',
  productName: 'Red Saree',
  category: 'Sarees',
  price: 2000,
  currency: 'INR',
  // TypeScript ensures all required properties are provided
});

// ❌ This will cause TypeScript error
await analytics.track('view_product', {
  productId: 'saree-001',
  // Missing required properties!
});
```

### IntelliSense Support

The package provides full IntelliSense support for:
- Event names (autocomplete)
- Required and optional properties
- Property types and validation
- Method signatures and return types

### Event Property Extraction

```typescript
import type { EventProperties } from '@radhagsarees/analytics';

// Extract properties type for specific event
type ViewProductProps = EventProperties<'view_product'>;
type PurchaseProps = EventProperties<'purchase'>;

// Use in your functions
function createProductEvent(product: Product): ViewProductProps {
  return {
    productId: product.id,
    productName: product.name,
    // ... TypeScript ensures correct structure
  };
}
```

## Configuration

### Environment Variables

```bash
# PostHog configuration
NEXT_PUBLIC_POSTHOG_API_KEY=your_posthog_api_key
NEXT_PUBLIC_POSTHOG_ENDPOINT=https://app.posthog.com
POSTHOG_API_KEY=your_server_side_posthog_key

# Analytics settings
ANALYTICS_DEBUG=true
ANALYTICS_BATCH_SIZE=10
ANALYTICS_FLUSH_INTERVAL=30000
```

### Custom Adapter

```typescript
import type { AnalyticsAdapter } from '@radhagsarees/analytics';

class CustomAdapter implements AnalyticsAdapter {
  readonly name = 'custom';
  
  get isEnabled() {
    return true;
  }

  initialize(config, context) {
    // Custom initialization
  }

  async track(event, properties) {
    // Send to your analytics service
    await fetch('/api/analytics', {
      method: 'POST',
      body: JSON.stringify({ event, properties }),
    });
  }

  // ... implement other methods
}
```

This package provides a robust, type-safe analytics solution for the Radha G Sarees e-commerce platform with comprehensive event tracking capabilities.