# Performance Optimization Guide

## Overview

This guide covers the comprehensive performance optimization system implemented for Radha G Sarees e-commerce platform. The system includes performance budgets, lazy loading, automated testing, and bundle analysis.

## Performance Budgets

### Core Web Vitals Targets

| Metric | Desktop | Mobile | Description |
|--------|---------|--------|-------------|
| **LCP** | ≤ 2.5s | ≤ 2.5s | Largest Contentful Paint - main content load time |
| **FCP** | ≤ 1.8s | ≤ 2.0s | First Contentful Paint - initial render time |
| **CLS** | ≤ 0.1 | ≤ 0.1 | Cumulative Layout Shift - visual stability |
| **TBT** | ≤ 300ms | ≤ 300ms | Total Blocking Time - interactivity |
| **SI** | ≤ 3.0s | ≤ 3.5s | Speed Index - visual load progression |

### Resource Budget Limits

| Resource | Desktop | Mobile | Notes |
|----------|---------|--------|-------|
| **JS Bundle** | 200KB | 200KB | Gzipped size for product page |
| **Images** | 800KB | 600KB | Total image weight per page |
| **Total Size** | 1.5MB | 1.2MB | Complete page weight |

### Performance Scores

- **Performance**: ≥ 90/100
- **Accessibility**: ≥ 95/100
- **Best Practices**: ≥ 90/100
- **SEO**: ≥ 90/100

## Lazy Loading Implementation

### ML Libraries Optimization

The TensorFlow.js and BodyPix libraries are lazy-loaded only when the virtual try-on modal opens:

```typescript
// Lazy loading configuration
const LAZY_LOADING_CONFIG = {
  tensorflow: {
    timeout: 30000,
    priority: 'high',
    preload: false
  },
  bodypix: {
    timeout: 30000,
    priority: 'high',
    preload: false
  }
};
```

### Component Lazy Loading

```typescript
// Dynamic imports for heavy components
const TryOnCanvas = lazy(() => import('./TryOnCanvas'));

// Usage with Suspense
<Suspense fallback={<LoadingSpinner />}>
  <TryOnCanvas />
</Suspense>
```

### Benefits

- **Initial Bundle Reduction**: ~2MB reduction in initial JS bundle
- **Faster Page Load**: 40-60% improvement in initial page load time
- **Better UX**: Progressive loading with visual feedback
- **Network Efficiency**: Load only when needed

## Performance Monitoring

### Real User Monitoring (RUM)

```typescript
// Web Vitals tracking
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

// Track and report metrics
getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### Performance Observer API

```typescript
// Long task monitoring
const observer = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    if (entry.duration > 50) {
      console.warn('Long task detected:', entry.duration, 'ms');
    }
  });
});
observer.observe({ entryTypes: ['longtask'] });
```

## Automated Performance Testing

### Lighthouse CI Integration

The project uses Lighthouse CI for automated performance testing in the GitHub Actions pipeline.

#### Configuration (`.lighthouseci/lighthouserc.json`)

```json
{
  "ci": {
    "collect": {
      "numberOfRuns": 3,
      "url": [
        "http://localhost:3000/",
        "http://localhost:3000/catalog",
        "http://localhost:3000/product/sample-saree"
      ],
      "settings": {
        "preset": "desktop",
        "chromeFlags": "--no-sandbox --disable-dev-shm-usage"
      }
    },
    "assert": {
      "assertions": {
        "categories:performance": ["error", {"minScore": 0.9}],
        "categories:accessibility": ["error", {"minScore": 0.95}],
        "largest-contentful-paint": ["error", {"maxNumericValue": 2500}],
        "cumulative-layout-shift": ["error", {"maxNumericValue": 0.1}]
      }
    },
    "upload": {
      "target": "temporary-public-storage"
    }
  }
}
```

### GitHub Actions Workflow

```yaml
- name: Performance Testing
  run: |
    npm run build
    npm start &
    sleep 10
    npm run performance:lighthouse
    npm run performance:check
```

## Bundle Analysis

### Automated Bundle Analysis

The bundle analyzer provides detailed insights into JavaScript bundle composition:

```bash
# Analyze all apps
npm run analyze:bundle

# Analyze specific app
npm run analyze:bundle:web
npm run analyze:bundle:admin

# CI mode (fails on budget violations)
npm run analyze:bundle:ci
```

### Bundle Analysis Features

1. **Size Analysis**: Total, parsed, and gzipped sizes
2. **Budget Enforcement**: Automatic failure on violations
3. **Dependency Tracking**: Package-level size breakdown
4. **Optimization Suggestions**: Actionable recommendations
5. **CI Integration**: Automated checks in pull requests

### Sample Output

```
📦 Bundle Analysis Report
========================

📊 Total Bundle Size: 187.3 KB (gzipped)
✅ Under budget: 200 KB (-12.7 KB remaining)

📈 Size Breakdown:
  • React & DOM: 45.2 KB (24.1%)
  • TensorFlow.js: 0 KB (lazy loaded)
  • UI Components: 38.7 KB (20.7%)
  • Business Logic: 42.1 KB (22.5%)
  • Utilities: 28.4 KB (15.2%)
  • Other: 32.9 KB (17.6%)

🎯 Optimization Suggestions:
  ✓ ML libraries successfully lazy loaded
  ✓ Code splitting implemented
  • Consider tree-shaking unused lodash functions
  • Optimize image components with next/image
```

## Performance Optimization Strategies

### Code Splitting

```typescript
// Route-based splitting
const CatalogPage = dynamic(() => import('./catalog/page'), {
  loading: () => <PageSkeleton />
});

// Component-based splitting
const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  ssr: false
});
```

### Image Optimization

```typescript
// Next.js optimized images
import Image from 'next/image';

<Image
  src="/saree-image.jpg"
  alt="Beautiful Saree"
  width={400}
  height={600}
  priority={isAboveFold}
  sizes="(max-width: 768px) 100vw, 50vw"
/>
```

### Resource Hints

```html
<!-- Preload critical resources -->
<link rel="preload" href="/fonts/main.woff2" as="font" type="font/woff2" crossorigin>

<!-- Preconnect to external domains -->
<link rel="preconnect" href="https://cdn.tensorflow.org">

<!-- Prefetch likely next pages -->
<link rel="prefetch" href="/catalog">
```

### Caching Strategy

```typescript
// Service Worker caching
const CACHE_STRATEGIES = {
  static: 'CacheFirst',      // CSS, JS, images
  api: 'NetworkFirst',       // API calls
  pages: 'StaleWhileRevalidate'  // HTML pages
};
```

## Performance Budget Monitoring

### Automated Budget Checks

```bash
# Run performance budget check
npm run performance:check

# Check against Lighthouse reports
node scripts/performance-budget-check.js
```

### Budget Violation Handling

When budgets are exceeded:

1. **CI Failure**: Pull requests fail if budgets exceeded
2. **Detailed Reports**: Specific metrics and suggestions provided
3. **Optimization Guidance**: Automated recommendations generated
4. **Historical Tracking**: Performance trends monitored over time

### Sample Violation Report

```
❌ BUDGET VIOLATIONS:

METRIC VIOLATIONS (2):
  • lcp (mobile): 2.8s vs 2.5s (+12.0%)
  • bundleSize (desktop): 245KB vs 200KB (+22.5%)

💡 OPTIMIZATION SUGGESTIONS:
  🎯 LCP Optimization:
    - Optimize largest image/element
    - Use priority hints for critical resources
    - Enable server-side rendering

  📦 Bundle Size Optimization:
    - Enable code splitting
    - Lazy load non-critical components
    - Remove unused dependencies
```

## Network-Aware Loading

### Connection Speed Detection

```typescript
// Adapt loading strategy based on connection
const connection = navigator.connection;
const isSlowConnection = connection?.effectiveType === '2g' || 
                        connection?.effectiveType === 'slow-2g';

// Reduce quality for slow connections
const imageQuality = isSlowConnection ? 50 : 80;
```

### Progressive Enhancement

```typescript
// Load features progressively
const loadAdvancedFeatures = () => {
  if (window.performance.memory?.usedJSHeapSize < 100 * 1024 * 1024) {
    // Load advanced features only if memory permits
    return import('./advanced-features');
  }
};
```

## Performance Testing Guide

### Local Performance Testing

```bash
# 1. Build the application
npm run build

# 2. Start production server
npm start

# 3. Run Lighthouse CI
npm run performance:lighthouse

# 4. Check budgets
npm run performance:check
```

### Continuous Integration

The CI pipeline automatically:

1. Builds all applications
2. Starts test servers
3. Runs Lighthouse tests (desktop + mobile)
4. Validates performance budgets
5. Generates detailed reports
6. Posts results to pull requests

### Performance Regression Detection

```typescript
// Automated performance regression alerts
const REGRESSION_THRESHOLDS = {
  lcp: 0.1,        // 10% increase fails
  fcp: 0.1,        // 10% increase fails
  bundleSize: 0.05 // 5% increase warns
};
```

## Advanced Optimization Techniques

### Critical CSS Extraction

```javascript
// Extract critical CSS for above-the-fold content
const criticalCSS = await extractCritical({
  html,
  css: stylesheets,
  dimensions: { width: 1200, height: 900 }
});
```

### Resource Prioritization

```typescript
// Priority loading for critical resources
const loadCriticalResources = () => {
  const criticalImages = document.querySelectorAll('[data-priority="high"]');
  criticalImages.forEach(img => {
    if ('loading' in img) {
      img.loading = 'eager';
    }
  });
};
```

### Memory Management

```typescript
// Cleanup heavy resources
useEffect(() => {
  return () => {
    // Cleanup TensorFlow.js models
    if (model) {
      model.dispose();
    }
    
    // Clear large caches
    if (imageCache.size > 50) {
      imageCache.clear();
    }
  };
}, []);
```

## Performance Metrics Dashboard

### Real-Time Monitoring

The application reports performance metrics to analytics:

```typescript
// Performance tracking
const trackPerformance = (metric: string, value: number) => {
  gtag('event', 'web_vitals', {
    event_category: 'Performance',
    event_label: metric,
    value: Math.round(value),
    custom_map: { metric_value: value }
  });
};
```

### Alerting System

```typescript
// Performance alerts
const ALERT_THRESHOLDS = {
  lcp: 4000,    // Alert if LCP > 4s
  cls: 0.25,    // Alert if CLS > 0.25
  fid: 300      // Alert if FID > 300ms
};
```

## Troubleshooting Guide

### Common Performance Issues

1. **Slow LCP**
   - Check largest element loading time
   - Optimize image sizes and formats
   - Use CDN for faster delivery
   - Enable browser caching

2. **High CLS**
   - Set dimensions for images and ads
   - Reserve space for dynamic content
   - Use CSS containment properties

3. **Large Bundle Size**
   - Enable tree-shaking
   - Remove unused dependencies
   - Implement code splitting
   - Use dynamic imports

4. **Poor FID/TBT**
   - Break up long JavaScript tasks
   - Use web workers for heavy computation
   - Defer non-critical JavaScript
   - Optimize third-party scripts

### Debugging Tools

```bash
# Bundle analysis with source maps
npm run analyze:bundle -- --analyze

# Performance profiling
npm run dev -- --profile

# Lighthouse debugging
npx lighthouse http://localhost:3000 --view
```

## Best Practices

### Development Guidelines

1. **Always test performance locally** before committing
2. **Use React DevTools Profiler** to identify bottlenecks
3. **Monitor bundle size** in development mode
4. **Implement performance budgets** for all critical pages
5. **Use lazy loading** for non-critical resources

### Code Review Checklist

- [ ] Performance impact assessed
- [ ] Bundle size within budgets
- [ ] Lazy loading implemented where appropriate
- [ ] Images optimized and properly sized
- [ ] Critical resources prioritized
- [ ] Performance tests passing

### Deployment Considerations

1. **CDN Configuration**: Ensure proper caching headers
2. **Compression**: Enable Brotli/Gzip compression
3. **HTTP/2**: Use HTTP/2 for multiplexing benefits
4. **Monitoring**: Set up real-time performance monitoring
5. **Alerting**: Configure performance regression alerts

## Future Enhancements

### Planned Optimizations

1. **Service Worker**: Implement advanced caching strategies
2. **Edge Computing**: Move processing closer to users
3. **Progressive Web App**: Add PWA capabilities
4. **WebAssembly**: Optimize ML computations with WASM
5. **Resource Hints**: Advanced preloading strategies

### Performance Goals

- **2024 Q1**: Achieve 95+ Lighthouse scores across all pages
- **2024 Q2**: Implement advanced lazy loading for all components
- **2024 Q3**: Deploy edge computing for global performance
- **2024 Q4**: Achieve <2s LCP on mobile globally

---

For questions or performance optimization support, please refer to the development team or create an issue in the repository.