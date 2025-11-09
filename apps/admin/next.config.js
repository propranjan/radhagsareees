// Load and validate environment variables at build time
require('dotenv-safe').config({
  example: '.env.example',
  allowEmptyValues: false,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@radhagsareees/ui', '@radhagsareees/db'],
  env: {
    // Make sure these are available to the client
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
  },
};

module.exports = nextConfig;