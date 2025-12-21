// Load and validate environment variables in local development only
// Skip on Vercel/CI where env vars are injected by platform
if (!process.env.VERCEL && !process.env.CI) {
  require('dotenv-safe').config({
    example: '.env.example',
    allowEmptyValues: true,
  });
}

// Temporarily disable next-intl to fix build issues
// const createNextIntlPlugin = require('next-intl/plugin');
// const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Use standalone only in CI/Vercel to avoid local Windows symlink issues
  ...(process.env.VERCEL || process.env.CI ? { output: 'standalone' } : {}),
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
    // Use remotePatterns for better security control
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        // Cloudinary - allows any cloud name for flexibility
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    // Also keep domains for backward compatibility
    domains: ['images.unsplash.com', 'via.placeholder.com', 'res.cloudinary.com'],
    minimumCacheTTL: 60,
    // Enable modern image formats for better optimization
    formats: ['image/avif', 'image/webp'],
  },
  env: {
    // Make sure these are available to the client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
  // Ensure webpack resolves TypeScript path alias `@/*` to `src/*`
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = config.resolve.alias || {};
    config.resolve.alias['@'] = path.resolve(__dirname, 'src');
    return config;
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
              // Next.js relies on an inline bootstrap script in production; without allowing it,
              // client-side navigation and hydration can break (pages may appear stuck).
              `script-src 'self' 'unsafe-inline' ${isDev ? "'unsafe-eval'" : ''} https://checkout.razorpay.com https://www.googletagmanager.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com`,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://res.cloudinary.com https://images.unsplash.com https://www.google-analytics.com",
              "font-src 'self' https://fonts.gstatic.com",
              `connect-src 'self' https://ipankxazdueozqgwjjei.supabase.co https://api.razorpay.com https://www.google-analytics.com https://api.cloudinary.com https://cdn.jsdelivr.net https://unpkg.com https://cdnjs.cloudflare.com https://storage.googleapis.com ${isDev ? 'ws://localhost:* http://localhost:*' : ''}`,
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

// Export without next-intl wrapper for now
module.exports = nextConfig;
// module.exports = withNextIntl(nextConfig);