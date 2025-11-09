/**
 * Zod Validation Middleware
 * Enforces schema validation on all API request bodies
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

export interface ValidationConfig {
  body?: z.ZodSchema;
  query?: z.ZodSchema;
  params?: z.ZodSchema;
}

/**
 * Validation error response format
 */
export interface ValidationError {
  error: 'Validation failed';
  message: string;
  details: Array<{
    field: string;
    message: string;
    code: string;
  }>;
}

/**
 * Parse and validate request body
 */
async function parseRequestBody(request: NextRequest): Promise<any> {
  const contentType = request.headers.get('content-type') || '';
  
  if (contentType.includes('application/json')) {
    try {
      return await request.json();
    } catch (error) {
      throw new Error('Invalid JSON in request body');
    }
  }
  
  if (contentType.includes('application/x-www-form-urlencoded')) {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      if (data[key]) {
        // Handle multiple values for same key
        data[key] = Array.isArray(data[key]) ? [...data[key], value] : [data[key], value];
      } else {
        data[key] = value;
      }
    });
    
    return data;
  }
  
  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      data[key] = value;
    });
    
    return data;
  }
  
  return {};
}

/**
 * Format Zod errors for API response
 */
function formatZodErrors(error: z.ZodError): ValidationError['details'] {
  return error.errors.map(err => ({
    field: err.path.join('.') || 'root',
    message: err.message,
    code: err.code
  }));
}

/**
 * Validation middleware factory
 */
export function withValidation(config: ValidationConfig) {
  return function <T extends Function>(handler: T): T {
    return (async (request: NextRequest, ...args: any[]) => {
      try {
        const validatedData: Record<string, any> = {};
        
        // Validate request body
        if (config.body && ['POST', 'PUT', 'PATCH'].includes(request.method)) {
          try {
            const body = await parseRequestBody(request);
            validatedData.body = config.body.parse(body);
          } catch (error) {
            if (error instanceof z.ZodError) {
              return NextResponse.json(
                {
                  error: 'Validation failed',
                  message: 'Request body validation failed',
                  details: formatZodErrors(error)
                } as ValidationError,
                { status: 400 }
              );
            }
            
            return NextResponse.json(
              {
                error: 'Validation failed',
                message: error instanceof Error ? error.message : 'Invalid request body',
                details: []
              } as ValidationError,
              { status: 400 }
            );
          }
        }
        
        // Validate query parameters
        if (config.query) {
          try {
            const url = new URL(request.url);
            const query: Record<string, string | string[]> = {};
            
            url.searchParams.forEach((value, key) => {
              if (query[key]) {
                query[key] = Array.isArray(query[key]) ? [...(query[key] as string[]), value] : [query[key] as string, value];
              } else {
                query[key] = value;
              }
            });
            
            validatedData.query = config.query.parse(query);
          } catch (error) {
            if (error instanceof z.ZodError) {
              return NextResponse.json(
                {
                  error: 'Validation failed',
                  message: 'Query parameters validation failed',
                  details: formatZodErrors(error)
                } as ValidationError,
                { status: 400 }
              );
            }
          }
        }
        
        // Validate URL parameters (for dynamic routes)
        if (config.params && args.length > 0 && typeof args[0] === 'object' && args[0].params) {
          try {
            validatedData.params = config.params.parse(args[0].params);
            args[0] = { ...args[0], params: validatedData.params };
          } catch (error) {
            if (error instanceof z.ZodError) {
              return NextResponse.json(
                {
                  error: 'Validation failed',
                  message: 'URL parameters validation failed',
                  details: formatZodErrors(error)
                } as ValidationError,
                { status: 400 }
              );
            }
          }
        }
        
        // Attach validated data to request object
        (request as any).validated = validatedData;
        
        // Call the original handler
        return await handler(request, ...args);
        
      } catch (error) {
        console.error('Validation middleware error:', error);
        return NextResponse.json(
          {
            error: 'Internal server error',
            message: 'An unexpected error occurred during validation'
          },
          { status: 500 }
        );
      }
    }) as T;
  };
}

/**
 * Helper to get validated data from request
 */
export function getValidatedData(request: NextRequest) {
  return (request as any).validated || {};
}

/**
 * Common validation schemas
 */
export const commonSchemas = {
  // Pagination
  pagination: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).default('1'),
    limit: z.string().regex(/^\d+$/).transform(Number).default('10'),
    sort: z.string().optional(),
    order: z.enum(['asc', 'desc']).default('desc')
  }),
  
  // MongoDB ObjectId
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format'),
  
  // UUID
  uuid: z.string().uuid('Invalid UUID format'),
  
  // Email
  email: z.string().email('Invalid email format').toLowerCase(),
  
  // Phone number (Indian format)
  phoneNumber: z.string().regex(/^(\+91|91)?[6789]\d{9}$/, 'Invalid Indian phone number'),
  
  // Price (in paise)
  price: z.number().int().min(0, 'Price must be non-negative'),
  
  // Product size
  productSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
  
  // Image URL
  imageUrl: z.string().url('Invalid image URL'),
  
  // Product category
  category: z.string().min(1, 'Category is required').max(50, 'Category too long'),
  
  // Rating (1-5 stars)
  rating: z.number().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
  
  // Review text
  reviewText: z.string().min(10, 'Review must be at least 10 characters').max(1000, 'Review too long')
};

/**
 * Pre-built validation schemas for common endpoints
 */
export const validationSchemas = {
  // Product creation/update
  product: {
    body: z.object({
      name: z.string().min(1, 'Product name is required').max(100, 'Name too long'),
      description: z.string().min(10, 'Description must be at least 10 characters').max(2000, 'Description too long'),
      price: commonSchemas.price,
      category: commonSchemas.category,
      images: z.array(commonSchemas.imageUrl).min(1, 'At least one image is required'),
      sizes: z.array(commonSchemas.productSize).min(1, 'At least one size is required'),
      tags: z.array(z.string()).optional(),
      isActive: z.boolean().default(true)
    })
  },
  
  // Review creation
  review: {
    body: z.object({
      productId: commonSchemas.objectId,
      rating: commonSchemas.rating,
      title: z.string().min(1, 'Review title is required').max(100, 'Title too long'),
      content: commonSchemas.reviewText,
      images: z.array(commonSchemas.imageUrl).optional()
    })
  },
  
  // Checkout
  checkout: {
    body: z.object({
      items: z.array(z.object({
        productId: commonSchemas.objectId,
        size: commonSchemas.productSize,
        quantity: z.number().int().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 items per product')
      })).min(1, 'At least one item is required'),
      shippingAddress: z.object({
        fullName: z.string().min(1, 'Full name is required'),
        phoneNumber: commonSchemas.phoneNumber,
        addressLine1: z.string().min(1, 'Address line 1 is required'),
        addressLine2: z.string().optional(),
        city: z.string().min(1, 'City is required'),
        state: z.string().min(1, 'State is required'),
        pincode: z.string().regex(/^\d{6}$/, 'Invalid pincode'),
        country: z.string().default('India')
      }),
      paymentMethod: z.enum(['razorpay', 'cod']),
      couponCode: z.string().optional()
    })
  },
  
  // User profile update
  profile: {
    body: z.object({
      name: z.string().min(1, 'Name is required').max(50, 'Name too long').optional(),
      email: commonSchemas.email.optional(),
      phoneNumber: commonSchemas.phoneNumber.optional(),
      dateOfBirth: z.string().datetime().optional(),
      gender: z.enum(['male', 'female', 'other']).optional()
    })
  }
};