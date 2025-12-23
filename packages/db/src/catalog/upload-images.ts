/**
 * Radha G Sarees - Cloudinary Image Upload Script
 * 
 * Uploads placeholder images to Cloudinary following the folder structure.
 * Uses high-quality Unsplash saree images as placeholders.
 * 
 * Usage: npx tsx src/catalog/upload-images.ts
 * 
 * Prerequisites:
 * - Set CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET in .env
 */

import { v2 as cloudinary } from 'cloudinary';
import { productCatalog } from './product-catalog';
import { createCloudinaryStructure, sanitizeForPath } from './cloudinary';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// High-quality placeholder images using Lorem Picsum (reliable for direct fetching)
// These are varied images that work well as saree placeholders
const sareeImages = {
  // Traditional silk sarees - using deep colored images
  traditional: [
    'https://picsum.photos/seed/saree-trad1/1200/1500',
    'https://picsum.photos/seed/saree-trad2/1200/1500',
    'https://picsum.photos/seed/saree-trad3/1200/1500',
  ],
  // Light/pastel sarees
  light: [
    'https://picsum.photos/seed/saree-light1/1200/1500',
    'https://picsum.photos/seed/saree-light2/1200/1500',
    'https://picsum.photos/seed/saree-light3/1200/1500',
  ],
  // Designer/party sarees
  designer: [
    'https://picsum.photos/seed/saree-design1/1200/1500',
    'https://picsum.photos/seed/saree-design2/1200/1500',
    'https://picsum.photos/seed/saree-design3/1200/1500',
  ],
  // Colorful/festive sarees
  festive: [
    'https://picsum.photos/seed/saree-fest1/1200/1500',
    'https://picsum.photos/seed/saree-fest2/1200/1500',
    'https://picsum.photos/seed/saree-fest3/1200/1500',
  ],
  // Category banners
  banners: [
    'https://picsum.photos/seed/banner1/1600/500',
    'https://picsum.photos/seed/banner2/1600/500',
    'https://picsum.photos/seed/banner3/1600/500',
  ],
};

// Map categories to image styles
const categoryImageStyle: Record<string, keyof typeof sareeImages> = {
  banarasi: 'traditional',
  organza: 'light',
  georgette: 'designer',
  satin: 'designer',
  tussar: 'traditional',
  linen: 'light',
  chiffon: 'light',
  bandhani: 'festive',
  kanjivaram: 'traditional',
  ikkat: 'festive',
};

// Configure Cloudinary
function configureCloudinary() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    console.error('❌ Missing Cloudinary credentials!');
    console.error('   Please set these environment variables:');
    console.error('   - CLOUDINARY_CLOUD_NAME or NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME');
    console.error('   - CLOUDINARY_API_KEY');
    console.error('   - CLOUDINARY_API_SECRET');
    process.exit(1);
  }

  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  console.log(`☁️  Cloudinary configured for: ${cloudName}`);
  return cloudName;
}

// Upload a single image
async function uploadImage(
  sourceUrl: string,
  publicId: string,
  folder: string,
  options: Record<string, unknown> = {}
): Promise<string> {
  try {
    const result = await cloudinary.uploader.upload(sourceUrl, {
      public_id: publicId,
      folder: folder,
      overwrite: true,
      resource_type: 'image',
      transformation: [
        { width: 1200, height: 1500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
      ...options,
    });
    return result.secure_url;
  } catch (error) {
    console.error(`   ✗ Failed to upload ${publicId}:`, error);
    throw error;
  }
}

// Upload category banner
async function uploadCategoryBanner(categorySlug: string, index: number): Promise<string> {
  const structure = createCloudinaryStructure();
  const folder = structure.getCategoryPath(categorySlug);
  const sourceImage = sareeImages.banners[index % sareeImages.banners.length];

  const result = await cloudinary.uploader.upload(sourceImage, {
    public_id: 'category-banner',
    folder: folder,
    overwrite: true,
    transformation: [
      { width: 1600, height: 500, crop: 'fill', gravity: 'auto' },
      { quality: 'auto', fetch_format: 'auto' },
    ],
  });

  return result.secure_url;
}

// Upload variant images
async function uploadVariantImages(
  categorySlug: string,
  productSku: string,
  variantSku: string,
  imageStyle: keyof typeof sareeImages
): Promise<{ front: string; back: string; closeup: string; overlay: string }> {
  const structure = createCloudinaryStructure();
  const variantPath = structure.getVariantPath(categorySlug, productSku, variantSku);
  const images = sareeImages[imageStyle];

  // Upload front, back, closeup images
  const [front, back, closeup] = await Promise.all([
    cloudinary.uploader.upload(images[0], {
      public_id: 'front',
      folder: `${variantPath}/images`,
      overwrite: true,
      transformation: [
        { width: 1200, height: 1500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }),
    cloudinary.uploader.upload(images[1] || images[0], {
      public_id: 'back',
      folder: `${variantPath}/images`,
      overwrite: true,
      transformation: [
        { width: 1200, height: 1500, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }),
    cloudinary.uploader.upload(images[2] || images[0], {
      public_id: 'closeup',
      folder: `${variantPath}/images`,
      overwrite: true,
      transformation: [
        { width: 800, height: 800, crop: 'fill', gravity: 'auto' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    }),
  ]);

  // Create overlay (transparent PNG) - using the front image with background removal effect
  const overlay = await cloudinary.uploader.upload(images[0], {
    public_id: 'overlay',
    folder: `${variantPath}/overlay`,
    overwrite: true,
    transformation: [
      { width: 600, height: 800, crop: 'fit' },
      { effect: 'background_removal' }, // AI background removal
      { quality: 'auto', fetch_format: 'png' },
    ],
  }).catch(() => {
    // Fallback if background removal fails (paid feature)
    return cloudinary.uploader.upload(images[0], {
      public_id: 'overlay',
      folder: `${variantPath}/overlay`,
      overwrite: true,
      transformation: [
        { width: 600, height: 800, crop: 'fit' },
        { quality: 'auto', fetch_format: 'png' },
      ],
    });
  });

  return {
    front: front.secure_url,
    back: back.secure_url,
    closeup: closeup.secure_url,
    overlay: overlay.secure_url,
  };
}

// Update database with Cloudinary URLs
async function updateDatabaseUrls(
  variantSku: string,
  images: { front: string; back: string; closeup: string; overlay: string }
) {
  await prisma.variant.update({
    where: { sku: variantSku },
    data: {
      overlayPng: images.overlay,
    },
  });

  // Also update product images
  const variant = await prisma.variant.findUnique({
    where: { sku: variantSku },
    include: { product: true },
  });

  if (variant) {
    const existingImages = variant.product.images || [];
    const newImages = [images.front, images.back, images.closeup];
    const allImages = [...new Set([...existingImages, ...newImages])].slice(0, 9);

    await prisma.product.update({
      where: { id: variant.productId },
      data: { images: allImages },
    });
  }
}

// Update category with banner URL
async function updateCategoryBanner(categorySlug: string, bannerUrl: string) {
  await prisma.category.update({
    where: { slug: categorySlug },
    data: { image: bannerUrl },
  });
}

// Main upload function
async function uploadAllImages() {
  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('    RADHA G SAREES - CLOUDINARY IMAGE UPLOADER');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  const cloudName = configureCloudinary();

  let categoryCount = 0;
  let variantCount = 0;
  let errorCount = 0;

  console.log('📤 Uploading images to Cloudinary...');
  console.log('');

  for (const category of productCatalog.categories) {
    console.log(`📁 ${category.name}:`);

    // Upload category banner
    try {
      const bannerUrl = await uploadCategoryBanner(category.slug, categoryCount);
      await updateCategoryBanner(category.slug, bannerUrl);
      console.log(`   ✓ Category banner uploaded`);
      categoryCount++;
    } catch (error) {
      console.error(`   ✗ Failed to upload category banner`);
      errorCount++;
    }

    const imageStyle = categoryImageStyle[category.slug] || 'traditional';

    // Upload product variant images
    for (const product of category.products) {
      for (const variant of product.variants) {
        try {
          const images = await uploadVariantImages(
            category.slug,
            product.sku,
            variant.sku,
            imageStyle
          );
          await updateDatabaseUrls(variant.sku, images);
          variantCount++;
          process.stdout.write(`   ✓ ${variant.sku}\n`);
        } catch (error) {
          console.error(`   ✗ ${variant.sku} failed`);
          errorCount++;
        }

        // Rate limiting - small delay between uploads
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════');
  console.log('✅ Upload complete!');
  console.log(`   - Categories: ${categoryCount} banners`);
  console.log(`   - Variants: ${variantCount} image sets`);
  console.log(`   - Total images: ~${categoryCount + variantCount * 4}`);
  if (errorCount > 0) {
    console.log(`   ⚠️  Errors: ${errorCount}`);
  }
  console.log('');
  console.log(`🔗 View your media at: https://console.cloudinary.com/console/${cloudName}/media_library`);
  console.log('═══════════════════════════════════════════════════');
}

// Run
async function main() {
  try {
    await uploadAllImages();
  } catch (error) {
    console.error('Failed to upload images:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
