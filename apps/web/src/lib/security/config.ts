/**
 * Security Configuration
 * Central configuration for all security features
 */

export const securityConfig = {
  // Content Security Policy
  csp: {
    enabled: true,
    reportUri: '/api/csp-report',
    development: {
      allowUnsafeInline: true,
      allowUnsafeEval: true,
      allowLocalhost: true
    },
    production: {
      strictMode: true,
      reportOnly: false
    }
  },

  // Rate Limiting
  rateLimit: {
    enabled: true,
    store: 'redis', // 'redis' | 'memory'
    defaultWindow: 15 * 60 * 1000, // 15 minutes
    
    // Endpoint-specific limits
    limits: {
      auth: {
        windowMs: 15 * 60 * 1000,
        max: 5,
        message: 'Too many authentication attempts'
      },
      api: {
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: 'API rate limit exceeded'
      },
      reviews: {
        windowMs: 60 * 60 * 1000,
        max: 5,
        message: 'Too many reviews submitted'
      },
      checkout: {
        windowMs: 10 * 60 * 1000,
        max: 3,
        message: 'Too many checkout attempts'
      },
      uploads: {
        windowMs: 60 * 60 * 1000,
        max: 20,
        message: 'Upload limit exceeded'
      }
    }
  },

  // Image Upload Security
  imageUpload: {
    enabled: true,
    
    // File type restrictions
    allowedMimeTypes: [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp'
    ],
    
    // Size limits (bytes)
    maxFileSize: {
      product: 10 * 1024 * 1024, // 10MB
      profile: 2 * 1024 * 1024,  // 2MB
      review: 5 * 1024 * 1024,   // 5MB
      tryOn: 3 * 1024 * 1024     // 3MB
    },
    
    // Dimension limits (pixels)
    maxDimensions: {
      product: { width: 2048, height: 2048 },
      profile: { width: 800, height: 800 },
      review: { width: 1200, height: 1200 },
      tryOn: { width: 1024, height: 1024 }
    },
    
    // Security scanning
    scanning: {
      magicBytes: true,
      contentScan: true,
      metadataStrip: true,
      pixelLimits: true
    }
  },

  // Request Validation
  validation: {
    enabled: true,
    strictMode: true,
    
    // Global validation rules
    rules: {
      maxStringLength: 1000,
      maxArrayLength: 100,
      maxObjectDepth: 5,
      allowUnknownFields: false
    }
  },

  // Security Headers
  headers: {
    enabled: true,
    
    // HSTS settings
    hsts: {
      maxAge: 31536000, // 1 year
      includeSubDomains: true,
      preload: true
    },
    
    // Frame options
    frameOptions: 'DENY', // 'DENY' | 'SAMEORIGIN' | 'ALLOW-FROM'
    
    // Content type options
    contentTypeOptions: 'nosniff',
    
    // XSS protection
    xssProtection: '1; mode=block',
    
    // Referrer policy
    referrerPolicy: 'strict-origin-when-cross-origin'
  },

  // Monitoring & Logging
  monitoring: {
    enabled: true,
    
    // Log levels
    logLevel: process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
    
    // Event tracking
    trackEvents: [
      'rate_limit_exceeded',
      'validation_failed',
      'suspicious_upload',
      'csp_violation',
      'auth_failure'
    ],
    
    // Alert thresholds
    alertThresholds: {
      rateLimitViolations: 10, // per hour
      validationErrors: 50,    // per hour
      suspiciousUploads: 5,    // per hour
      cspViolations: 20        // per hour
    }
  },

  // Environment-specific overrides
  environments: {
    development: {
      csp: {
        allowUnsafeInline: true,
        allowUnsafeEval: true
      },
      rateLimit: {
        enabled: false // Disable for easier testing
      },
      validation: {
        strictMode: false
      }
    },
    
    test: {
      rateLimit: {
        enabled: false
      },
      monitoring: {
        enabled: false
      }
    },
    
    production: {
      csp: {
        strictMode: true,
        reportOnly: false
      },
      rateLimit: {
        enabled: true,
        strictMode: true
      },
      validation: {
        strictMode: true
      }
    }
  }
};

// Get environment-specific config
export function getSecurityConfig() {
  const env = process.env.NODE_ENV || 'development';
  const envConfig = securityConfig.environments[env as keyof typeof securityConfig.environments] || {};
  
  // Deep merge environment config with base config
  return mergeDeep(securityConfig, envConfig);
}

// Helper function for deep merging
function mergeDeep(target: any, source: any): any {
  const output = Object.assign({}, target);
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = mergeDeep(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

export default securityConfig;