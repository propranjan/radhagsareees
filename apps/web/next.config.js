// Load and validate environment variables in development only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config({
    example: '.env.example',
    allowEmptyValues: false,
  });
}

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Temporarily ignore type errors for build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Ignore ESLint errors during build
    ignoreDuringBuilds: true,
  },
  transpilePackages: ['@radhagsareees/ui', '@radhagsareees/db'],
  images: {
    domains: ['images.unsplash.com', 'via.placeholder.com', 'res.cloudinary.com'],
    minimumCacheTTL: 60,
  },
  env: {
    // Make sure these are available to the client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  // Security headers
  async headers() {
    const isDev = process.env.NODE_ENV === 'development';
    
    return [
      {
        source: '/(.*)',
        headers: [
          // Content Security Policy
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              `script-src 'self' ${isDev ? "'unsafe-eval' 'unsafe-inline'" : ''} https://checkout.razorpay.com https://www.googletagmanager.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.google-analytics.com",
              "font-src 'self' https://fonts.gstatic.com",
              `connect-src 'self' https://api.razorpay.com https://www.google-analytics.com https://api.cloudinary.com ${isDev ? 'ws://localhost:* http://localhost:*' : ''}`,
              "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
              "media-src 'self' blob: https://res.cloudinary.com",
              "worker-src 'self' blob:",
              "child-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              ...(isDev ? [] : ['upgrade-insecure-requests'])
            ].join('; ')
          },
          // Security headers
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(self), microphone=(), geolocation=(), interest-cohort=(), payment=(self "https://api.razorpay.com")'
          }
        ]
      },
      // API routes specific headers
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'X-Robots-Tag',
            value: 'noindex, nofollow'
          }
        ]
      }
    ];
  },
};

module.exports = withNextIntl(nextConfig);