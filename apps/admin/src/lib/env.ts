import dotenvSafe from 'dotenv-safe';
import path from 'path';

// Load and validate environment variables on boot (skip on Vercel/CI)
if (!process.env.VERCEL && !process.env.CI) {
  try {
    dotenvSafe.config({
      example: path.join(process.cwd(), '.env.example'),
      allowEmptyValues: true, // Allow optional vars
    });
  } catch (error: any) {
    console.error('🚨 Admin Environment Configuration Error:');
    console.error('═'.repeat(50));
    
    if (error.missing && error.missing.length > 0) {
      console.error('❌ Missing required environment variables:');
      error.missing.forEach((variable: string) => {
        console.error(`   • ${variable}`);
      });
      console.error();
    }
    
    if (error.parsed && Object.keys(error.parsed).length > 0) {
      console.error('⚠️  Found in .env file but not in .env.example:');
      Object.keys(error.parsed).forEach((variable) => {
        console.error(`   • ${variable}`);
      });
      console.error();
    }
    
    console.error('💡 How to fix:');
    console.error('   1. Copy .env.example to .env.local');
    console.error('   2. Fill in all required values');
    console.error('   3. Ensure all variables in .env.example are set');
    console.error();
    console.error('📖 Admin Setup Guide:');
    console.error('   Run admin dashboard on port 3001');
    console.error('═'.repeat(50));
    
    process.exit(1);
  }
}

// Additional validation for critical variables
function validateEnvironment() {
  const requiredVars = {
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN,
    SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN,
    WEBHOOK_SECRET: process.env.WEBHOOK_SECRET,
  };

  const errors: string[] = [];

  // Validate DATABASE_URL format
  if (requiredVars.DATABASE_URL && !requiredVars.DATABASE_URL.startsWith('postgresql://')) {
    errors.push('DATABASE_URL must be a valid PostgreSQL connection string (postgresql://...)');
  }

  // Validate NEXTAUTH_SECRET length
  if (requiredVars.NEXTAUTH_SECRET && requiredVars.NEXTAUTH_SECRET.length < 32) {
    errors.push('NEXTAUTH_SECRET must be at least 32 characters long for security');
  }

  // Validate Stripe keys format
  if (requiredVars.STRIPE_SECRET_KEY && !requiredVars.STRIPE_SECRET_KEY.startsWith('sk_')) {
    errors.push('STRIPE_SECRET_KEY must start with "sk_" (secret key format)');
  }

  if (requiredVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY && !requiredVars.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.startsWith('pk_')) {
    errors.push('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY must start with "pk_" (publishable key format)');
  }

  // Validate Shopify domain format
  if (requiredVars.SHOPIFY_STORE_DOMAIN && !requiredVars.SHOPIFY_STORE_DOMAIN.includes('.myshopify.com')) {
    errors.push('SHOPIFY_STORE_DOMAIN must be in format: your-store.myshopify.com');
  }

  // Validate webhook secret length
  if (requiredVars.WEBHOOK_SECRET && requiredVars.WEBHOOK_SECRET.length < 16) {
    errors.push('WEBHOOK_SECRET must be at least 16 characters long for security');
  }

  if (errors.length > 0) {
    console.error('🚨 Admin Environment Validation Failed:');
    console.error('═'.repeat(50));
    errors.forEach((error) => {
      console.error(`❌ ${error}`);
    });
    console.error('═'.repeat(50));
    process.exit(1);
  }

  // Success message
  if (process.env.NODE_ENV === 'development') {
    console.log('✅ Admin environment variables validated successfully');
  }
}

// Run validation
validateEnvironment();

// Export validated environment with proper types
export const env = {
  // Database
  DATABASE_URL: process.env.DATABASE_URL!,
  
  // Authentication
  NEXTAUTH_URL: process.env.NEXTAUTH_URL!,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET!,
  
  // Stripe
  STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY!,
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  
  // Shopify
  SHOPIFY_STORE_DOMAIN: process.env.SHOPIFY_STORE_DOMAIN!,
  SHOPIFY_ACCESS_TOKEN: process.env.SHOPIFY_ACCESS_TOKEN!,
  
  // Security
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET!,
  
  // Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  
  // Admin Specific
  ADMIN_EMAIL: process.env.ADMIN_EMAIL,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  
  // Optional
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET,
};