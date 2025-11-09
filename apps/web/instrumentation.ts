/**
 * OpenTelemetry Instrumentation Registration
 * 
 * This file MUST be imported before any other application code
 * to ensure proper instrumentation of all modules.
 * 
 * Usage in Next.js:
 * 1. Import this in instrumentation.ts (Next.js 13.4+)
 * 2. Or require this at the very top of your server entry point
 * 
 * Environment Variables:
 * - ENABLE_TELEMETRY: Set to 'true' to enable OpenTelemetry
 * - OTEL_SERVICE_NAME: Custom service name (default: radhagsareees-web)
 * - JAEGER_ENDPOINT: Jaeger collector endpoint
 * - ENABLE_JAEGER_TRACING: Enable Jaeger tracing
 * - ENABLE_PROMETHEUS_METRICS: Enable Prometheus metrics
 * - PROMETHEUS_PORT: Prometheus metrics port
 */

import { initializeTelemetry, getTelemetryConfig } from './src/lib/telemetry';

// Only initialize in server-side environments
const isServer = typeof window === 'undefined';
const telemetryEnabled = process.env.ENABLE_TELEMETRY === 'true' || 
                        process.env.NODE_ENV === 'development';

if (isServer && telemetryEnabled) {
  try {
    // Initialize OpenTelemetry before any other imports
    initializeTelemetry();
    
    const config = getTelemetryConfig();
    console.info('[Instrumentation] OpenTelemetry initialized', {
      service: config.serviceName,
      version: config.serviceVersion,
      environment: config.environment,
      jaeger: config.jaegerEnabled,
      prometheus: config.prometheusEnabled,
    });
  } catch (error) {
    console.error('[Instrumentation] Failed to initialize OpenTelemetry:', error);
    
    // In development, we can continue without telemetry
    if (process.env.NODE_ENV === 'production') {
      throw error;
    }
  }
}

// Graceful shutdown handling
if (isServer && telemetryEnabled) {
  const { shutdownTelemetry } = require('./src/lib/telemetry');
  
  // Handle process termination
  const shutdownHandler = async (signal: string) => {
    console.info(`[Instrumentation] Received ${signal}, shutting down OpenTelemetry...`);
    try {
      await shutdownTelemetry();
      console.info('[Instrumentation] OpenTelemetry shutdown complete');
      process.exit(0);
    } catch (error) {
      console.error('[Instrumentation] Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Register shutdown handlers
  process.on('SIGTERM', () => shutdownHandler('SIGTERM'));
  process.on('SIGINT', () => shutdownHandler('SIGINT'));
  process.on('SIGUSR2', () => shutdownHandler('SIGUSR2')); // For nodemon
}