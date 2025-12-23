# Radha G Sarees - Cloudinary Setup Guide

## Folder Structure

The product catalog uses a predictable folder structure in Cloudinary for easy image management:

```
radhag-sarees/
├── categories/
│   ├── banarasi/
│   │   ├── category-banner.jpg
│   │   └── products/
│   │       ├── BAN-001/
│   │       │   └── variants/
│   │       │       ├── BAN-001-RED/
│   │       │       │   ├── images/
│   │       │       │   │   ├── front.jpg
│   │       │       │   │   ├── back.jpg
│   │       │       │   │   └── closeup.jpg
│   │       │       │   └── overlay/
│   │       │       │       └── overlay.png
│   │       │       ├── BAN-001-BLU/
│   │       │       └── BAN-001-GRN/
│   │       ├── BAN-002/
│   │       ├── BAN-003/
│   │       └── BAN-004/
│   │
│   ├── organza/
│   │   └── products/
│   │       ├── ORG-001/
│   │       ├── ORG-002/
│   │       ├── ORG-003/
│   │       ├── ORG-004/
│   │       └── ORG-005/
│   │
│   ├── georgette/
│   ├── satin/
│   ├── tussar/
│   ├── linen/
│   ├── chiffon/
│   ├── bandhani/
│   ├── kanjivaram/
│   └── ikkat/
```

## Environment Setup

Add these variables to your `.env` file (NO API secrets in client code):

```env
# Cloudinary Configuration (PUBLIC only)
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
```

For server-side operations (NOT in browser):
```env
# Server-side only - NEVER expose these
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
```

## Image Naming Convention

| Image Type | Filename | Purpose |
|------------|----------|---------|
| front.jpg | Main view | Primary product image |
| back.jpg | Pallu/Back | Shows the pallu design |
| closeup.jpg | Detail | Fabric texture/work closeup |
| overlay.png | Try-On | Transparent PNG for virtual try-on |

## URL Pattern

```
https://res.cloudinary.com/{cloud}/image/upload/{transformations}/radhag-sarees/categories/{category}/products/{product-sku}/variants/{variant-sku}/images/{image-type}.jpg
```

### Example URLs

**Front image with transformations:**
```
https://res.cloudinary.com/your-cloud/image/upload/w_800,h_1000,c_fill,q_auto,f_auto/radhag-sarees/categories/banarasi/products/BAN-001/variants/BAN-001-RED/images/front.jpg
```

**Overlay PNG for try-on:**
```
https://res.cloudinary.com/your-cloud/image/upload/w_600,h_800,c_fit,q_auto,f_png/radhag-sarees/categories/banarasi/products/BAN-001/variants/BAN-001-RED/overlay/overlay.png
```

## Transformation Presets

| Preset | Transformation | Use Case |
|--------|---------------|----------|
| thumbnail | `w_150,h_150,c_fill,q_auto,f_auto` | Cart, wishlist icons |
| card | `w_400,h_500,c_fill,q_auto,f_auto` | Product grid cards |
| productPage | `w_800,h_1000,c_fill,q_auto,f_auto` | Product detail page |
| fullSize | `w_1200,h_1500,c_fill,q_auto,f_auto` | Zoom/lightbox view |
| overlay | `w_600,h_800,c_fit,q_auto,f_png` | Virtual try-on overlay |
| categoryBanner | `w_1200,h_400,c_fill,q_auto,f_auto` | Category header |

## SKU Reference

### Category Prefixes
| Category | Prefix | Products |
|----------|--------|----------|
| Banarasi | BAN | BAN-001 to BAN-004 |
| Organza | ORG | ORG-001 to ORG-005 |
| Georgette | GEO | GEO-001 to GEO-004 |
| Satin | SAT | SAT-001 to SAT-005 |
| Tussar | TUS | TUS-001 to TUS-004 |
| Linen | LIN | LIN-001 to LIN-005 |
| Chiffon | CHF | CHF-001 to CHF-004 |
| Bandhani | BND | BND-001 to BND-005 |
| Kanjivaram | KNJ | KNJ-001 to KNJ-004 |
| Ikkat | IKK | IKK-001 to IKK-005 |

### Color Codes
| Color | Code | Hex |
|-------|------|-----|
| Royal Red | RED | #8B0000 |
| Deep Blue | BLU | #1B365D |
| Emerald Green | GRN | #046307 |
| Golden Yellow | GLD | #D4AF37 |
| Magenta Pink | MGT | #8B008B |
| Peacock Blue | PCK | #005F6B |
| Wine Red | WIN | #722F37 |
| Navy Blue | NVY | #000080 |
| Purple | PRP | #800080 |
| Maroon | MRN | #800000 |
| And more... | ... | ... |

### Variant SKU Format
```
{PRODUCT-SKU}-{COLOR-CODE}

Examples:
- BAN-001-RED (Banarasi Product 1, Royal Red)
- ORG-003-BLP (Organza Product 3, Blush Pink)
- KNJ-002-GLD (Kanjivaram Product 2, Golden Yellow)
```

## Bulk Upload Script

To bulk upload images, use the following structure:

```bash
# Install Cloudinary CLI
npm install -g cloudinary-cli

# Configure (do this once)
cloudinary config -C your-cloud-name -K your-api-key -S your-api-secret

# Upload a folder recursively
cloudinary upload_dir ./local-images -f radhag-sarees/categories/banarasi/products/BAN-001
```

## Usage in Code

```typescript
import {
  getVariantImageUrls,
  getVariantOverlayUrl,
  imageTransformations,
  getCloudinaryUrl
} from '@radha-g-sarees/db/catalog';

// Get all images for a variant
const images = getVariantImageUrls('banarasi', 'BAN-001', 'BAN-001-RED');
// Returns: { front: '...', back: '...', closeup: '...' }

// Get overlay for virtual try-on
const overlay = getVariantOverlayUrl('banarasi', 'BAN-001', 'BAN-001-RED');

// Get URL with transformations
const thumbnailUrl = getCloudinaryUrl(
  'radhag-sarees/categories/banarasi/products/BAN-001/variants/BAN-001-RED/images/front.jpg',
  { transformations: imageTransformations.thumbnail }
);
```

## Product Catalog Statistics

- **Total Categories:** 10
- **Total Products:** 42
- **Total Variants:** 126
- **Images per Variant:** 4 (3 photos + 1 overlay)
- **Total Images Required:** ~504

### Price Ranges by Category

| Category | Min Price | Max Price |
|----------|-----------|-----------|
| Linen | ₹2,800 | ₹10,500 |
| Bandhani | ₹3,500 | ₹20,000 |
| Chiffon | ₹5,500 | ₹22,500 |
| Ikkat | ₹5,500 | ₹35,000 |
| Tussar | ₹7,500 | ₹18,500 |
| Georgette | ₹7,500 | ₹20,000 |
| Organza | ₹8,500 | ₹22,000 |
| Satin | ₹5,500 | ₹28,000 |
| Banarasi | ₹28,000 | ₹65,000 |
| Kanjivaram | ₹35,000 | ₹95,000 |

## Seeding the Database

```bash
# Navigate to db package
cd packages/db

# Run seed with clean (removes existing products)
npx tsx src/catalog/seed-catalog.ts --clean

# Run seed without cleaning (upsert mode)
npx tsx src/catalog/seed-catalog.ts

# Skip inventory creation
npx tsx src/catalog/seed-catalog.ts --skip-inventory
```

## Placeholder Images

Until actual product photos are uploaded, the catalog will generate placeholder URLs. You can use these services for development:

1. **Cloudinary Demo Images** - Use Cloudinary's sample images
2. **Unsplash** - High-quality free photos
3. **Placeholder.com** - Simple placeholder images

Replace in `.env` for development:
```env
# Use Cloudinary demo account for testing
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=demo
```
