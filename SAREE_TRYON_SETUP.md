# AI Saree Try-On: Environment & Deployment Guide

## 🔧 Local Development Setup

### 1. Clone & Install Dependencies

```bash
# Clone repository
git clone <repo-url>
cd radhagsareees

# Install dependencies
pnpm install

# Install try-on specific packages
pnpm add -w sharp canvas @mediapipe/pose cloudinary

# Navigate to web app
cd apps/web
```

### 2. Environment Configuration

Create `.env.local` in `apps/web/`:

```env
# ============================================
# CLOUDINARY - Image Storage & Processing
# ============================================
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# ============================================
# AI MODEL - Try-On Inference
# ============================================
# Using Replicate API
TRYON_MODEL_ENDPOINT=https://api.replicate.com/v1/predictions
TRYON_MODEL_TYPE=viton-hd
REPLICATE_API_TOKEN=your_replicate_token

# Alternative: Self-hosted endpoint
# TRYON_MODEL_ENDPOINT=http://localhost:5000/predict
# TRYON_MODEL_TYPE=custom

# ============================================
# DATABASE
# ============================================
DATABASE_URL=postgresql://user:password@localhost:5432/saree_db

# ============================================
# OPTIONAL: Monitoring & Analytics
# ============================================
NEXT_PUBLIC_ANALYTICS_ID=your_analytics_id
TRYON_DEBUG=true  # Enable detailed logging
```

### 3. Database Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Run migrations
pnpm prisma migrate deploy

# (Or push schema in development)
pnpm prisma db push

# Seed sample data (optional)
pnpm prisma db seed
```

### 4. Cloudinary Setup

```bash
# Create account at https://cloudinary.com/

# Get credentials
# - Cloud Name: From dashboard
# - API Key: Settings → API
# - API Secret: Settings → API (keep secret!)

# Setup folder structure
pnpm tsx scripts/setup-cloudinary-folders.ts
```

### 5. Replicate API Setup (Optional)

```bash
# Create account at https://replicate.com/

# Get API token
# - Sign up
# - Dashboard → API tokens
# - Create new token

# Test with cURL
curl -X POST https://api.replicate.com/v1/predictions \
  -H "Authorization: Token $REPLICATE_API_TOKEN" \
  -d '{"version": "...", "input": {...}}'
```

### 6. MediaPipe Setup (Client-side)

```bash
# Install MediaPipe
pnpm add @mediapipe/pose

# Download model (automatic on first use in browser)
# Or pre-download for offline support:
wget https://cdn.jsdelivr.net/npm/@mediapipe/pose@latest/pose.min.js
```

### 7. Run Development Server

```bash
# Start Next.js dev server
pnpm dev

# In another terminal, start database
pnpm db:start  # If using Docker

# Try-on endpoint available at:
# http://localhost:3000/api/tryon/generate
```

---

## 📦 Production Deployment

### Vercel Deployment

```bash
# Add environment variables to Vercel project
# Settings → Environment Variables

# Deploy
git push origin main  # Automatically deploys to Vercel

# Verify deployment
curl https://your-domain.vercel.app/api/tryon/generate
```

**Vercel Environment Variables:**
```env
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
REPLICATE_API_TOKEN=your_replicate_token
DATABASE_URL=your_production_db_url
```

### Docker Deployment

```dockerfile
# Dockerfile (in root)
FROM node:18-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy workspace
COPY . .

# Install dependencies
RUN pnpm install --frozen-lockfile

# Build
RUN pnpm build

# Expose port
EXPOSE 3000

# Start
CMD ["pnpm", "start"]
```

```bash
# Build & run
docker build -t radhagsareees .
docker run -p 3000:3000 \
  -e NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name \
  -e CLOUDINARY_API_KEY=your_api_key \
  -e DATABASE_URL=your_db_url \
  radhagsareees
```

### AWS Deployment

```bash
# Using AWS Amplify
amplify init
amplify add hosting
amplify publish

# Or using ECS
aws ecs create-service \
  --service-name saree-tryon \
  --task-definition saree-tryon:1 \
  --desired-count 1
```

---

## 🔒 Security Configuration

### 1. Cloudinary Security

```typescript
// In cloudinary.service.ts
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,  // Force HTTPS
  ssl_verify: true,
});

// Use signed URLs for sensitive assets
const signedUrl = cloudinary.url(publicId, {
  secure: true,
  sign_url: true,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
});
```

### 2. API Route Protection

```typescript
// In route.ts
import { auth } from '@clerk/nextjs';

export async function POST(request: NextRequest) {
  // Optional: Require authentication
  const { userId } = auth();
  if (!userId) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  // Rate limiting
  const remaining = await rateLimit(userId, 'tryon', 10); // 10 per minute
  if (remaining <= 0) {
    return NextResponse.json(
      { error: 'Rate limit exceeded' },
      { status: 429 }
    );
  }

  // ... rest of handler
}
```

### 3. Image Validation

```typescript
// Validate uploaded images
function validateImage(buffer: Buffer): boolean {
  // Check magic bytes
  if (buffer[0] === 0xff && buffer[1] === 0xd8) return true; // JPEG
  if (buffer[0] === 0x89 && buffer[1] === 0x50) return true; // PNG
  if (buffer[0] === 0x47 && buffer[1] === 0x49) return true; // GIF
  return false;
}

// Validate size
if (buffer.length > 10 * 1024 * 1024) {
  throw new Error('Image exceeds 10MB limit');
}

// Validate dimensions
const metadata = await sharp(buffer).metadata();
if (metadata.width! < 256 || metadata.height! < 384) {
  throw new Error('Image too small');
}
```

### 4. CORS Configuration

```typescript
// In API route
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://yourdomain.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}
```

---

## 📊 Performance Optimization

### Image Optimization

```javascript
// next.config.js
module.exports = {
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
    // Cache cloudinary images
    minimumCacheTTL: 31536000, // 1 year
  },
};
```

### API Response Caching

```typescript
// Cache try-on results
export async function POST(request: NextRequest) {
  // Check cache first
  const cacheKey = `tryon-${sku}-${userId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return NextResponse.json(JSON.parse(cached));
  }

  // ... process ...

  // Store in cache for 24 hours
  await redis.setex(cacheKey, 86400, JSON.stringify(result));

  return NextResponse.json(result);
}
```

### Database Query Optimization

```prisma
// Index frequently queried fields
model TryOnLog {
  id String @id @default(cuid())
  userId String
  productSku String
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([productSku])
  @@index([timestamp])
  @@index([userId, timestamp(sort: Desc)])
}
```

---

## 🚨 Monitoring & Logging

### Application Monitoring

```typescript
// Use Sentry for error tracking
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1,
});
```

### Try-On Specific Logging

```typescript
// Log all try-on events
async function logTryOn(userId: string, sku: string, result: TryOnResult) {
  await analytics.track('tryon_generated', {
    userId,
    sku,
    processingTime: result.processingTime,
    imageSize: result.metadata,
    success: true,
    timestamp: new Date(),
  });
}

// Monitor error rates
async function monitorErrors() {
  const lastHour = new Date(Date.now() - 3600000);
  const errors = await prisma.tryOnLog.count({
    where: {
      success: false,
      timestamp: { gte: lastHour },
    },
  });

  if (errors > 10) {
    alert('High error rate detected for try-on feature');
  }
}
```

### Performance Monitoring

```typescript
// Track processing time
console.time('try-on-pipeline');

const startTime = Date.now();
// ... processing ...
const processingTime = Date.now() - startTime;

console.log(`Try-on completed in ${processingTime}ms`);

// Alert if too slow
if (processingTime > 5000) {
  console.warn('Try-on processing slow:', { processingTime, sku });
}
```

---

## 🧪 Testing

### Unit Tests

```typescript
// __tests__/tryOn.service.test.ts
import { ImagePreprocessor } from '@/lib/services/tryOn.service';

describe('ImagePreprocessor', () => {
  it('should resize image', async () => {
    const buffer = await ImagePreprocessor.resize(mockBuffer, 512, 768);
    expect(buffer).toBeDefined();
  });

  it('should handle invalid images', async () => {
    expect(() => ImagePreprocessor.resize(invalidBuffer)).toThrow();
  });
});
```

### Integration Tests

```typescript
// e2e/tryon.spec.ts
import { test, expect } from '@playwright/test';

test('complete try-on flow', async ({ page }) => {
  // Navigate to try-on page
  await page.goto('/products/saree-001/tryon');

  // Upload image
  await page.setInputFiles('input[type=file]', 'test-image.jpg');

  // Wait for processing
  await page.waitForSelector('[data-testid="tryon-result"]', { timeout: 180000 });

  // Verify result
  const result = await page.locator('[data-testid="tryon-result"]');
  await expect(result).toBeVisible();
});
```

---

## 🔍 Troubleshooting

### Common Issues

**1. Cloudinary Authentication Fails**
```bash
# Verify credentials
echo $CLOUDINARY_API_KEY
echo $CLOUDINARY_API_SECRET

# Test with cURL
curl https://api.cloudinary.com/v1_1/your-cloud-name/resources
  -u "api_key:api_secret"
```

**2. Processing Timeout**
```typescript
// Increase timeout
const PROCESSING_TIMEOUT = 300000; // 5 minutes

// Or use async job queue
const job = await queue.add('tryon', { userImageUrl, sku });
const result = await job.finished();
```

**3. Memory Issues**
```bash
# Increase Node memory
NODE_OPTIONS="--max-old-space-size=2048" pnpm dev
```

**4. Database Connection Issues**
```bash
# Check connection string
psql $DATABASE_URL -c "SELECT 1"

# Verify migrations
pnpm prisma migrate status
```

---

## 📞 Support

- **Documentation:** `/docs/SAREE_TRYON_GUIDE.md`
- **Issues:** Create GitHub issue
- **Email:** support@radhagsareees.com

---

**Last Updated:** December 2024
**Version:** 1.0
