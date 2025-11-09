/**
 * Health Check API Route - Comprehensive Example
 * 
 * Demonstrates integration of:
 * - Structured logging with Pino
 * - Correlation ID tracking
 * - OpenTelemetry tracing
 * - Performance monitoring
 * - Security logging
 * - Error handling with proper context
 */

import { NextRequest, NextResponse } from 'next/server';
import { withCorrelationId } from '@/middleware/correlation-id';
import { businessLogger, securityLogger, performanceLogger } from '@/lib/structured-logging';
import { tracer } from '@/lib/telemetry';
import { getTelemetryConfig } from '@/lib/telemetry';

interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  environment: string;
  uptime: number;
  services: {
    database: 'connected' | 'disconnected' | 'unknown';
    telemetry: 'enabled' | 'disabled';
    logging: 'configured' | 'basic';
  };
  performance: {
    responseTime: number;
    memoryUsage: {
      used: number;
      total: number;
      percentage: number;
    };
  };
  correlationId: string;
  traceId?: string;
}

async function checkDatabaseHealth(): Promise<'connected' | 'disconnected' | 'unknown'> {
  try {
    // In a real implementation, you would check your database connection
    // For now, we'll simulate a check - uncomment for real DB check
    /*
    const { PrismaClient } = await import('@radhagsareees/db');
    const prisma = new PrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    await prisma.$disconnect();
    */
    return 'connected';
  } catch (error) {
    return 'disconnected';
  }
}

async function handleHealthCheck(
  request: NextRequest,
  context: { correlationId: string }
): Promise<NextResponse> {
  const startTime = Date.now();
  const { correlationId } = context;
  
  // Start OpenTelemetry span
  const span = tracer.startSpan('health_check', {
    attributes: {
      'http.method': request.method,
      'http.route': '/api/health',
      'correlation.id': correlationId,
    },
  });

  try {
    // Log request initiation
    businessLogger.serviceHealth(correlationId, 'Health check initiated', {
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || 
          request.headers.get('x-real-ip') || 
          'unknown',
    });

    // Check various system components
    const [databaseStatus, telemetryConfig] = await Promise.all([
      checkDatabaseHealth(),
      Promise.resolve(getTelemetryConfig()),
    ]);

    // Get memory usage
    const memoryUsage = process.memoryUsage();
    const memoryStats = {
      used: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
      total: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
      percentage: Math.round((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100),
    };

    const responseTime = Date.now() - startTime;

    // Determine overall health status
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (databaseStatus === 'disconnected') {
      status = 'unhealthy';
    } else if (memoryStats.percentage > 90 || responseTime > 5000) {
      status = 'degraded';
    }

    const response: HealthCheckResponse = {
      status,
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        database: databaseStatus,
        telemetry: telemetryConfig.initialized ? 'enabled' : 'disabled',
        logging: 'configured',
      },
      performance: {
        responseTime,
        memoryUsage: memoryStats,
      },
      correlationId,
      traceId: span.spanContext().traceId,
    };

    // Log performance metrics
    performanceLogger.responseTime(correlationId, '/api/health', responseTime, {
      status: response.status,
      memoryUsage: memoryStats.percentage,
    });

    // Log business metrics
    businessLogger.serviceHealth(correlationId, 'Health check completed', {
      status: response.status,
      responseTime,
      databaseStatus,
      memoryPercentage: memoryStats.percentage,
    });

    // Security logging for monitoring access patterns
    securityLogger.auditTrail(correlationId, 'health_check_access', {
      userAgent: request.headers.get('user-agent') || 'unknown',
      ip: request.headers.get('x-forwarded-for') || 'unknown',
      status: response.status,
    });

    // Add span attributes
    span.setAttributes({
      'health.status': status,
      'health.response_time': responseTime,
      'health.memory_percentage': memoryStats.percentage,
      'health.database_status': databaseStatus,
    });

    return NextResponse.json(response, {
      status: status === 'healthy' ? 200 : status === 'degraded' ? 200 : 503,
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Trace-ID': span.spanContext().traceId,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });

  } catch (error) {
    const responseTime = Date.now() - startTime;
    
    // Log error with full context
    businessLogger.logError(correlationId, error as Error, 'Health check failed', {
      responseTime,
      stage: 'health_check',
    });

    // Security logging for potential system issues
    securityLogger.systemAlert(correlationId, 'health_check_failure', {
      error: (error as Error).message,
      responseTime,
    });

    // Record exception in span
    span.recordException(error as Error);
    span.setStatus({
      code: 2, // ERROR
      message: (error as Error).message,
    });

    const errorResponse: HealthCheckResponse = {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      services: {
        database: 'unknown',
        telemetry: 'disabled',
        logging: 'configured',
      },
      performance: {
        responseTime,
        memoryUsage: { used: 0, total: 0, percentage: 0 },
      },
      correlationId,
      traceId: span.spanContext().traceId,
    };

    return NextResponse.json(errorResponse, {
      status: 503,
      headers: {
        'X-Correlation-ID': correlationId,
        'X-Trace-ID': span.spanContext().traceId,
      },
    });
  } finally {
    span.end();
  }
}

// Export the route handler wrapped with correlation ID middleware
export const GET = withCorrelationId(handleHealthCheck);