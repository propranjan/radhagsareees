/**
 * Debug endpoint to inspect Cloudinary folder structure
 * Access at: /api/debug/cloudinary-structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

export async function GET(request: NextRequest) {
  try {
    // Initialize cloudinary
    cloudinary.config({
      cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });

    console.log('🔍 Fetching Cloudinary resources from radhag-sarees...');

    // Get all resources in radhag-sarees folder
    const result = await cloudinary.api.resources({
      type: 'upload',
      prefix: 'radhag-sarees',
      max_results: 500,
    });

    console.log(`✅ Found ${result.resources.length} resources`);

    // Group by folder structure
    const folderMap = new Map<string, any[]>();

    result.resources.forEach((resource: any) => {
      const publicId = resource.public_id;
      const parts = publicId.split('/');
      const folder = parts.slice(0, -1).join('/') || 'root';
      
      if (!folderMap.has(folder)) {
        folderMap.set(folder, []);
      }
      folderMap.get(folder)!.push({
        name: parts[parts.length - 1],
        publicId: publicId,
        format: resource.format,
        type: resource.type,
      });
    });

    // Convert to array and sort
    const structure = Array.from(folderMap.entries())
      .sort()
      .map(([folder, files]) => ({
        folder: folder === 'root' ? 'radhag-sarees/' : `radhag-sarees/${folder}/`,
        count: files.length,
        files: files.map(f => ({
          name: f.name,
          publicId: f.publicId,
          format: f.format,
          suggested_url: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/w_800,h_1000,c_fill/${f.publicId}.${f.format}`,
        })),
      }));

    return NextResponse.json({
      success: true,
      total_resources: result.resources.length,
      total_folders: structure.length,
      structure,
      raw_public_ids: result.resources.map((r: any) => r.public_id).slice(0, 20),
    });
  } catch (error) {
    console.error('❌ Error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Check Cloudinary credentials in .env'
      },
      { status: 500 }
    );
  }
}
