/**
 * Environment validation utility for runtime checks
 * Use this in API routes and server-side code for additional safety
 */

export interface EnvValidationError {
  variable: string;
  message: string;
  required: boolean;
}

export function validateEnvironmentVariables(): {
  isValid: boolean;
  errors: EnvValidationError[];
} {
  const errors: EnvValidationError[] = [];

  // Required environment variables with validation rules
  const validations = [
    {
      variable: 'DATABASE_URL',
      value: process.env.DATABASE_URL,
      required: true,
      validator: (value: string) => value.startsWith('postgresql://'),
      message: 'Must be a valid PostgreSQL connection string (postgresql://...)',
    },
    {
      variable: 'NEXTAUTH_SECRET',
      value: process.env.NEXTAUTH_SECRET,
      required: true,
      validator: (value: string) => value.length >= 32,
      message: 'Must be at least 32 characters long for security',
    },
    {
      variable: 'STRIPE_SECRET_KEY',
      value: process.env.STRIPE_SECRET_KEY,
      required: true,
      validator: (value: string) => value.startsWith('sk_'),
      message: 'Must start with "sk_" (Stripe secret key format)',
    },
    {
      variable: 'NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
      value: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
      required: true,
      validator: (value: string) => value.startsWith('pk_'),
      message: 'Must start with "pk_" (Stripe publishable key format)',
    },
    {
      variable: 'SHOPIFY_STORE_DOMAIN',
      value: process.env.SHOPIFY_STORE_DOMAIN,
      required: true,
      validator: (value: string) => value.includes('.myshopify.com'),
      message: 'Must be in format: your-store.myshopify.com',
    },
    {
      variable: 'SHOPIFY_ACCESS_TOKEN',
      value: process.env.SHOPIFY_ACCESS_TOKEN,
      required: true,
      validator: (value: string) => value.length > 0,
      message: 'Must be a valid Shopify access token',
    },
    {
      variable: 'WEBHOOK_SECRET',
      value: process.env.WEBHOOK_SECRET,
      required: true,
      validator: (value: string) => value.length >= 16,
      message: 'Must be at least 16 characters long for security',
    },
    // Optional but validated if present
    {
      variable: 'CLOUDINARY_CLOUD_NAME',
      value: process.env.CLOUDINARY_CLOUD_NAME,
      required: false,
      validator: (value: string) => value.length > 0,
      message: 'Must be a valid Cloudinary cloud name if provided',
    },
    {
      variable: 'CLOUDINARY_API_KEY',
      value: process.env.CLOUDINARY_API_KEY,
      required: false,
      validator: (value: string) => /^\d+$/.test(value),
      message: 'Must be a valid Cloudinary API key (numeric) if provided',
    },
  ];

  for (const validation of validations) {
    const { variable, value, required, validator, message } = validation;

    // Check if required variable is missing
    if (required && (!value || value.trim() === '')) {
      errors.push({
        variable,
        message: `Required environment variable is missing`,
        required: true,
      });
      continue;
    }

    // Skip validation for optional empty variables
    if (!required && (!value || value.trim() === '')) {
      continue;
    }

    // Run custom validator if value exists
    if (value && validator && !validator(value)) {
      errors.push({
        variable,
        message,
        required,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates environment and throws an error with helpful message if invalid
 * Use this in API routes for fail-fast behavior
 */
export function requireValidEnvironment(): void {
  const validation = validateEnvironmentVariables();
  
  if (!validation.isValid) {
    const errorMessage = [
      '🚨 Environment Validation Failed:',
      '═'.repeat(50),
      ...validation.errors.map(error => 
        `❌ ${error.variable}: ${error.message}`
      ),
      '═'.repeat(50),
      '💡 Check your .env.local file and ensure all required variables are set correctly.',
    ].join('\n');
    
    throw new Error(errorMessage);
  }
}

/**
 * Middleware function for API routes to validate environment
 */
export function withEnvValidation<T extends any[], R>(
  handler: (...args: T) => R
) {
  return (...args: T): R => {
    requireValidEnvironment();
    return handler(...args);
  };
}