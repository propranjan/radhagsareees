#!/usr/bin/env node

/**
 * Inspect Cloudinary folder structure for radhag-sarees
 * Run: node scripts/inspect-cloudinary-structure.mjs
 */

import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config({ path: './apps/web/.env' });

// Initialize Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

async function inspectFolderStructure() {
  try {
    console.log('🔍 Inspecting Cloudinary folder structure...\n');

    // Get all resources in radhag-sarees folder
    console.log('📁 Fetching resources from radhag-sarees folder...');
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'radhag-sarees',
      max_results: 500,
    });

    console.log(`\n✅ Found ${result.resources.length} resources\n`);
    console.log('📋 FOLDER STRUCTURE:\n');

    // Group by public_id path
    const folderMap = new Map();

    result.resources.forEach((resource) => {
      const publicId = resource.public_id;
      const parts = publicId.split('/');
      const folder = parts.slice(0, -1).join('/') || 'root';
      
      if (!folderMap.has(folder)) {
        folderMap.set(folder, []);
      }
      folderMap.get(folder).push({
        name: parts[parts.length - 1],
        type: resource.type,
        publicId: publicId,
        format: resource.format,
        url: resource.secure_url,
      });
    });

    // Display structure
    Array.from(folderMap.entries())
      .sort()
      .forEach(([folder, files]) => {
        const displayFolder = folder === 'root' ? 'radhag-sarees/' : `radhag-sarees/${folder}/`;
        console.log(`\n📂 ${displayFolder}`);
        files.forEach((file) => {
          console.log(`   ├─ ${file.name} (${file.format})`);
          console.log(`   │  └─ public_id: ${file.publicId}`);
        });
      });

    console.log('\n\n📊 SUMMARY:');
    console.log(`Total resources: ${result.resources.length}`);
    console.log(`Total folders: ${folderMap.size}`);
    
    // Suggest paths based on structure
    console.log('\n\n💡 SUGGESTED PATHS:');
    const samples = Array.from(folderMap.entries())
      .filter(([folder]) => folder.includes('saree') || folder === 'root')
      .slice(0, 5);
    
    samples.forEach(([folder, files]) => {
      if (files.length > 0) {
        const sample = files[0];
        console.log(`\n  Path: ${sample.publicId}`);
        console.log(`  URL: https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_1000,c_fill/${sample.publicId}.${sample.format}`);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.message.includes('Not Authenticated')) {
      console.error('\n⚠️  Authentication failed. Check your Cloudinary credentials in .env');
    }
  }
}

inspectFolderStructure();
