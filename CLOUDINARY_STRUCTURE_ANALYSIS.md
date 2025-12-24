# Cloudinary Folder Structure Analysis & Path Fixes

## Summary
After analyzing the actual Cloudinary folder structure in the `radhag-sarees` media library, we discovered that images are organized in a nested folder hierarchy rather than a flat structure. This document captures the findings and the fixes applied.

## Actual Cloudinary Structure

### Folder Hierarchy
```
radhag-sarees/
├── categories/
│   ├── banarasi/
│   ├── bandhani/
│   ├── chiffon/
│   ├── georgette/
│   ├── ikkat/
│   ├── kanjivaram/
│   ├── linen/
│   ├── organza/
│   └── satin/
│       └── products/
│           └── [PRODUCT-SKU]/
│               ├── variants/
│               │   └── [SKU-variant]/
│               │       ├── images/
│               │       │   ├── front
│               │       │   ├── back
│               │       │   └── closeup
│               │       └── overlay/
│               │           └── overlay
│               └── category-banner (at category level)
```

### Example Product Path
For Banarasi saree `BAN-001` variant `BAN-001-BLU`:
```
radhag-sarees/categories/banarasi/products/BAN-001/variants/ban-001-blu/images/front
radhag-sarees/categories/banarasi/products/BAN-001/variants/ban-001-blu/images/back
radhag-sarees/categories/banarasi/products/BAN-001/variants/ban-001-blu/images/closeup
radhag-sarees/categories/banarasi/products/BAN-001/variants/ban-001-blu/overlay/overlay
```

### Available Categories
- banarasi
- bandhani
- chiffon
- georgette
- ikkat
- kanjivaram
- linen
- organza
- satin

### Image Types Available
- `front` - Primary product image (without extension)
- `back` - Back view of the saree
- `closeup` - Close-up detail image
- `overlay` - Mask/overlay for try-on feature

## Previous Assumptions (INCORRECT)
- ❌ Flat structure: `radhag-sarees/[SKU].jpg`
- ❌ Nested with variant: `radhag-sarees/[SKU]/[SKU].jpg`

## Changes Applied

### 1. Updated CloudinaryPaths Class
**File:** `apps/web/src/lib/services/cloudinary.service.ts`

#### Before:
```typescript
static getSareePaths(sku: string, variant: string = 'default') {
  const mediaLibraryFolder = CLOUDINARY_FOLDERS.SAREE_IMAGES;
  return {
    image: {
      url: (cloudName: string) => 
        `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${mediaLibraryFolder}/${sku}.jpg`,
    },
    // ...
  };
}
```

#### After:
```typescript
static getSareePaths(sku: string, variant: string = 'default', category: string = 'banarasi') {
  const variantCode = variant === 'default' ? sku.toLowerCase() : variant.toLowerCase();
  const imagePath = `radhag-sarees/categories/${category}/products/${sku}/variants/${variantCode}/images`;
  const overlayPath = `radhag-sarees/categories/${category}/products/${sku}/variants/${variantCode}/overlay`;

  return {
    image: {
      url: (cloudName: string) => 
        `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${imagePath}/front`,
    },
    imageBack: {
      url: (cloudName: string) => 
        `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${imagePath}/back`,
    },
    imageCloseup: {
      url: (cloudName: string) => 
        `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${imagePath}/closeup`,
    },
    overlay: {
      url: (cloudName: string) => 
        `https://res.cloudinary.com/${cloudName}/image/upload/w_800,h_1000,c_fill/${overlayPath}/overlay`,
    },
    // ...
  };
}
```

**Key Changes:**
- Added `category` parameter (defaults to 'banarasi')
- Changed from flat to nested path structure
- Added support for multiple image types (front, back, closeup)
- Properly constructs variant code from SKU or explicit variant parameter

### 2. Updated useTryOn Hook
**File:** `apps/web/src/lib/hooks/useTryOn.ts`

Added category parameter to generateTryOn function:
```typescript
const generateTryOn = useCallback(
  async (userImageUrl: string, sku: string, variant?: string, category?: string) => {
    // ...
    body: JSON.stringify({
      userImageUrl,
      sku,
      variant: variant || 'default',
      category: category || 'banarasi', // Default to banarasi if not provided
    }),
  },
  [options]
);
```

### 3. Updated API Route
**File:** `apps/web/src/app/api/tryon/generate/route.ts`

Added category parameter to request handling:
```typescript
export async function POST(request: NextRequest) {
  const { userImageUrl, sku, variant = 'default', category = 'banarasi', userId } = body;
  // ...
  const result = await Promise.race([
    processUserImage(userImageUrl, sku, variant, category, sessionId, userId),
    timeoutPromise,
  ]);
}

async function processUserImage(
  userImageUrl: string,
  sku: string,
  variant: string,
  category: string,
  sessionId: string,
  userId?: string
) {
  // ...
  const sareePaths = CloudinaryPaths.getSareePaths(sku, variant, category);
  // ...
}
```

### 4. Updated AISareeTryOn Component
**File:** `apps/web/src/components/AISareeTryOn.tsx`

Updated SareeProduct interface to include category:
```typescript
interface SareeProduct {
  sku: string;
  name: string;
  price: number;
  image: string;
  category?: string; // Product category slug for Cloudinary paths
  variants?: Array<{
    id: string;
    name: string;
    image: string;
  }>;
}
```

Updated all generateTryOn calls to pass category:
```typescript
// In handleCameraCapture
await generateTryOn(result.url, product.sku, selectedVariant, product.category);

// In handleGenerateTryOn
await generateTryOn(uploadedImage, product.sku, selectedVariant, product.category);

// In handleVariantChange
generateTryOn(uploadedImage, product.sku, variantId, product.category);
```

### 5. Updated Product Page
**File:** `apps/web/src/app/product/[slug]/page.tsx`

Pass category slug from product data to AISareeTryOn component:
```typescript
<AISareeTryOn
  product={{
    sku: selectedVariant.sku,
    name: product.title,
    price: selectedVariant.price,
    image: product.images[0],
    category: product.category.slug,  // ← Added
    variants: [
      {
        id: selectedVariant.id,
        name: `${selectedVariant.color} - ${selectedVariant.size}`,
        image: product.images[0],
      }
    ]
  }}
  userId={userToken}
  // ...
/>
```

## Data Flow

### Old Flow (INCORRECT)
```
Product Page
  ↓
AISareeTryOn (no category)
  ↓
useTryOn (no category)
  ↓
API Route (no category)
  ↓
CloudinaryPaths (flat path: radhag-sarees/SKU.jpg)
  ↓
Cloudinary ❌ Image not found
```

### New Flow (CORRECT)
```
Product Page (has category.slug)
  ↓
AISareeTryOn (receives category)
  ↓
useTryOn (passes category)
  ↓
API Route (receives & validates category)
  ↓
CloudinaryPaths (correct nested path: radhag-sarees/categories/[category]/products/[sku]/...)
  ↓
Cloudinary ✅ Images found and loaded
```

## Testing

To verify the paths are correct:

1. **Check Direct URL in Browser:**
   ```
   https://res.cloudinary.com/dmkm5eqtk/image/upload/w_800,h_1000,c_fill/radhag-sarees/categories/banarasi/products/BAN-001/variants/ban-001-blu/images/front
   ```

2. **Check via API Endpoint (during dev):**
   ```
   GET /api/debug/cloudinary-structure
   ```
   This returns actual folder structure from Cloudinary API

3. **Verify in Try-On Flow:**
   - Open a product page
   - Click "Try Camera" or upload image
   - Check browser network tab for image download URLs
   - Verify images load successfully

## Files Modified

1. `apps/web/src/lib/services/cloudinary.service.ts` - CloudinaryPaths class
2. `apps/web/src/lib/hooks/useTryOn.ts` - useTryOn hook
3. `apps/web/src/app/api/tryon/generate/route.ts` - API route
4. `apps/web/src/components/AISareeTryOn.tsx` - Component interface and calls
5. `apps/web/src/app/product/[slug]/page.tsx` - Product page integration

## Backwards Compatibility

- Default category is 'banarasi' for any calls that don't provide it
- Old code will still work but use default category
- Variant defaults to product SKU if not provided separately

## Next Steps

1. ✅ Discovered actual Cloudinary structure via API query
2. ✅ Updated CloudinaryPaths to match actual structure
3. ✅ Added category parameter throughout the stack
4. ✅ Updated components to pass category from product data
5. 📋 Test the complete flow end-to-end
6. 📋 Commit changes with descriptive message
7. 📋 Monitor try-on generation for successful image loading

---

**Last Updated:** 2025
**Cloudinary Cloud Name:** dmkm5eqtk
**API Key:** 967424944859856
