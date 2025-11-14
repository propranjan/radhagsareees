// Load and validate environment variables in local development only
// Skip on Vercel/CI where env vars are injected by platform
if (!process.env.VERCEL && !process.env.CI) {
  require('dotenv-safe').config({
    example: '.env.example',
    allowEmptyValues: true,
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