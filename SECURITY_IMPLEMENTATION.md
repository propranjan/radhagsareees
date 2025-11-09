# Security Implementation Guide

This document provides comprehensive documentation for all security measures implemented in the Radha GSarees application.

## 🛡️ Security Overview

### Security Layers Implemented

1. **Content Security Policy (CSP) & Security Headers**
2. **Request Validation with Zod**
3. **Redis-based Rate Limiting**
4. **Image Upload Security Scanning**
5. **HTTPS & Transport Security**
6. **Authentication & Authorization**

---

## 🔒 1. Content Security Policy (CSP) & Security Headers

### Implementation Files
- `apps/web/src/lib/security/headers.ts`
- `apps/web/src/lib/security/middleware.ts`
- `apps/web/next.config.js`

### Features

#### Security Headers Applied
```typescript
{
  'Content-Security-Policy': 'Comprehensive CSP directives',
  'X-Content-Type-Options': 'nosniff',
  'X-XSS-Protection': '1; mode=block',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(), ...',
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
}
```

#### Content Security Policy Directives

| Directive | Sources | Purpose |
|-----------|---------|---------|
| `default-src` | `'self'` | Default policy for all resources |
| `script-src` | `'self'`, Razorpay, Google Analytics | JavaScript execution |
| `style-src` | `'self'`, `'unsafe-inline'`, Google Fonts | Stylesheets |
| `img-src` | `'self'`, `data:`, `blob:`, Cloudinary | Images |
| `connect-src` | `'self'`, API endpoints | AJAX requests |
| `frame-src` | Razorpay checkout | Embedded frames |
| `media-src` | `'self'`, `blob:`, Cloudinary | Audio/Video |
| `object-src` | `'none'` | No plugins allowed |

### Usage Example

```typescript
// Apply to API routes
import { withSecurityHeaders } from '../lib/security/middleware';

export const GET = withSecurityHeaders(async (request) => {
  // Your API logic
});
```

### Configuration

```typescript
// Environment-specific settings
const config: SecurityHeadersConfig = {
  enableCSP: true,
  enableCORS: process.env.NODE_ENV === 'development',
  allowedOrigins: [
    process.env.NEXTAUTH_URL || 'http://localhost:3000',
    'https://*.vercel.app'
  ],
  isDevelopment: process.env.NODE_ENV === 'development'
};
```

---

## ✅ 2. Request Validation with Zod

### Implementation Files
- `apps/web/src/lib/security/validation.ts`

### Features

#### Validation Middleware
- **Body Validation**: JSON, Form Data, Multipart
- **Query Parameter Validation**: URL parameters
- **Path Parameter Validation**: Dynamic routes
- **Comprehensive Error Reporting**: Detailed field-level errors

#### Pre-built Schemas

```typescript
export const validationSchemas = {
  product: {
    body: z.object({
      name: z.string().min(1).max(100),
      price: z.number().int().min(0),
      category: z.string().min(1).max(50),
      // ... more fields
    })
  },
  
  review: {
    body: z.object({
      productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
      rating: z.number().min(1).max(5),
      title: z.string().min(1).max(100),
      content: z.string().min(10).max(1000)
    })
  },
  
  checkout: {
    body: z.object({
      items: z.array(z.object({
        productId: z.string().regex(/^[0-9a-fA-F]{24}$/),
        quantity: z.number().int().min(1).max(10)
      })),
      shippingAddress: z.object({
        fullName: z.string().min(1),
        phoneNumber: z.string().regex(/^(\+91|91)?[6789]\d{9}$/),
        pincode: z.string().regex(/^\d{6}$/)
      })
    })
  }
};
```

### Usage Example

```typescript
import { withValidation, validationSchemas } from '../lib/security/validation';

export const POST = withValidation({
  body: validationSchemas.review.body
})(async (request) => {
  const { body: validatedData } = getValidatedData(request);
  // Use validatedData safely
});
```

### Error Response Format

```json
{
  "error": "Validation failed",
  "message": "Request body validation failed",
  "details": [
    {
      "field": "rating",
      "message": "Rating must be between 1 and 5",
      "code": "too_big"
    }
  ]
}
```

### Common Validation Schemas

```typescript
export const commonSchemas = {
  email: z.string().email().toLowerCase(),
  phoneNumber: z.string().regex(/^(\+91|91)?[6789]\d{9}$/),
  objectId: z.string().regex(/^[0-9a-fA-F]{24}$/),
  price: z.number().int().min(0),
  rating: z.number().min(1).max(5),
  productSize: z.enum(['XS', 'S', 'M', 'L', 'XL', 'XXL'])
};
```

---

## 🚦 3. Redis-based Rate Limiting

### Implementation Files
- `apps/web/src/lib/security/rate-limit.ts`

### Features

#### Rate Limiting Algorithms
1. **Token Bucket**: Burst handling with sustained rate
2. **Sliding Window**: Precise time-based limits
3. **Redis Storage**: Distributed rate limiting

#### Pre-configured Limiters

| Limiter | Window | Max Requests | Use Case |
|---------|--------|--------------|----------|
| `writeOperations` | 15 minutes | 10 | Create/Update operations |
| `reviews` | 1 hour | 5 | Review submissions |
| `checkout` | 10 minutes | 3 | Payment attempts |
| `api` | 15 minutes | 100 | General API usage |
| `auth` | 15 minutes | 5 | Login attempts |
| `uploads` | 1 hour | 20 | File uploads |

### Usage Example

```typescript
import { withRateLimit, rateLimiters } from '../lib/security/rate-limit';

export const POST = withRateLimit(rateLimiters.reviews)(
  async (request) => {
    // Your API logic
  }
);
```

### Rate Limit Headers

```http
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 3
X-RateLimit-Reset: 1699123456
Retry-After: 3600
```

### Token Bucket Implementation

```typescript
class TokenBucket {
  async consume(key: string, tokens: number = 1): Promise<RateLimitResult> {
    // Lua script for atomic operations
    const luaScript = `
      -- Calculate tokens to add based on time elapsed
      local timeElapsed = math.max(0, now - lastRefill)
      local tokensToAdd = math.floor((timeElapsed / 1000) * refillRate)
      currentTokens = math.min(capacity, currentTokens + tokensToAdd)
      
      -- Check if we can consume the requested tokens
      local allowed = currentTokens >= tokens
      if allowed then remaining = currentTokens - tokens end
      
      -- Update bucket state atomically
      redis.call('HMSET', key, 'tokens', remaining, 'lastRefill', now)
    `;
  }
}
```

### Client Identification

```typescript
function getClientIdentifier(request: any): string {
  // 1. Authenticated user ID (preferred)
  const userId = request.auth?.userId || request.user?.id;
  if (userId) return `user:${userId}`;
  
  // 2. IP address fallback
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded?.split(',')[0] || request.ip || 'unknown';
  return `ip:${ip}`;
}
```

---

## 🖼️ 4. Image Upload Security Scanning

### Implementation Files
- `apps/web/src/lib/security/image-validation.ts`

### Features

#### Security Validations
1. **MIME Type Detection**: Magic bytes + extension validation
2. **File Size Limits**: Per-file and total upload limits  
3. **Dimension Validation**: Width/height/pixel limits
4. **Content Scanning**: Malicious script detection
5. **Metadata Stripping**: EXIF/IPTC removal
6. **Format Conversion**: Safe format normalization

#### Image Configurations

```typescript
export const imageConfigs = {
  productImages: {
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
    maxFileSize: 10 * 1024 * 1024, // 10MB
    maxWidth: 2048,
    maxHeight: 2048,
    minWidth: 300,
    minHeight: 300,
    maxPixels: 4194304
  },
  
  profilePictures: {
    allowedMimeTypes: ['image/jpeg', 'image/png'],
    maxFileSize: 2 * 1024 * 1024, // 2MB
    maxWidth: 800,
    maxHeight: 800,
    aspectRatioTolerance: 0.1 // Square preferred
  }
};
```

### Magic Bytes Detection

```typescript
class MimeTypeDetector {
  private static magicBytes: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A],
    'image/webp': [0x52, 0x49, 0x46, 0x46], // + WEBP at offset 8
    'image/gif': [0x47, 0x49, 0x46, 0x38]
  };
}
```

### Usage Example

```typescript
import { imageValidators } from '../lib/security/image-validation';

// Validate uploaded images
const formData = await request.formData();
const images = formData.getAll('images') as File[];

for (const image of images) {
  const result = await imageValidators.product(image);
  
  if (!result.isValid) {
    return NextResponse.json({
      error: 'Invalid image',
      details: result.errors
    }, { status: 400 });
  }
}
```

### Security Checks

#### Content Scanning
```typescript
const suspiciousPatterns = [
  /<script/i,           // JavaScript
  /javascript:/i,       // JavaScript protocol
  /vbscript:/i,         // VBScript  
  /on\w+\s*=/i,        // Event handlers
  /<\?php/i,           // PHP code
  /<%/,                // ASP code
  /<svg[^>]*>[\s\S]*<script/i  // SVG scripts
];
```

#### Advanced Validations
- **EXIF Data Limits**: Prevent data hiding (64KB max)
- **Animation Frame Limits**: GIF bomb protection (100 frames max)
- **Pixel Density Check**: Manipulation detection (600 DPI max)
- **Format Consistency**: Magic bytes vs declared MIME type

### Image Sanitization

```typescript
async sanitizeImage(file: File, outputFormat: 'jpeg' | 'png' | 'webp'): Promise<Buffer> {
  let image = sharp(buffer);
  
  // Remove all metadata (EXIF, IPTC, XMP)
  image = image.rotate(); // Auto-rotate then strip EXIF
  
  // Resize to enforce limits
  image = image.resize(maxWidth, maxHeight, {
    fit: 'inside',
    withoutEnlargement: true
  });
  
  // Convert to safe format
  return await image.jpeg({ quality: 90, progressive: true }).toBuffer();
}
```

---

## 🔐 5. HTTPS & Transport Security

### Next.js Configuration

```javascript
// next.config.js
async headers() {
  return [{
    source: '/(.*)',
    headers: [
      {
        key: 'Strict-Transport-Security',
        value: 'max-age=31536000; includeSubDomains; preload'
      },
      {
        key: 'X-Content-Type-Options', 
        value: 'nosniff'
      }
    ]
  }];
}
```

### SSL/TLS Configuration

#### Production Requirements
- **TLS 1.2+**: Minimum protocol version
- **Strong Ciphers**: ECDHE + AES-GCM preferred
- **HSTS**: Force HTTPS for 1 year
- **Certificate Transparency**: Monitor certificate issuance

#### Development Setup
```bash
# Generate self-signed certificate for local development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes
```

---

## 👤 6. Authentication & Authorization

### Session Security

```typescript
// NextAuth.js configuration
export default NextAuth({
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours
  },
  jwt: {
    maxAge: 24 * 60 * 60, // 24 hours
  },
  cookies: {
    sessionToken: {
      name: 'next-auth.session-token',
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production'
      }
    }
  }
});
```

### Role-Based Access Control

```typescript
// Middleware for protected routes
export function withAuth(requiredRole?: string) {
  return async (request: NextRequest) => {
    const token = await getToken({ req: request });
    
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    if (requiredRole && token.role !== requiredRole) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    
    return null; // Allow access
  };
}
```

---

## 🛠️ Implementation Examples

### Secure API Route Template

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { withSecurityHeaders } from '../lib/security/middleware';
import { withValidation, validationSchemas } from '../lib/security/validation';
import { withRateLimit, rateLimiters } from '../lib/security/rate-limit';
import { withAuth } from '../lib/auth';

// Compose all security middlewares
const secureHandler = withSecurityHeaders(
  withAuth('admin')(
    withRateLimit(rateLimiters.writeOperations)(
      withValidation({
        body: validationSchemas.product.body
      })(handleProductCreation)
    )
  )
);

async function handleProductCreation(request: NextRequest) {
  // Your secure API logic here
}

export { secureHandler as POST };
```

### Environment Variables

```env
# Security Configuration
NEXTAUTH_SECRET=your-32-character-secret-key
NEXTAUTH_URL=https://your-domain.com

# Redis for rate limiting
REDIS_URL=redis://localhost:6379

# Image processing
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# CSP Configuration
CSP_REPORT_URI=https://your-domain.com/api/csp-report
```

---

## 📊 Security Monitoring

### Error Logging

```typescript
// Structured security logging
function logSecurityEvent(event: {
  type: 'rate_limit' | 'validation_error' | 'suspicious_upload';
  severity: 'low' | 'medium' | 'high';
  clientId: string;
  details: any;
}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    event: event.type,
    severity: event.severity,
    client: event.clientId,
    details: event.details
  }));
}
```

### Rate Limit Monitoring

```typescript
// Track rate limit violations
async function trackRateLimitViolation(clientId: string, endpoint: string) {
  await redis.hincrby(`violations:${clientId}`, endpoint, 1);
  await redis.expire(`violations:${clientId}`, 86400); // 24 hours
}
```

### CSP Violation Reporting

```typescript
// CSP violation report endpoint
export async function POST(request: NextRequest) {
  const report = await request.json();
  
  // Log CSP violations for security monitoring
  console.log('CSP Violation:', {
    blockedURI: report['blocked-uri'],
    violatedDirective: report['violated-directive'],
    documentURI: report['document-uri'],
    userAgent: request.headers.get('user-agent')
  });
  
  return NextResponse.json({ received: true });
}
```

---

## 🧪 Testing Security Features

### Rate Limiting Tests

```typescript
describe('Rate Limiting', () => {
  it('should block requests after limit exceeded', async () => {
    // Make requests up to the limit
    for (let i = 0; i < 5; i++) {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'X-Test-User': 'user123' }
      });
      expect(response.status).toBe(200);
    }
    
    // Next request should be blocked
    const blockedResponse = await fetch('/api/reviews', {
      method: 'POST', 
      headers: { 'X-Test-User': 'user123' }
    });
    expect(blockedResponse.status).toBe(429);
  });
});
```

### Image Validation Tests

```typescript
describe('Image Security', () => {
  it('should reject malicious SVG', async () => {
    const maliciousSVG = new File([
      '<svg><script>alert("xss")</script></svg>'
    ], 'malicious.svg', { type: 'image/svg+xml' });
    
    const result = await imageValidators.product(maliciousSVG);
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Image contains potentially malicious content');
  });
});
```

---

## 🚨 Security Checklist

### Pre-Production Checklist

- [ ] **CSP Headers**: Properly configured and tested
- [ ] **Rate Limiting**: Applied to all write endpoints  
- [ ] **Input Validation**: Zod schemas for all APIs
- [ ] **Image Security**: Upload validation enabled
- [ ] **HTTPS**: SSL/TLS certificates configured
- [ ] **Auth Tokens**: Secure session management
- [ ] **Error Handling**: No sensitive data in errors
- [ ] **Logging**: Security events monitored
- [ ] **Dependencies**: No known vulnerabilities
- [ ] **Environment**: Production secrets secured

### Regular Security Tasks

#### Weekly
- [ ] Review rate limit violations
- [ ] Check CSP violation reports
- [ ] Monitor failed upload attempts
- [ ] Review authentication logs

#### Monthly  
- [ ] Update dependencies
- [ ] Rotate API keys
- [ ] Review security logs
- [ ] Test security configurations
- [ ] Penetration testing

#### Quarterly
- [ ] Security audit
- [ ] Update CSP policies
- [ ] Review rate limits
- [ ] Update validation schemas

---

## 📞 Security Incident Response

### Incident Classification

| Severity | Examples | Response Time |
|----------|----------|---------------|
| **Critical** | Data breach, RCE, SQLi | Immediate (< 1 hour) |
| **High** | XSS, Auth bypass | 4 hours |
| **Medium** | Rate limit bypass, DoS | 24 hours |
| **Low** | CSP violations, Info disclosure | 72 hours |

### Response Procedure

1. **Immediate**: Stop the attack, preserve logs
2. **Investigate**: Determine scope and impact  
3. **Contain**: Implement temporary fixes
4. **Recover**: Apply permanent fixes
5. **Review**: Post-incident analysis

### Contact Information

- **Security Team**: security@radhagsarees.com
- **Emergency**: +91-XXXX-XXXXXX  
- **PGP Key**: Available at `/security/pgp-key.txt`

---

This security implementation provides comprehensive protection against common web application vulnerabilities while maintaining good performance and user experience. Regular monitoring and updates are essential for maintaining security posture.