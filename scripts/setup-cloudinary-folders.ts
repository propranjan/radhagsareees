/**
 * Cloudinary Folder Setup Script
 * Creates organized folder structure for saree assets
 * 
 * Usage: pnpm tsx scripts/setup-cloudinary-folders.ts
 */

import { CloudinaryUploadManager, CLOUDINARY_FOLDERS, SareeAssetManager } from '../apps/web/src/lib/services/cloudinary.service';

/**
 * Sample saree SKUs for initialization
 */
const SAMPLE_SKUS = [
  'SAREE-001',  // Royal Blue Silk
  'SAREE-002',  // Golden Kanjivaram
  'SAREE-003',  // Red Chikankari
  'SAREE-004',  // Green Bandhani
  'SAREE-005',  // Purple Patola
];

/**
 * Variant types
 */
const VARIANTS = ['default', 'embroidered', 'zari-work', 'printed'];

/**
 * Setup Cloudinary folder structure
 */
async function setupCloudinaryFolders() {
  console.log('🚀 Starting Cloudinary folder structure setup...\n');

  try {
    // Create folders for each SKU
    for (const sku of SAMPLE_SKUS) {
      console.log(`📦 Setting up folders for SKU: ${sku}`);

      for (const variant of VARIANTS) {
        await SareeAssetManager.initializeSareeStructure(sku);
        console.log(`   ✓ Initialized structure for variant: ${variant}`);
      }

      console.log();
    }

    console.log('✅ Folder structure setup complete!\n');
    console.log('📋 Created folders:');
    console.log(`   • ${CLOUDINARY_FOLDERS.USER_UPLOADS}`);
    console.log(`   • ${CLOUDINARY_FOLDERS.SAREE_IMAGES}`);
    console.log(`   • ${CLOUDINARY_FOLDERS.SAREE_MASKS}`);
    console.log(`   • ${CLOUDINARY_FOLDERS.SAREE_OVERLAYS}`);
    console.log(`   • ${CLOUDINARY_FOLDERS.TRYON_OUTPUTS}`);

    console.log('\n💡 Next steps:');
    console.log('   1. Upload saree images to: saree-tryon/saree-assets/images/{sku}/{variant}/');
    console.log('   2. Upload saree masks to: saree-tryon/saree-assets/masks/{sku}/{variant}/');
    console.log('   3. Upload overlays to: saree-tryon/saree-assets/overlays/{sku}/{variant}/');
    console.log('   4. Test with API endpoint: POST /api/tryon/generate');

    process.exit(0);
  } catch (error) {
    console.error('❌ Setup failed:', error);
    process.exit(1);
  }
}

/**
 * Validate Cloudinary configuration
 */
async function validateCloudinaryConfig() {
  console.log('🔍 Validating Cloudinary configuration...\n');

  const requiredEnvVars = [
    'NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME',
    'CLOUDINARY_API_KEY',
    'CLOUDINARY_API_SECRET',
  ];

  const missing = requiredEnvVars.filter(envVar => !process.env[envVar]);

  if (missing.length > 0) {
    console.error('❌ Missing environment variables:');
    missing.forEach(env => console.error(`   • ${env}`));
    console.error('\n📝 Add these to your .env.local file');
    process.exit(1);
  }

  console.log('✓ Cloud Name:', process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME);
  console.log('✓ API Key:', process.env.CLOUDINARY_API_KEY?.substring(0, 5) + '...');
  console.log('✓ API Secret: ✓ Configured\n');
}

/**
 * Upload sample images for testing
 */
async function uploadSampleImages() {
  console.log('📤 Would you like to upload sample images? (y/n)\n');
  
  // In production, implement interactive prompt or skip this
  console.log('💡 To upload images, use Cloudinary web dashboard or CLI:');
  console.log('   cld uploader upload image.jpg --folder saree-tryon/saree-assets/images/SAREE-001/default');
}

/**
 * Main setup function
 */
async function main() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║  AI Saree Try-On: Cloudinary Setup                     ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  // Step 1: Validate configuration
  await validateCloudinaryConfig();

  // Step 2: Setup folder structure
  await setupCloudinaryFolders();

  // Step 3: Provide upload instructions
  await uploadSampleImages();
}

// Run setup
main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
