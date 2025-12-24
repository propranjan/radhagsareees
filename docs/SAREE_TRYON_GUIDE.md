# AI Saree Try-On Implementation Guide

Complete production-ready implementation for AI-powered saree virtual try-on in Next.js 14 ecommerce application.

## 📋 Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Setup Instructions](#setup-instructions)
3. [API Reference](#api-reference)
4. [Frontend Components](#frontend-components)
5. [Cloudinary Configuration](#cloudinary-configuration)
6. [AI Model Integration](#ai-model-integration)
7. [Database Schema](#database-schema)
8. [Performance Optimization](#performance-optimization)
9. [Troubleshooting](#troubleshooting)

---

## Architecture Overview

### Tech Stack

```
Frontend:
├── Next.js 14 (App Router)
├── React 18
├── TypeScript
├── Tailwind CSS
└── Lucide Icons

Backend:
├── Node.js API Routes
├── Prisma ORM
└── Server-side Processing

External Services:
├── Cloudinary (image storage, transformations)
├── Replicate (AI model inference)
├── MediaPipe (pose detection)
└── Sharp (image processing)
```

### Data Flow

```
User Upload → Cloudinary
    ↓
Preprocessing (crop, normalize, enhance)
    ↓
Pose Detection (MediaPipe)
    ↓
Pose Alignment & Transform
    ↓
AI Try-On Inference (VITON-HD/TryOnDiffusion)
    ↓
Postprocessing (blend, color adjust)
    ↓
Upload Result → Cloudinary
    ↓
Return URL to Frontend
    ↓
Display with Before/After Slider
```

---

## Setup Instructions

### 1. Environment Variables

Create `.env.local` in `apps/web/`:

```env
# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# AI Model
TRYON_MODEL_ENDPOINT=https://api.replicate.com/v1/predictions
TRYON_MODEL_TYPE=viton-hd
REPLICATE_API_TOKEN=your_replicate_token

# Database
DATABASE_URL=your_database_url
```

### 2. Install Dependencies

```bash
# Core image processing
pnpm add sharp canvas

# MediaPipe (client-side pose detection)
pnpm add @mediapipe/pose

# Cloudinary
pnpm add cloudinary next-cloudinary

# Optional: TensorFlow for local inference
pnpm add @tensorflow/tfjs @tensorflow/tfjs-backend-webgl
```

### 3. Database Schema

Add to your Prisma schema:

```prisma
model TryOnLog {
  id        String   @id @default(cuid())
  userId    String
  productSku String
  variant   String   @default("default")
  success   Boolean
  error     String?
  timestamp DateTime @default(now())

  @@index([userId])
  @@index([productSku])
  @@index([timestamp])
}

model SareeAsset {
  id        String   @id @default(cuid())
  sku       String   @unique
  variant   String   @default("default")
  imageUrl  String
  maskUrl   String
  overlayUrl String
  textureUrl String?
  createdAt DateTime @default(now())

  @@unique([sku, variant])
}
```

### 4. Cloudinary Folder Structure

Automatic structure created on first upload:

```
radhagsareees-cloud/
├── saree-tryon/
│   ├── user-images/
│   │   ├── temp/
│   │   └── [user-id]-[session-id]/
│   ├── saree-assets/
│   │   ├── images/[sku]/[variant]/
│   │   ├── masks/[sku]/[variant]/
│   │   ├── overlays/[sku]/[variant]/
│   │   └── textures/[sku]/[variant]/
│   ├── outputs/
│   │   ├── tryon-results/[user-id]-[sku]-[session]/
│   │   └── temp/
│   └── cache/
│       └── processing/
```

---

## API Reference

### POST `/api/tryon/generate`

Generate AI try-on result for user image and selected saree.

**Request:**
```typescript
{
  userImageUrl: string;    // Cloudinary URL
  sku: string;             // Saree product SKU
  variant?: string;        // Variant ID (default: 'default')
  userId?: string;         // Optional user ID for logging
}
```

**Response:**
```typescript
{
  success: boolean;
  data?: {
    outputImageUrl: string;
    originalImageUrl: string;
    poseData: {
      keypoints: Array<{ x, y, score, name }>;
      score: number;
    };
    processingTime: number;
    sessionId: string;
  };
  error?: string;
}
```

**Error Handling:**
```typescript
// Missing fields
Status: 400
{ error: "Missing required fields: userImageUrl, sku" }

// Saree assets not found
Status: 404
{
  error: "Saree assets not available for SKU: ABC123",
  missing: { image: true, mask: false, overlay: false }
}

// Processing timeout
Status: 500
{ error: "Processing timeout" }
```

### POST `/api/cloudinary/signature`

Get signature for client-side Cloudinary uploads.

**Request:**
```typescript
{
  folder?: string; // Upload folder (default: 'saree-tryon/user-images')
}
```

**Response:**
```typescript
{
  signature: string;
  timestamp: number;
  apiKey: string;
  cloudName: string;
  folder: string;
}
```

---

## Frontend Components

### AISareeTryOn Component

Main try-on interface component.

```typescript
import { AISareeTryOn } from '@/components/AISareeTryOn';

export function TryOnPage() {
  const product = {
    sku: 'SAREE-001',
    name: 'Royal Blue Silk Saree',
    price: 4999,
    image: 'https://res.cloudinary.com/...',
    variants: [
      { id: 'default', name: 'Classic', image: '...' },
      { id: 'embroidered', name: 'Embroidered', image: '...' },
    ],
  };

  return (
    <AISareeTryOn
      product={product}
      userId={userId}
      onSuccess={(result) => {
        console.log('Try-on completed:', result);
      }}
    />
  );
}
```

### Available Subcomponents

- **BeforeAfterSlider**: Interactive image comparison
- **VariantSelector**: Saree variant selection grid
- **ShareButton**: Multi-platform sharing with WhatsApp integration

### Hooks

#### useTryOn

```typescript
const {
  loading,
  error,
  originalImage,
  tryOnImage,
  processingTime,
  generateTryOn,
  reset,
  cancel,
} = useTryOn({
  onSuccess: (result) => {},
  onError: (error) => {},
});

// Call when ready
await generateTryOn(userImageUrl, sku, variant);
```

#### useImageUpload

```typescript
const {
  uploading,
  progress,
  error,
  uploadImage,
  cancel,
  reset,
} = useImageUpload({
  onSuccess: (url, publicId) => {},
  onError: (error) => {},
  onProgress: (progress) => {},
});

// Upload image
const result = await uploadImage(file);
// result: { url: string, publicId: string }
```

#### usePoseDetection

```typescript
const {
  videoRef,
  canvasRef,
  pose,
  loading,
  error,
  detectPose,
} = usePoseDetection();

// Detect from video/canvas
const pose = await detectPose(videoElement);
```

---

## Cloudinary Configuration

### Transformation Examples

```typescript
// Optimize for try-on display
const url = cloudinary.url(publicId, {
  width: 512,
  height: 768,
  crop: 'fill',
  quality: 'auto',
  fetch_format: 'auto',
});

// Create thumbnail for variant selector
const thumbUrl = cloudinary.url(publicId, {
  width: 200,
  height: 300,
  quality: 'auto',
});

// Before/After comparison
const comparisonUrl = `
  https://res.cloudinary.com/${cloudName}/image/upload/
  c_pad,h_384,w_1024/
  l_${afterImageId},w_512,fl_layer_apply/
  ${beforeImageId}
`;
```

### Automated Transformations

Enable auto-optimization in Cloudinary settings:

```
Settings → Upload → Auto-tagging: Enable
           Upload → Quality: Auto-optimized
           Transformation → Fetch Format: Auto
           Transformation → Quality: Auto
```

---

## AI Model Integration

### VITON-HD (Recommended)

**Setup via Replicate:**

1. Create account at [replicate.com](https://replicate.com)
2. Add API token to environment
3. Model endpoint: `https://api.replicate.com/v1/predictions`

**Request Format:**
```typescript
const formData = new FormData();
formData.append('human_img', userImageBlob);
formData.append('clothing_img', sareeImageBlob);
formData.append('mask_img', sareeMaskBlob);

const response = await fetch(endpoint, {
  method: 'POST',
  headers: {
    'Authorization': `Token ${REPLICATE_API_TOKEN}`,
  },
  body: formData,
});
```

### Alternative Models

**TryOnDiffusion:**
- More flexible with clothing types
- Better fabric texture preservation
- Slightly slower processing

**ClothFlow:**
- Real-time capable
- Lighter model
- Good for mobile

### Running Locally (Optional)

```bash
# Using TensorFlow.js
pnpm add @tensorflow/tfjs-backend-webgl

# Or use ONNX Runtime
pnpm add onnxruntime-web
```

---

## Database Schema

### Try-On Log Table

```sql
CREATE TABLE "TryOnLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "productSku" TEXT NOT NULL,
  "variant" TEXT NOT NULL DEFAULT 'default',
  "success" BOOLEAN NOT NULL,
  "error" TEXT,
  "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX "TryOnLog_userId_idx" ON "TryOnLog"("userId");
CREATE INDEX "TryOnLog_productSku_idx" ON "TryOnLog"("productSku");
CREATE INDEX "TryOnLog_timestamp_idx" ON "TryOnLog"("timestamp");
```

### Saree Assets Table

```sql
CREATE TABLE "SareeAsset" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sku" TEXT NOT NULL UNIQUE,
  "variant" TEXT NOT NULL DEFAULT 'default',
  "imageUrl" TEXT NOT NULL,
  "maskUrl" TEXT NOT NULL,
  "overlayUrl" TEXT NOT NULL,
  "textureUrl" TEXT,
  "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX "SareeAsset_sku_variant_key" ON "SareeAsset"("sku", "variant");
```

---

## Performance Optimization

### Image Optimization

1. **Compression:**
   ```typescript
   // Automatic via Cloudinary
   quality: 'auto'        // 80-95% quality
   fetch_format: 'auto'   // WebP for modern browsers
   ```

2. **Caching:**
   ```typescript
   // Browser cache headers
   maxAge: 31536000  // 1 year for versioned assets
   ```

3. **CDN Distribution:**
   - Cloudinary automatically uses nearest edge server
   - Images served from ~200+ locations globally

### Processing Optimization

1. **Server-Side Caching:**
   ```typescript
   // Cache preprocessed images
   const cacheKey = `preprocessed-${userId}-${sku}`;
   const cached = await redis.get(cacheKey);
   ```

2. **Batch Processing:**
   - Queue try-on requests
   - Use worker threads for parallel processing

3. **Model Optimization:**
   - VITON-HD: ~2-3 seconds per image
   - Quantized models: 1-2 seconds
   - Local GPU inference: 500ms-1s

### Database Optimization

```typescript
// Add indexes
@@index([userId, timestamp(sort: Desc)])
@@index([productSku, success])
@@index([timestamp(sort: Desc)])
```

---

## Troubleshooting

### Common Issues

**1. Image Upload Fails**
```
Error: "Upload failed: 413 Payload Too Large"
Solution: Increase Next.js body size limit
```

```typescript
// next.config.js
module.exports = {
  api: {
    bodyParser: {
      sizeLimit: '50mb',
    },
  },
};
```

**2. Pose Detection Not Working**
```
Error: "MediaPipe not initialized"
Solution: Ensure browser supports WebGL
```

```typescript
// Check GPU support
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');
const hasGPU = !!gl;
```

**3. Saree Assets Missing**
```
Error: "Saree assets not available for SKU: ABC123"
Solution: Upload saree images to Cloudinary
```

```bash
# Using Cloudinary CLI
cld config set cloud_name your_cloud_name
cld uploader upload saree.jpg --folder saree-tryon/saree-assets/images/ABC123/default
```

**4. Processing Timeout**
```
Error: "Processing timeout"
Solution: Increase timeout or optimize model
```

```typescript
// Increase timeout in API route
const PROCESSING_TIMEOUT = 300000; // 5 minutes
```

**5. Memory Issues**
```
Error: "ENOMEM: out of memory"
Solution: Reduce image resolution or use streaming
```

```typescript
// Reduce input resolution
const preprocessed = await ImagePreprocessor.resize(image, 384, 576);
```

### Debug Mode

Enable detailed logging:

```typescript
// In tryOn.service.ts
const DEBUG = process.env.TRYON_DEBUG === 'true';

if (DEBUG) {
  console.time('Try-on pipeline');
  console.log('Processing user image...');
  // ... rest of pipeline
  console.timeEnd('Try-on pipeline');
}
```

### Performance Monitoring

Track metrics:

```typescript
// Record to monitoring service
await analytics.track('try_on_generated', {
  userId,
  sku,
  processingTime,
  success: true,
  imageSize: {
    input: userImageSize,
    output: tryOnImageSize,
  },
});
```

---

## Best Practices

1. **Security:**
   - Validate all user uploads
   - Use signed Cloudinary URLs
   - Rate-limit try-on API
   - Store sensitive keys in environment only

2. **User Experience:**
   - Show progress indicators
   - Allow operation cancellation
   - Provide clear error messages
   - Cache results for same user+product

3. **Scalability:**
   - Use message queues (Bull/RabbitMQ)
   - Implement request batching
   - Use CDN for image serving
   - Monitor API rate limits

4. **Testing:**
   - Test with various body types
   - Test with different lighting conditions
   - Test on mobile devices
   - Benchmark processing time

---

## Support & Resources

- **Cloudinary Docs:** https://cloudinary.com/documentation
- **MediaPipe:** https://mediapipe.dev
- **Replicate:** https://replicate.com/docs
- **VITON-HD Paper:** https://arxiv.org/abs/2104.05990
- **Sharp Docs:** https://sharp.pixelplumbing.com

---

**Last Updated:** December 2024
**Version:** 1.0
**Status:** Production Ready
