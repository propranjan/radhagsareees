/**
 * Pino Logger Configuration with PII Redaction
 * Provides structured logging for API routes with sensitive data protection
 */
import pino from 'pino';
import { v4 as uuidv4 } from 'uuid';

// Environment-based log level
const getLogLevel = (): pino.Level => {
  const level = process.env.LOG_LEVEL?.toLowerCase();
  const validLevels = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];
  return validLevels.includes(level!) ? (level as pino.Level) : 'info';
};

// PII and sensitive data redaction rules
const redactionRules = {
  // Remove sensitive user data
  paths: [
    // User PII
    'req.body.password',
    'req.body.email', 
    'req.body.phone',
    'req.body.phoneNumber',
    'req.body.name',
    'req.body.firstName',
    'req.body.lastName',
    'req.body.address',
    'req.body.billingAddress',
    'req.body.shippingAddress',
    
    // Payment information
    'req.body.cardNumber',
    'req.body.cvv',
    'req.body.expiryDate',
    'req.body.cardDetails',
    'req.body.paymentMethod.card',
    'req.body.payment_method.card',
    
    // API keys and tokens
    'req.headers.authorization',
    'req.headers.x-api-key',
    'req.headers.x-auth-token',
    'req.headers["x-razorpay-signature"]',
    'req.headers["stripe-signature"]',
    'req.body.razorpay_signature',
    'req.body.stripe_signature',
    
    // Webhook signatures and sensitive data
    'req.body.data.object.card',
    'req.body.data.object.payment_method.card',
    'req.body.data.object.customer.email',
    'req.body.data.object.customer.phone',
    'req.body.data.object.billing_details',
    'req.body.data.object.shipping',
    
    // Razorpay specific
    'req.body.payload.payment.entity.card',
    'req.body.payload.payment.entity.customer_details',
    'req.body.payload.order.entity.customer_details',
    
    // Response data
    'res.body.customer.email',
    'res.body.customer.phone',
    'res.body.user.email',
    'res.body.user.phone',
    'res.body.paymentMethod.card',
    
    // Session and auth tokens
    'req.cookies.next-auth.session-token',
    'req.cookies["next-auth.session-token"]',
    'req.body.access_token',
    'req.body.refresh_token',
    
    // Database connection strings and secrets
    'process.env.DATABASE_URL',
    'process.env.NEXTAUTH_SECRET',
    'process.env.RAZORPAY_KEY_SECRET',
    'process.env.STRIPE_SECRET_KEY',
  ],
  // Custom redaction function for complex objects
  censor: (value: any, path: string[]) => {
    // Redact any field containing 'password', 'secret', 'key', 'token'
    const fieldName = path[path.length - 1]?.toLowerCase() || '';
    if (fieldName.includes('password') || 
        fieldName.includes('secret') || 
        fieldName.includes('key') ||
        fieldName.includes('token') ||
        fieldName.includes('signature')) {
      return '[REDACTED]';
    }
    
    // Redact email patterns
    if (typeof value === 'string' && /\S+@\S+\.\S+/.test(value)) {
      return '[EMAIL_REDACTED]';
    }
    
    // Redact phone number patterns
    if (typeof value === 'string' && /(\+\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/.test(value)) {
      return '[PHONE_REDACTED]';
    }
    
    // Redact card number patterns
    if (typeof value === 'string' && /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/.test(value)) {
      return '[CARD_REDACTED]';
    }
    
    return value;
  }
};

// Base logger configuration
const createLogger = () => {
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  const baseConfig: pino.LoggerOptions = {
    level: getLogLevel(),
    redact: redactionRules,
    serializers: {
      req: (req: any) => ({
        id: req.id,
        method: req.method,
        url: req.url,
        params: req.params,
        query: req.query,
        headers: {
          'user-agent': req.headers['user-agent'],
          'content-type': req.headers['content-type'],
          'accept': req.headers['accept'],
          'host': req.headers['host'],
          'x-forwarded-for': req.headers['x-forwarded-for'],
          'x-real-ip': req.headers['x-real-ip'],
          // Exclude sensitive headers by default
        },
        correlationId: req.correlationId,
        ip: req.ip || req.connection?.remoteAddress,
        userAgent: req.headers['user-agent']
      }),
      res: (res: any) => ({
        statusCode: res.statusCode,
        headers: {
          'content-type': res.getHeader?.('content-type'),
          'content-length': res.getHeader?.('content-length')
        }
      }),
      err: pino.stdSerializers.err
    },
    base: {
      pid: process.pid,
      hostname: process.env.HOSTNAME || 'unknown',
      service: 'radhagsareees-web',
      version: process.env.npm_package_version || '1.0.0',
      environment: process.env.NODE_ENV || 'production'
    }
  };

  // Development configuration with pretty printing
  if (isDevelopment) {
    return pino({
      ...baseConfig,
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
          ignore: 'pid,hostname',
          messageFormat: '[{correlationId}] {msg}',
          hideObject: false
        }
      }
    });
  }

  // Production configuration with structured JSON
  return pino({
    ...baseConfig,
    timestamp: pino.stdTimeFunctions.isoTime,
    formatters: {
      level: (label: string, number: number) => ({ 
        level: label,
        levelNumber: number 
      })
    }
  });
};

// Export singleton logger instance
export const logger = createLogger();

// Correlation ID utilities
export const correlationId = {
  generate: (): string => uuidv4(),
  
  getFromHeaders: (headers: any): string | undefined => {
    return headers['x-correlation-id'] || 
           headers['x-request-id'] || 
           headers['correlation-id'];
  },

  setInHeaders: (headers: any, id: string): void => {
    headers['x-correlation-id'] = id;
  }
};

// Child logger factory with correlation ID
export const createChildLogger = (correlationId: string, context?: object) => {
  return logger.child({
    correlationId,
    ...context
  });
};

// Request/Response logging helpers
export const logRequest = (req: any, correlationId: string) => {
  const childLogger = createChildLogger(correlationId, {
    component: 'api-request',
    method: req.method,
    path: req.url
  });
  
  childLogger.info({
    req,
    msg: `Incoming ${req.method} ${req.url}`
  });
  
  return childLogger;
};

export const logResponse = (
  logger: pino.Logger, 
  req: any, 
  res: any, 
  responseTime: number
) => {
  const level = res.statusCode >= 500 ? 'error' : 
               res.statusCode >= 400 ? 'warn' : 'info';
  
  logger[level]({
    req,
    res,
    responseTime,
    msg: `${req.method} ${req.url} ${res.statusCode} - ${responseTime}ms`
  });
};

// Error logging helper
export const logError = (
  logger: pino.Logger, 
  error: Error, 
  context?: object
) => {
  logger.error({
    err: error,
    ...context,
    msg: `Error: ${error.message}`
  });
};

// Webhook logging helpers
export const logWebhookReceived = (
  provider: 'stripe' | 'razorpay', 
  eventType: string, 
  correlationId: string,
  metadata?: object
) => {
  const childLogger = createChildLogger(correlationId, {
    component: 'webhook',
    provider,
    eventType
  });
  
  childLogger.info({
    ...metadata,
    msg: `Webhook received: ${provider} ${eventType}`
  });
  
  return childLogger;
};

export const logWebhookProcessed = (
  logger: pino.Logger,
  success: boolean,
  processingTime: number,
  result?: object
) => {
  const level = success ? 'info' : 'error';
  
  logger[level]({
    success,
    processingTime,
    result,
    msg: `Webhook processing ${success ? 'completed' : 'failed'} - ${processingTime}ms`
  });
};

export default logger;