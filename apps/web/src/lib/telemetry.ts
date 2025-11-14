import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { ATTR_SERVICE_NAME, ATTR_SERVICE_VERSION } from '@opentelemetry/semantic-conventions';
import * as OtelResources from '@opentelemetry/resources';
import { PinoInstrumentation } from '@opentelemetry/instrumentation-pino';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { trace, SpanKind, SpanStatusCode, context } from '@opentelemetry/api';

/**
 * OpenTelemetry Configuration for Radha Gsareees E-commerce Platform
 * 
 * Provides distributed tracing, metrics collection, and observability
 * across API routes, webhook handlers, and external service calls.
 * 
 * Features:
 * - Jaeger distributed tracing
 * - Prometheus metrics export
 * - Automatic HTTP instrumentation
 * - Pino logger correlation
 * - Custom service attributes
 */

// Environment configuration
const isProduction = process.env.NODE_ENV === 'production';
const serviceName = process.env.OTEL_SERVICE_NAME || 'radhagsareees-web';
const serviceVersion = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0';
const environment = process.env.NEXT_PUBLIC_ENVIRONMENT || 'development';

// Jaeger configuration
const jaegerEndpoint = process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces';
const enableJaeger = process.env.ENABLE_JAEGER_TRACING === 'true' || !isProduction;

// Prometheus configuration
const prometheusPort = parseInt(process.env.PROMETHEUS_PORT || '9090', 10);
const enablePrometheus = process.env.ENABLE_PROMETHEUS_METRICS === 'true';

/**
 * Create OpenTelemetry SDK instance with comprehensive instrumentation
 */
function createTelemetrySDK(): NodeSDK {
  const instrumentations = [
    // Auto-instrumentations for common libraries
    getNodeAutoInstrumentations({
      // Disable default instrumentations that we'll configure manually
      '@opentelemetry/instrumentation-pino': {
        enabled: false,
      },
      // Disable winston instrumentation to avoid optional dependency
      '@opentelemetry/instrumentation-winston': {
        enabled: false,
      },
    }),
    
    // Custom Pino instrumentation with correlation
    new PinoInstrumentation({
      logHook: (span, record) => {
        // Add trace context to log records
        const spanContext = span.spanContext();
        record['traceId'] = spanContext.traceId;
        record['spanId'] = spanContext.spanId;
        record['traceFlags'] = spanContext.traceFlags;
      },
    }),
    
    // Enhanced HTTP instrumentation
    new HttpInstrumentation({
      // Add custom attributes to HTTP spans
      requestHook: (span, request) => {
        const headers: Record<string, any> = (request as any)?.headers || {};
        span.setAttributes({
          'http.user_agent': headers['user-agent'] || '',
          'http.x_forwarded_for': headers['x-forwarded-for'] || '',
          'service.name': serviceName,
        });
      },
      
      // Add response attributes
      responseHook: (span, response) => {
        const headers: Record<string, any> = (response as any)?.headers || {};
        const statusCode: number = (response as any)?.statusCode || 0;
        span.setAttributes({
          'http.response.status_code': statusCode,
          'http.response.content_length': headers['content-length'] || '0',
        });
      },
      
      // Ignore health check endpoints
      ignoreIncomingRequestHook: (req) => {
        const url = req.url || '';
        return url.includes('/health') || 
               url.includes('/api/health') || 
               url.includes('/_next/') ||
               url.includes('/favicon.ico');
      },
    }),
  ];

  // Configure exporters based on environment
  const exporters: any[] = [];
  
  // Jaeger for distributed tracing
  if (enableJaeger) {
    exporters.push(
      new JaegerExporter({
        endpoint: jaegerEndpoint,
      })
    );
  }

  // Prometheus for metrics (if enabled)
  if (enablePrometheus) {
    exporters.push(
      new PrometheusExporter({
        port: prometheusPort,
        preventServerStart: false, // Allow Prometheus server to start
      })
    );
  }

  return new NodeSDK({
    resource: new OtelResources.Resource({
      [ATTR_SERVICE_NAME]: serviceName,
      [ATTR_SERVICE_VERSION]: serviceVersion,
      'deployment.environment': environment,
      'service.namespace': 'radhagsareees',
      // Custom attributes
      'business.domain': 'ecommerce',
      'business.vertical': 'fashion-retail',
      'tech.stack': 'nextjs-prisma-postgres',
    }),
    instrumentations,
    traceExporter: exporters.length > 0 ? exporters[0] : undefined,
    metricReader: enablePrometheus ? exporters.find(e => e instanceof PrometheusExporter) : undefined,
  });
}

/**
 * Initialize OpenTelemetry SDK
 * Call this once at application startup
 */
let sdk: NodeSDK | null = null;

export function initializeTelemetry(): void {
  if (sdk) {
    console.warn('OpenTelemetry already initialized');
    return;
  }

  try {
    sdk = createTelemetrySDK();
    sdk.start();
    
    console.info('OpenTelemetry initialized successfully', {
      serviceName,
      serviceVersion,
      environment,
      jaegerEnabled: enableJaeger,
      prometheusEnabled: enablePrometheus,
    });
  } catch (error) {
    console.error('Failed to initialize OpenTelemetry:', error);
    throw error;
  }
}

/**
 * Shutdown OpenTelemetry SDK gracefully
 * Call this during application shutdown
 */
export async function shutdownTelemetry(): Promise<void> {
  if (!sdk) {
    return;
  }

  try {
    await sdk.shutdown();
    sdk = null;
    console.info('OpenTelemetry shutdown completed');
  } catch (error) {
    console.error('Error during OpenTelemetry shutdown:', error);
    throw error;
  }
}

/**
 * Get OpenTelemetry configuration status
 */
export function getTelemetryConfig() {
  return {
    initialized: !!sdk,
    serviceName,
    serviceVersion,
    environment,
    jaegerEnabled: enableJaeger,
    jaegerEndpoint: enableJaeger ? jaegerEndpoint : null,
    prometheusEnabled: enablePrometheus,
    prometheusPort: enablePrometheus ? prometheusPort : null,
  };
}

/**
 * Manual trace creation utilities for business logic
 */
export { trace, context, SpanStatusCode, SpanKind } from '@opentelemetry/api';

// Export tracer for manual instrumentation
import { trace as otelTrace } from '@opentelemetry/api';
export const tracer = otelTrace.getTracer(serviceName, serviceVersion);

/**
 * Business logic tracing utilities
 */
export class BusinessTracing {
  static async tracePaymentOperation<T>(
    operationType: 'payment_initiation' | 'payment_verification' | 'payment_failure',
    paymentProvider: 'razorpay' | 'stripe' | 'shopify',
    operation: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`payment.${operationType}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'payment.provider': paymentProvider,
        'payment.operation': operationType,
        'business.domain': 'payments',
      },
    });

    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }

  static async traceInventoryOperation<T>(
    operationType: 'check_availability' | 'reserve_items' | 'release_items' | 'update_stock',
    operation: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`inventory.${operationType}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'inventory.operation': operationType,
        'business.domain': 'inventory',
      },
    });

    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }

  static async traceUserOperation<T>(
    operationType: 'authentication' | 'authorization' | 'profile_update' | 'preference_update',
    userId: string | undefined,
    operation: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`user.${operationType}`, {
      kind: SpanKind.INTERNAL,
      attributes: {
        'user.operation': operationType,
        'business.domain': 'user_management',
        ...(userId && { 'user.id': userId }),
      },
    });

    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
}

/**
 * Webhook tracing utilities
 */
export class WebhookTracing {
  static async traceWebhookProcessing<T>(
    provider: 'razorpay' | 'stripe' | 'shopify',
    eventType: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const span = tracer.startSpan(`webhook.${provider}.${eventType}`, {
      kind: SpanKind.SERVER,
      attributes: {
        'webhook.provider': provider,
        'webhook.event_type': eventType,
        'business.domain': 'webhooks',
      },
    });

    try {
      const result = await operation();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({
        code: SpanStatusCode.ERROR,
        message: (error as Error).message,
      });
      throw error;
    } finally {
      span.end();
    }
  }
}