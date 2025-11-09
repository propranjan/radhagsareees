/**
 * Correlation ID Middleware for Next.js API Routes
 * Generates and tracks correlation IDs across requests
 */
import { NextRequest, NextResponse } from 'next/server';
import { correlationId, createChildLogger, logRequest, logResponse } from '../lib/logger';

// Extend Request/Response types to include correlation ID
declare module 'next/server' {
  interface NextRequest {
    correlationId?: string;
    startTime?: number;
    logger?: any;
  }
}

/**
 * Correlation ID Middleware for Next.js 13+ App Router
 * Use in middleware.ts file
 */
export function correlationIdMiddleware(request: NextRequest) {
  // Generate or extract correlation ID
  let cId = correlationId.getFromHeaders(request.headers);
  
  if (!cId) {
    cId = correlationId.generate();
  }

  // Create response with correlation ID header
  const response = NextResponse.next();
  correlationId.setInHeaders(response.headers, cId);

  // Add correlation ID to request headers for downstream processing
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-correlation-id', cId);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}

/**
 * API Route Wrapper with Correlation ID and Logging
 * Use this to wrap API route handlers
 */
export function withCorrelationId<T extends any[], R>(
  handler: (req: any, res: any, ...args: T) => Promise<R> | R
) {
  return async (req: any, res: any, ...args: T): Promise<R> => {
    const startTime = Date.now();
    
    // Extract or generate correlation ID
    let cId = correlationId.getFromHeaders(req.headers);
    if (!cId) {
      cId = correlationId.generate();
    }

    // Set correlation ID in response headers
    res.setHeader('x-correlation-id', cId);
    
    // Attach correlation ID and logger to request
    req.correlationId = cId;
    req.startTime = startTime;
    req.logger = logRequest(req, cId);

    try {
      // Execute the handler
      const result = await handler(req, res, ...args);
      
      // Log successful response
      const responseTime = Date.now() - startTime;
      logResponse(req.logger, req, res, responseTime);
      
      return result;
    } catch (error) {
      // Log error response
      const responseTime = Date.now() - startTime;
      req.logger.error({
        err: error,
        responseTime,
        msg: `API Error in ${req.method} ${req.url}`
      });
      
      // Re-throw error for proper error handling
      throw error;
    }
  };
}

/**
 * Enhanced API Route Wrapper with Request/Response Logging
 * Provides more detailed logging for API routes
 */
export function withStructuredLogging<T extends any[], R>(
  handler: (req: any, res: any, ...args: T) => Promise<R> | R,
  options?: {
    logRequestBody?: boolean;
    logResponseBody?: boolean;
    sensitiveFields?: string[];
  }
) {
  const { 
    logRequestBody = false, 
    logResponseBody = false,
    sensitiveFields = []
  } = options || {};

  return withCorrelationId(async (req: any, res: any, ...args: T): Promise<R> => {
    const logger = req.logger;
    
    // Enhanced request logging
    if (logRequestBody && req.body) {
      logger.debug({
        requestBody: req.body,
        msg: 'Request body received'
      });
    }

    // Intercept response to log response body if needed
    if (logResponseBody) {
      const originalJson = res.json;
      const originalSend = res.send;

      res.json = function(body: any) {
        logger.debug({
          responseBody: body,
          msg: 'Response body sent'
        });
        return originalJson.call(this, body);
      };

      res.send = function(body: any) {
        if (typeof body === 'object') {
          logger.debug({
            responseBody: body,
            msg: 'Response body sent'
          });
        }
        return originalSend.call(this, body);
      };
    }

    return handler(req, res, ...args);
  });
}

/**
 * Webhook-specific middleware with enhanced security logging
 */
export function withWebhookLogging(
  provider: 'stripe' | 'razorpay',
  handler: (req: any, res: any) => Promise<any>
) {
  return withCorrelationId(async (req: any, res: any) => {
    const logger = req.logger;
    
    // Log webhook metadata
    const eventType = req.body?.type || req.body?.event || 'unknown';
    const webhookId = req.body?.id || req.body?.payload?.payment?.entity?.id;
    
    logger.info({
      provider,
      eventType,
      webhookId,
      hasSignature: !!(req.headers['stripe-signature'] || req.headers['x-razorpay-signature']),
      msg: `Webhook received: ${provider} ${eventType}`
    });

    try {
      const result = await handler(req, res);
      
      logger.info({
        provider,
        eventType,
        webhookId,
        processed: true,
        msg: `Webhook processed successfully: ${provider} ${eventType}`
      });
      
      return result;
    } catch (error) {
      logger.error({
        err: error,
        provider,
        eventType,
        webhookId,
        processed: false,
        msg: `Webhook processing failed: ${provider} ${eventType}`
      });
      throw error;
    }
  });
}

/**
 * Performance monitoring wrapper
 * Tracks API performance metrics
 */
export function withPerformanceLogging<T extends any[], R>(
  handler: (req: any, res: any, ...args: T) => Promise<R> | R,
  thresholds?: {
    slow?: number; // ms
    verySlow?: number; // ms
  }
) {
  const { slow = 1000, verySlow = 5000 } = thresholds || {};

  return withCorrelationId(async (req: any, res: any, ...args: T): Promise<R> => {
    const logger = req.logger;
    const startMemory = process.memoryUsage();
    
    try {
      const result = await handler(req, res, ...args);
      
      const responseTime = Date.now() - req.startTime;
      const endMemory = process.memoryUsage();
      const memoryDelta = endMemory.heapUsed - startMemory.heapUsed;
      
      // Determine log level based on performance
      let level: 'info' | 'warn' | 'error' = 'info';
      if (responseTime > verySlow) level = 'error';
      else if (responseTime > slow) level = 'warn';
      
      logger[level]({
        performance: {
          responseTime,
          memoryUsed: endMemory.heapUsed,
          memoryDelta,
          cpuUsage: process.cpuUsage()
        },
        msg: `Performance: ${req.method} ${req.url} - ${responseTime}ms`
      });
      
      return result;
    } catch (error) {
      const responseTime = Date.now() - req.startTime;
      logger.error({
        performance: {
          responseTime,
          failed: true
        },
        err: error,
        msg: `Performance (failed): ${req.method} ${req.url} - ${responseTime}ms`
      });
      throw error;
    }
  });
}

/**
 * Rate limiting logging wrapper
 */
export function withRateLimitLogging<T extends any[], R>(
  handler: (req: any, res: any, ...args: T) => Promise<R> | R
) {
  return withCorrelationId(async (req: any, res: any, ...args: T): Promise<R> => {
    const logger = req.logger;
    const clientIp = req.headers['x-forwarded-for'] || req.connection?.remoteAddress;
    
    // Log rate limiting info
    logger.debug({
      rateLimiting: {
        clientIp,
        userAgent: req.headers['user-agent'],
        endpoint: `${req.method} ${req.url}`
      },
      msg: 'Rate limit check'
    });
    
    return handler(req, res, ...args);
  });
}

export default {
  correlationIdMiddleware,
  withCorrelationId,
  withStructuredLogging,
  withWebhookLogging,
  withPerformanceLogging,
  withRateLimitLogging
};