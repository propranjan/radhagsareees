/**
 * API Route Security Middleware
 * Applies security headers to all API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSecurityHeaders, type SecurityHeadersConfig } from './headers';

/**
 * Security middleware for API routes
 */
export function withSecurityHeaders(handler: Function) {
  return async (request: NextRequest, ...args: any[]) => {
    const config: SecurityHeadersConfig = {
      enableCSP: true,
      enableCORS: process.env.NODE_ENV === 'development',
      allowedOrigins: [
        process.env.NEXTAUTH_URL || 'http://localhost:3000',
        'https://*.vercel.app'
      ],
      isDevelopment: process.env.NODE_ENV === 'development'
    };

    try {
      // Call the original handler
      const response = await handler(request, ...args);
      
      // Apply security headers
      const securityHeaders = getSecurityHeaders(config);
      
      // If response is already a Response object
      if (response instanceof Response) {
        const newResponse = new NextResponse(response.body, {
          status: response.status,
          statusText: response.statusText,
          headers: response.headers
        });
        
        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          if (value) {
            newResponse.headers.set(key, value);
          }
        });
        
        return newResponse;
      }
      
      // If response is a NextResponse
      if (response && typeof response === 'object') {
        const nextResponse = NextResponse.json(response);
        
        // Add security headers
        Object.entries(securityHeaders).forEach(([key, value]) => {
          if (value) {
            nextResponse.headers.set(key, value);
          }
        });
        
        return nextResponse;
      }
      
      return response;
    } catch (error) {
      console.error('Security middleware error:', error);
      
      // Return error response with security headers
      const errorResponse = NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
      
      const securityHeaders = getSecurityHeaders(config);
      Object.entries(securityHeaders).forEach(([key, value]) => {
        if (value) {
          errorResponse.headers.set(key, value);
        }
      });
      
      return errorResponse;
    }
  };
}

/**
 * CORS middleware for API routes
 */
export function withCORS(
  handler: Function,
  options: {
    origin?: string | string[];
    methods?: string[];
    credentials?: boolean;
  } = {}
) {
  return async (request: NextRequest, ...args: any[]) => {
    const {
      origin = [process.env.NEXTAUTH_URL || 'http://localhost:3000'],
      methods = ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      credentials = true
    } = options;

    // Handle preflight OPTIONS request
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: {
          'Access-Control-Allow-Origin': Array.isArray(origin) ? origin.join(', ') : origin,
          'Access-Control-Allow-Methods': methods.join(', '),
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Allow-Credentials': credentials.toString(),
          'Access-Control-Max-Age': '86400'
        }
      });
    }

    const response = await handler(request, ...args);
    
    // Add CORS headers to response
    if (response instanceof NextResponse) {
      response.headers.set('Access-Control-Allow-Origin', Array.isArray(origin) ? origin.join(', ') : origin);
      response.headers.set('Access-Control-Allow-Credentials', credentials.toString());
    }
    
    return response;
  };
}

/**
 * Combine multiple middlewares
 */
export function withMiddleware(...middlewares: Function[]) {
  return (handler: Function) => {
    return middlewares.reduceRight(
      (acc, middleware) => middleware(acc),
      handler
    );
  };
}