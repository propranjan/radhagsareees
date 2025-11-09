/**
 * Performance Configuration and Monitoring
 * Centralized performance settings, budgets, and optimization rules
 */

export interface PerformanceBudgets {
  lcp: number; // Largest Contentful Paint (ms)
  fcp: number; // First Contentful Paint (ms)
  si: number;  // Speed Index (ms)
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time (ms)
  bundleSize: number; // JavaScript bundle size (bytes, gzipped)
  imageSize: number;  // Total image size (bytes)
  totalSize: number;  // Total page size (bytes)
}

export const performanceConfig = {
  // Performance budgets by page type
  budgets: {
    homepage: {
      lcp: 2500,
      fcp: 1800,
      si: 3000,
      cls: 0.1,
      tbt: 300,
      bundleSize: 250 * 1024, // 250KB gzipped
      imageSize: 1000 * 1024, // 1MB
      totalSize: 2000 * 1024  // 2MB
    } as PerformanceBudgets,
    
    productPage: {
      lcp: 2500, // Target: < 2.5s on mobile 4G
      fcp: 1500,
      si: 2800,
      cls: 0.1,
      tbt: 200,
      bundleSize: 200 * 1024, // 200KB gzipped (strict requirement)
      imageSize: 800 * 1024,  // 800KB
      totalSize: 1500 * 1024  // 1.5MB
    } as PerformanceBudgets,
    
    catalogPage: {
      lcp: 3000,
      fcp: 1800,
      si: 3500,
      cls: 0.15, // Higher tolerance for dynamic content
      tbt: 400,
      bundleSize: 300 * 1024, // 300KB gzipped
      imageSize: 1500 * 1024, // 1.5MB (many product images)
      totalSize: 2500 * 1024  // 2.5MB
    } as PerformanceBudgets,
    
    // Mobile-specific budgets (stricter)
    mobile: {
      productPage: {
        lcp: 2500, // Core Web Vital target
        fcp: 2000,
        si: 3500,
        cls: 0.1,
        tbt: 300,
        bundleSize: 200 * 1024, // Same as desktop
        imageSize: 600 * 1024,  // Smaller images for mobile
        totalSize: 1200 * 1024  // 1.2MB
      } as PerformanceBudgets
    }
  },

  // Critical resource loading strategy
  loadingStrategy: {
    // Resources to preload
    preload: [
      'fonts/inter-var.woff2',
      'images/hero-banner.webp'
    ],
    
    // Resources to prefetch
    prefetch: [
      '/api/products/featured',
      '/catalog'
    ],
    
    // Resources to load on demand
    lazyLoad: {
      // TensorFlow.js and ML models - only load when needed
      ml: [
        '@tensorflow/tfjs',
        '@tensorflow-models/body-pix',
        'models/body-segmentation.json',
        'models/pose-detection.json'
      ],
      
      // Try-on related components
      tryOn: [
        'components/TryOnCanvas',
        'components/ARFilters',
        'lib/image-processing'
      ],
      
      // Analytics and tracking
      analytics: [
        'gtag',
        'hotjar',
        'mixpanel'
      ],
      
      // Non-critical UI components
      ui: [
        'components/ProductRecommendations',
        'components/ReviewsSection',
        'components/SocialShare'
      ]
    }
  },

  // Image optimization settings
  imageOptimization: {
    formats: ['webp', 'avif', 'jpg'],
    sizes: {
      thumbnail: { width: 300, height: 300, quality: 80 },
      card: { width: 600, height: 800, quality: 85 },
      hero: { width: 1200, height: 1600, quality: 90 },
      gallery: { width: 800, height: 1067, quality: 85 }
    },
    
    // Responsive breakpoints
    breakpoints: [640, 768, 1024, 1280, 1536],
    
    // Lazy loading settings
    lazyLoading: {
      rootMargin: '50px',
      threshold: 0.1,
      fadeInDuration: 300
    }
  },

  // Bundle optimization
  bundleOptimization: {
    // Code splitting points
    chunks: {
      vendor: ['react', 'react-dom', 'next'],
      ui: ['@radix-ui', 'framer-motion'],
      ml: ['@tensorflow/tfjs', '@tensorflow-models/body-pix'],
      analytics: ['@analytics', 'gtag']
    },
    
    // Tree shaking configuration
    treeShaking: {
      sideEffects: false,
      usedExports: true,
      concatenateModules: true
    },
    
    // Minification settings
    minification: {
      removeConsole: process.env.NODE_ENV === 'production',
      removeDebugger: true,
      dropDeadCode: true
    }
  },

  // Performance monitoring
  monitoring: {
    // Web Vitals tracking
    webVitals: {
      enabled: true,
      reportingEndpoint: '/api/analytics/web-vitals',
      samplingRate: 0.1 // 10% sampling in production
    },
    
    // Real User Monitoring (RUM)
    rum: {
      enabled: true,
      trackInteractions: true,
      trackNavigation: true,
      trackResourceLoading: true
    },
    
    // Performance budget alerts
    budgetAlerts: {
      enabled: true,
      thresholds: {
        lcp: 2500,
        fcp: 1800,
        cls: 0.1,
        bundleSize: 200 * 1024
      },
      notifications: {
        slack: process.env.SLACK_PERFORMANCE_WEBHOOK,
        email: 'performance@radhagsarees.com'
      }
    }
  },

  // Caching strategy
  caching: {
    // Static assets
    static: {
      images: '1y',
      fonts: '1y',
      css: '1y',
      js: '1y'
    },
    
    // API responses
    api: {
      products: '1h',
      categories: '6h',
      user: '5m'
    },
    
    // Service Worker caching
    sw: {
      enabled: true,
      strategy: 'NetworkFirst', // For dynamic content
      staticStrategy: 'CacheFirst', // For static assets
      offlinePage: '/offline'
    }
  }
};

/**
 * Get performance budget for specific page
 */
export function getPerformanceBudget(
  page: keyof typeof performanceConfig.budgets,
  isMobile = false
): PerformanceBudgets {
  if (isMobile && page === 'productPage') {
    return performanceConfig.budgets.mobile.productPage;
  }
  
  return performanceConfig.budgets[page];
}

/**
 * Check if metric meets performance budget
 */
export function checkBudget(
  page: keyof typeof performanceConfig.budgets,
  metric: keyof PerformanceBudgets,
  value: number,
  isMobile = false
): { passes: boolean; budget: number; difference: number } {
  const budget = getPerformanceBudget(page, isMobile);
  const budgetValue = budget[metric];
  
  return {
    passes: value <= budgetValue,
    budget: budgetValue,
    difference: value - budgetValue
  };
}

/**
 * Performance monitoring helper
 */
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }

  // Track Web Vitals
  trackWebVital(name: string, value: number, id: string) {
    if (performanceConfig.monitoring.webVitals.enabled) {
      // Report to analytics
      this.reportMetric('web-vital', { name, value, id });
    }
  }

  // Track custom performance metrics
  trackCustomMetric(name: string, value: number, metadata?: any) {
    this.reportMetric('custom', { name, value, metadata });
  }

  // Check performance budgets
  checkBudgets(page: string, metrics: Record<string, number>) {
    const violations = [];
    
    for (const [metric, value] of Object.entries(metrics)) {
      if (metric in performanceConfig.budgets.productPage) {
        const check = checkBudget(
          'productPage',
          metric as keyof PerformanceBudgets,
          value
        );
        
        if (!check.passes) {
          violations.push({
            metric,
            value,
            budget: check.budget,
            violation: check.difference
          });
        }
      }
    }
    
    if (violations.length > 0) {
      this.reportViolations(page, violations);
    }
    
    return violations;
  }

  private reportMetric(type: string, data: any) {
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'performance_metric', {
        custom_parameter_type: type,
        custom_parameter_data: JSON.stringify(data)
      });
    }
    
    // Also send to custom analytics endpoint
    fetch('/api/analytics/performance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, ...data })
    }).catch(console.error);
  }

  private reportViolations(page: string, violations: any[]) {
    console.warn('Performance budget violations:', { page, violations });
    
    // Report to monitoring service
    this.reportMetric('budget_violation', { page, violations });
  }
}

export default performanceConfig;