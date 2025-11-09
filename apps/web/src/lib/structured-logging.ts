/**
 * Structured Logging Utilities
 * Provides specialized logging functions for different application concerns
 */
import { logger, createChildLogger } from '../lib/logger';

/**
 * Business Logic Logging
 */
export const businessLogger = {
  /**
   * Log user actions
   */
  userAction: (
    correlationId: string,
    action: string,
    userId?: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'user-action',
      userId,
      action
    });
    
    childLogger.info({
      ...metadata,
      msg: `User action: ${action}`
    });
  },

  /**
   * Log order events
   */
  orderEvent: (
    correlationId: string,
    event: 'created' | 'updated' | 'cancelled' | 'fulfilled',
    orderId: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'order',
      orderId,
      event
    });
    
    childLogger.info({
      ...metadata,
      msg: `Order ${event}: ${orderId}`
    });
  },

  /**
   * Log payment events
   */
  paymentEvent: (
    correlationId: string,
    event: 'initiated' | 'successful' | 'failed' | 'refunded',
    paymentId: string,
    amount?: number,
    currency?: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'payment',
      paymentId,
      event,
      amount,
      currency
    });
    
    const level = event === 'failed' ? 'error' : 'info';
    childLogger[level]({
      ...metadata,
      msg: `Payment ${event}: ${paymentId}`
    });
  },

  /**
   * Log inventory changes
   */
  inventoryChange: (
    correlationId: string,
    productId: string,
    variantId: string,
    change: number,
    newQuantity: number,
    reason: string
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'inventory',
      productId,
      variantId
    });
    
    childLogger.info({
      change,
      newQuantity,
      reason,
      msg: `Inventory updated: ${productId}/${variantId} ${change > 0 ? '+' : ''}${change} (now: ${newQuantity})`
    });
  },

  /**
   * Log service health events
   */
  serviceHealth: (
    correlationId: string,
    event: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'health',
      event
    });
    
    childLogger.info({
      ...metadata,
      msg: `Health: ${event}`
    });
  },

  /**
   * Log generic errors with business context
   */
  logError: (
    correlationId: string,
    error: Error,
    context: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'error',
      context
    });
    
    childLogger.error({
      error: error.message,
      stack: error.stack,
      ...metadata,
      msg: `Business error: ${context}`
    });
  }
};

/**
 * Security Logging
 */
export const securityLogger = {
  /**
   * Log authentication events
   */
  authEvent: (
    correlationId: string,
    event: 'login_success' | 'login_failed' | 'logout' | 'token_refresh' | 'unauthorized',
    userId?: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'auth',
      userId,
      event
    });
    
    const level = event.includes('failed') || event === 'unauthorized' ? 'warn' : 'info';
    childLogger[level]({
      ...metadata,
      msg: `Auth event: ${event}`
    });
  },

  /**
   * Log suspicious activities
   */
  suspiciousActivity: (
    correlationId: string,
    activity: string,
    severity: 'low' | 'medium' | 'high',
    clientIp?: string,
    userAgent?: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'security',
      severity,
      clientIp,
      activity
    });
    
    const level = severity === 'high' ? 'error' : severity === 'medium' ? 'warn' : 'info';
    childLogger[level]({
      userAgent,
      ...metadata,
      msg: `Suspicious activity detected: ${activity}`
    });
  },

  /**
   * Log rate limiting events
   */
  rateLimitEvent: (
    correlationId: string,
    action: 'throttled' | 'blocked' | 'reset',
    clientIp: string,
    endpoint: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'rate-limit',
      clientIp,
      endpoint,
      action
    });
    
    const level = action === 'blocked' ? 'warn' : 'info';
    childLogger[level]({
      ...metadata,
      msg: `Rate limit ${action}: ${endpoint} from ${clientIp}`
    });
  },

  /**
   * Log audit trail events
   */
  auditTrail: (
    correlationId: string,
    event: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'audit',
      event
    });
    
    childLogger.info({
      ...metadata,
      msg: `Audit: ${event}`
    });
  },

  /**
   * Log system alerts
   */
  systemAlert: (
    correlationId: string,
    alert: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'system-alert',
      alert
    });
    
    childLogger.error({
      ...metadata,
      msg: `System alert: ${alert}`
    });
  }
};

/**
 * External Service Integration Logging
 */
export const integrationLogger = {
  /**
   * Log external API calls
   */
  externalApiCall: (
    correlationId: string,
    service: string,
    endpoint: string,
    method: string,
    startTime: number,
    statusCode?: number,
    error?: Error
  ) => {
    const responseTime = Date.now() - startTime;
    const childLogger = createChildLogger(correlationId, {
      component: 'external-api',
      service,
      endpoint,
      method
    });
    
    if (error) {
      childLogger.error({
        err: error,
        responseTime,
        statusCode,
        msg: `External API call failed: ${method} ${service}${endpoint}`
      });
    } else {
      const level = statusCode && statusCode >= 400 ? 'warn' : 'info';
      childLogger[level]({
        responseTime,
        statusCode,
        msg: `External API call: ${method} ${service}${endpoint} - ${statusCode} (${responseTime}ms)`
      });
    }
  },

  /**
   * Log webhook deliveries
   */
  webhookDelivery: (
    correlationId: string,
    webhookUrl: string,
    eventType: string,
    attempt: number,
    success: boolean,
    responseCode?: number,
    error?: Error
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'webhook-delivery',
      webhookUrl,
      eventType,
      attempt
    });
    
    if (success) {
      childLogger.info({
        responseCode,
        msg: `Webhook delivered: ${eventType} to ${webhookUrl} (attempt ${attempt})`
      });
    } else {
      childLogger.warn({
        err: error,
        responseCode,
        msg: `Webhook delivery failed: ${eventType} to ${webhookUrl} (attempt ${attempt})`
      });
    }
  }
};

/**
 * Performance and Monitoring Logging
 */
export const performanceLogger = {
  /**
   * Log database queries
   */
  databaseQuery: (
    correlationId: string,
    query: string,
    duration: number,
    recordCount?: number,
    error?: Error
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'database',
      duration,
      recordCount
    });
    
    // Determine log level based on query performance
    let level: 'info' | 'warn' | 'error' = 'info';
    if (error) level = 'error';
    else if (duration > 1000) level = 'warn'; // Slow query threshold
    
    childLogger[level]({
      query: query.substring(0, 200), // Truncate long queries
      recordCount,
      err: error,
      msg: `Database query ${error ? 'failed' : 'completed'} - ${duration}ms`
    });
  },

  /**
   * Log cache operations
   */
  cacheOperation: (
    correlationId: string,
    operation: 'hit' | 'miss' | 'set' | 'delete' | 'clear',
    key: string,
    duration?: number,
    size?: number
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'cache',
      operation,
      key
    });
    
    childLogger.debug({
      duration,
      size,
      msg: `Cache ${operation}: ${key}${duration ? ` (${duration}ms)` : ''}`
    });
  },

  /**
   * Log file operations
   */
  fileOperation: (
    correlationId: string,
    operation: 'upload' | 'download' | 'delete' | 'resize',
    fileName: string,
    fileSize?: number,
    duration?: number,
    error?: Error
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'file-operation',
      operation,
      fileName,
      fileSize
    });
    
    if (error) {
      childLogger.error({
        err: error,
        duration,
        msg: `File ${operation} failed: ${fileName}`
      });
    } else {
      childLogger.info({
        duration,
        msg: `File ${operation} completed: ${fileName}${fileSize ? ` (${fileSize} bytes)` : ''}${duration ? ` in ${duration}ms` : ''}`
      });
    }
  },

  /**
   * Log API response times
   */
  responseTime: (
    correlationId: string,
    route: string,
    duration: number,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'response-time',
      route,
      duration
    });
    
    const level = duration > 5000 ? 'warn' : duration > 2000 ? 'info' : 'debug';
    childLogger[level]({
      ...metadata,
      msg: `Response time: ${route} - ${duration}ms`
    });
  }
};

/**
 * Audit Logging for Compliance
 */
export const auditLogger = {
  /**
   * Log data access events
   */
  dataAccess: (
    correlationId: string,
    userId: string,
    resource: string,
    action: 'read' | 'create' | 'update' | 'delete',
    resourceId?: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'audit',
      userId,
      resource,
      action,
      resourceId
    });
    
    childLogger.info({
      ...metadata,
      msg: `Data access: ${userId} ${action} ${resource}${resourceId ? `/${resourceId}` : ''}`
    });
  },

  /**
   * Log administrative actions
   */
  adminAction: (
    correlationId: string,
    adminUserId: string,
    action: string,
    targetUserId?: string,
    changes?: object,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'admin-audit',
      adminUserId,
      targetUserId,
      action
    });
    
    childLogger.warn({
      changes,
      ...metadata,
      msg: `Admin action: ${adminUserId} performed ${action}${targetUserId ? ` on user ${targetUserId}` : ''}`
    });
  },

  /**
   * Log compliance events
   */
  complianceEvent: (
    correlationId: string,
    event: 'gdpr_request' | 'data_export' | 'data_deletion' | 'consent_given' | 'consent_withdrawn',
    userId: string,
    metadata?: object
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'compliance',
      userId,
      event
    });
    
    childLogger.info({
      ...metadata,
      msg: `Compliance event: ${event} for user ${userId}`
    });
  }
};

/**
 * Error Context Logger
 * Provides structured error logging with context
 */
export const errorLogger = {
  /**
   * Log application errors with context
   */
  logError: (
    correlationId: string,
    error: Error,
    context: {
      component?: string;
      userId?: string;
      operation?: string;
      metadata?: object;
    }
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: context.component || 'application',
      userId: context.userId,
      operation: context.operation
    });
    
    childLogger.error({
      err: error,
      ...context.metadata,
      msg: `Error in ${context.component || 'application'}${context.operation ? ` during ${context.operation}` : ''}: ${error.message}`
    });
  },

  /**
   * Log validation errors
   */
  validationError: (
    correlationId: string,
    field: string,
    value: any,
    constraint: string,
    userId?: string
  ) => {
    const childLogger = createChildLogger(correlationId, {
      component: 'validation',
      userId,
      field
    });
    
    childLogger.warn({
      field,
      constraint,
      // Don't log actual value for security
      hasValue: value !== undefined && value !== null,
      msg: `Validation failed: ${field} ${constraint}`
    });
  }
};

export {
  logger as defaultLogger,
  createChildLogger
};