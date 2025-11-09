#!/usr/bin/env node

const dotenvSafe = require('dotenv-safe');
const path = require('path');

console.log('🔍 Validating environment variables...');

// Function to validate environment for a specific app
function validateApp(appName, appPath) {
  console.log(`\n📁 Validating ${appName}...`);
  
  try {
    const envExamplePath = path.join(appPath, '.env.example');
    
    dotenvSafe.config({
      path: path.join(appPath, '.env.local'),
      example: envExamplePath,
      allowEmptyValues: false,
    });
    
    // Additional validations
    const requiredVars = {
      DATABASE_URL: process.env.DATABASE_URL,
      NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
      STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
      NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
      SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
    };

    const errors = [];

    // Validate DATABASE_URL format
    if (requiredVars.DATABASE_URL && !requiredVars.DATABASE_URL.startsWith('postgresql://')) {
      errors.push('DATABASE_URL must be a valid PostgreSQL connection string');
    }

    // Validate NEXTAUTH_SECRET length
    if (requiredVars.NEXTAUTH_SECRET && requiredVars.NEXTAUTH_SECRET.length < 32) {
      errors.push('NEXTAUTH_SECRET must be at least 32 characters long');
    }

    // Validate Stripe keys format
    if (requiredVars.STRIPE_SECRET_KEY && !requiredVars.STRIPE_SECRET_KEY.startsWith('sk_')) {
      errors.push('STRIPE_SECRET_KEY must start with "sk_"');
    }

    if (requiredVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !requiredVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
      errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_"');
    }

    // Validate Shopify domain format
    if (requiredVars.SHOPIFY_STORE_DOMAIN && !requiredVars.SHOPIFY_STORE_DOMAIN.includes('.myshopify.com')) {
      errors.push('SHOPIFY_STORE_DOMAIN must be in format: your-store.myshopify.com');
    }

    if (errors.length > 0) {
      console.error(`❌ ${appName} validation failed:`);
      errors.forEach(error => console.error(`   • ${error}`));
      return false;
    }

    console.log(`✅ ${appName} environment validated successfully`);
    return true;

  } catch (error) {
    console.error(`❌ ${appName} environment validation failed:`);
    
    if (error.missing && error.missing.length > 0) {
      console.error('   Missing required variables:');
      error.missing.forEach(variable => {
        console.error(`     • ${variable}`);
      });
    }
    
    if (error.parsed && Object.keys(error.parsed).length > 0) {
      console.error('   Extra variables found:');
      Object.keys(error.parsed).forEach(variable => {
        console.error(`     • ${variable}`);
      });
    }
    
    return false;
  }
}

// Validate both apps
const webValid = validateApp('Web App', './apps/web');
const adminValid = validateApp('Admin App', './apps/admin');

if (webValid && adminValid) {
  console.log('\n🎉 All environment validations passed!');
  console.log('\n🚀 You can now start the development servers:');
  console.log('   pnpm dev      # Start both apps');
  console.log('   pnpm web:dev  # Start web app only');
  console.log('   pnpm admin:dev # Start admin app only');
  process.exit(0);
} else {
  console.log('\n🚨 Environment validation failed!');
  console.log('\n💡 To fix:');
  console.log('   1. Copy .env.example files to .env.local in each app');
  console.log('   2. Fill in all required environment variables');
  console.log('   3. Run this script again: npm run validate-env');
  console.log('\n📖 Setup guide: README.md');
  process.exit(1);
}