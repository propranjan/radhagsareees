/**
 * Security Headers Configuration
 * Implements Content Security Policy, CORS, and other security headers
 */

export interface SecurityHeadersConfig {
  enableCSP: boolean;
  enableCORS: boolean;
  allowedOrigins: string[];
  isDevelopment: boolean;
}

/**
 * Content Security Policy Configuration
 */
export function getCSPDirectives(config: SecurityHeadersConfig) {
  const { isDevelopment } = config;
  
  // Base CSP directives
  const baseDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js in development
      "'unsafe-eval'", // Required for development hot reload
      'https://checkout.razorpay.com',
      'https://www.googletagmanager.com',
      'https://www.google-analytics.com',
      ...(isDevelopment ? ["'unsafe-inline'", "'unsafe-eval'"] : [])
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for styled-components and Tailwind
      'https://fonts.googleapis.com'
    ],
    'img-src': [
      "'self'",
      'data:', // For base64 images
      'blob:', // For canvas/try-on images
      'https://res.cloudinary.com', // Cloudinary CDN
      'https://images.unsplash.com', // Demo images
      'https://www.google-analytics.com'
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com'
    ],
    'connect-src': [
      "'self'",
      'https://api.razorpay.com',
      'https://www.google-analytics.com',
      'https://api.cloudinary.com',
      ...(isDevelopment ? ['ws://localhost:*', 'http://localhost:*'] : [])
    ],
    'frame-src': [
      "'self'",
      'https://api.razorpay.com',
      'https://checkout.razorpay.com'
    ],
    'media-src': [
      "'self'",
      'blob:', // For camera access
      'https://res.cloudinary.com'
    ],
    'worker-src': [
      "'self'",
      'blob:' // For web workers
    ],
    'child-src': [
      "'self'",
      'blob:'
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': []
  };

  // Convert to CSP string format
  return Object.entries(baseDirectives)
    .map(([directive, sources]) => {
      if (sources.length === 0) {
        return directive;
      }
      return `${directive} ${sources.join(' ')}`;
    })
    .join('; ');
}

/**
 * Security Headers for API Routes
 */
export function getSecurityHeaders(config: SecurityHeadersConfig): Record<string, string> {
  const headers: Record<string, string> = {
    // Content Security Policy
    'Content-Security-Policy': getCSPDirectives(config),
    
    // Prevent MIME type sniffing
    'X-Content-Type-Options': 'nosniff',
    
    // Enable XSS protection
    'X-XSS-Protection': '1; mode=block',
    
    // Prevent clickjacking
    'X-Frame-Options': 'DENY',
    
    // Prevent information disclosure
    'X-Powered-By': '', // Remove X-Powered-By header
    
    // Referrer policy
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    
    // Permissions policy (formerly Feature Policy)
    'Permissions-Policy': [
      'camera=(self)',
      'microphone=()',
      'geolocation=()',
      'interest-cohort=()', // Disable FLoC
      'payment=(self "https://api.razorpay.com")'
    ].join(', '),
    
    // HTTP Strict Transport Security (HSTS)
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
  };

  // CORS headers if enabled
  if (config.enableCORS) {
    const allowedOrigins = config.allowedOrigins.join(', ');
    headers['Access-Control-Allow-Origin'] = allowedOrigins;
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';
    headers['Access-Control-Max-Age'] = '86400'; // 24 hours
  }

  return headers;
}

/**
 * Next.js Security Headers Configuration
 */
export function getNextSecurityConfig(config: SecurityHeadersConfig) {
  return {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          ...(config.isDevelopment ? ["'unsafe-eval'", "'unsafe-inline'"] : []),
          'https://checkout.razorpay.com',
          'https://www.googletagmanager.com'
        ],
        styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https://res.cloudinary.com',
          'https://images.unsplash.com'
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        connectSrc: [
          "'self'",
          'https://api.razorpay.com',
          'https://www.google-analytics.com',
          ...(config.isDevelopment ? ['ws://localhost:*'] : [])
        ],
        frameSrc: ['https://api.razorpay.com'],
        mediaSrc: ["'self'", 'blob:', 'https://res.cloudinary.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noopen: true,
    nosniff: true,
    xssFilter: true,
    referrerPolicy: 'strict-origin-when-cross-origin'
  };
}