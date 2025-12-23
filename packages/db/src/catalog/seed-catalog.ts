/**
 * Radha G Sarees - Catalog Seed Script
 * 
 * Seeds the database with the complete product catalog:
 * - 10 Categories
 * - 42 Products
 * - 126 Variants (3 per product)
 * 
 * Usage: npx tsx src/catalog/seed-catalog.ts
 */

import { PrismaClient } from '@prisma/client';
import { productCatalog, catalogStats } from './product-catalog';

const prisma = new PrismaClient();

interface SeedOptions {
  cleanExisting?: boolean;
  skipInventory?: boolean;
  defaultStock?: number;
}

async function seedCatalog(options: SeedOptions = {}) {
  const { cleanExisting = false, skipInventory = false, defaultStock = 10 } = options;

  console.log('🌱 Starting Radha G Sarees catalog seed...');
  console.log(`📊 Catalog Stats:`);
  console.log(`   - Categories: ${catalogStats.totalCategories}`);
  console.log(`   - Products: ${catalogStats.totalProducts}`);
  console.log(`   - Variants: ${catalogStats.totalVariants}`);
  console.log(`   - Price Range: ₹${catalogStats.priceRange.min.toLocaleString()} - ₹${catalogStats.priceRange.max.toLocaleString()}`);
  console.log('');

  try {
    if (cleanExisting) {
      console.log('🧹 Cleaning existing product data...');
      // Delete in order of dependencies
      await prisma.inventory.deleteMany();
      await prisma.cartItem.deleteMany();
      await prisma.wishlist.deleteMany();
      await prisma.orderItem.deleteMany();
      await prisma.review.deleteMany();
      await prisma.variant.deleteMany();
      await prisma.product.deleteMany();
      await prisma.category.deleteMany();
      console.log('   ✓ Existing data cleaned');
    }

    // Create categories
    console.log('📁 Creating categories...');
    const categoryMap = new Map<string, string>();

    for (const category of productCatalog.categories) {
      const created = await prisma.category.upsert({
        where: { slug: category.slug },
        update: {
          name: category.name,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          isActive: true,
        },
        create: {
          name: category.name,
          slug: category.slug,
          description: category.description,
          image: category.image,
          sortOrder: category.sortOrder,
          isActive: true,
        },
      });
      categoryMap.set(category.slug, created.id);
      console.log(`   ✓ ${category.name}`);
    }

    // Create products with variants
    console.log('');
    console.log('🛍️  Creating products with variants...');
    
    let productCount = 0;
    let variantCount = 0;

    for (const category of productCatalog.categories) {
      const categoryId = categoryMap.get(category.slug);
      if (!categoryId) {
        console.error(`   ✗ Category not found: ${category.slug}`);
        continue;
      }

      console.log(`   📦 ${category.name}:`);

      for (const product of category.products) {
        // Collect all image URLs from variants for product images
        const productImages = product.variants.flatMap(v => [
          v.images.front,
          v.images.back,
          v.images.closeup,
        ]).slice(0, 6); // Limit to 6 images

        const createdProduct = await prisma.product.upsert({
          where: { slug: product.slug },
          update: {
            title: product.title,
            description: product.description,
            images: productImages,
            care: product.care,
            categoryId,
            isActive: true,
            isNew: product.isNew || false,
            isFeatured: product.isFeatured || false,
            metaTitle: `${product.title} | Radha G Sarees`,
            metaDescription: product.description.substring(0, 160),
          },
          create: {
            slug: product.slug,
            title: product.title,
            description: product.description,
            images: productImages,
            care: product.care,
            categoryId,
            isActive: true,
            isNew: product.isNew || false,
            isFeatured: product.isFeatured || false,
            metaTitle: `${product.title} | Radha G Sarees`,
            metaDescription: product.description.substring(0, 160),
          },
        });

        productCount++;

        // Create variants
        for (const variant of product.variants) {
          const createdVariant = await prisma.variant.upsert({
            where: { sku: variant.sku },
            update: {
              productId: createdProduct.id,
              color: variant.color,
              size: 'Free Size',
              mrp: variant.mrp,
              price: variant.price,
              overlayPng: variant.overlayPng,
              isActive: true,
            },
            create: {
              sku: variant.sku,
              productId: createdProduct.id,
              color: variant.color,
              size: 'Free Size',
              mrp: variant.mrp,
              price: variant.price,
              overlayPng: variant.overlayPng,
              isActive: true,
            },
          });

          variantCount++;

          // Create inventory if not skipped
          if (!skipInventory) {
            await prisma.inventory.upsert({
              where: { variantId: createdVariant.id },
              update: {
                qtyAvailable: variant.stock || defaultStock,
                lowStockThreshold: 5,
                reservedQty: 0,
              },
              create: {
                variantId: createdVariant.id,
                qtyAvailable: variant.stock || defaultStock,
                lowStockThreshold: 5,
                reservedQty: 0,
              },
            });
          }
        }

        console.log(`      ✓ ${product.title} (${product.variants.length} variants)`);
      }
    }

    console.log('');
    console.log('✅ Catalog seed completed successfully!');
    console.log(`   - Created ${productCount} products`);
    console.log(`   - Created ${variantCount} variants`);
    if (!skipInventory) {
      console.log(`   - Created ${variantCount} inventory records`);
    }

    return {
      success: true,
      categories: productCatalog.categories.length,
      products: productCount,
      variants: variantCount,
    };
  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  }
}

// Run if called directly
async function main() {
  const args = process.argv.slice(2);
  const cleanExisting = args.includes('--clean');
  const skipInventory = args.includes('--skip-inventory');

  console.log('');
  console.log('═══════════════════════════════════════════════════');
  console.log('       RADHA G SAREES - CATALOG SEEDER');
  console.log('═══════════════════════════════════════════════════');
  console.log('');

  if (cleanExisting) {
    console.log('⚠️  Warning: --clean flag detected. Existing products will be deleted.');
  }

  try {
    await seedCatalog({ cleanExisting, skipInventory });
  } catch (error) {
    console.error('Failed to seed catalog:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

export { seedCatalog };
