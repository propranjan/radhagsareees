// Load and validate environment variables in development only
if (process.env.NODE_ENV !== 'production') {
  require('dotenv-safe').config({
    example: '.env.example',
    allowEmptyValues: false,
  });
}

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@radhagsareees/ui', '@radhagsareees/db'],
  eslint: {
    // Avoid failing the build on ESLint config issues while we stabilize monorepo configs
    ignoreDuringBuilds: true,
  },
  env: {
    // Make sure these are available to the client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
};

module.exports = nextConfig;