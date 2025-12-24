import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

/**
 * API route to serve local saree images
 * GET /api/images/saree/[filename]
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { filename: string } }
) {
  try {
    const filename = params.filename;

    // Security: Validate filename to prevent directory traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return NextResponse.json(
        { error: 'Invalid filename' },
        { status: 400 }
      );
    }

    // Construct the file path
    const imagePath = path.join(
      process.cwd(),
      '..',
      '..',
      'Pictures',
      'Saree',
      filename
    );

    // Check if file exists
    if (!fs.existsSync(imagePath)) {
      // Return a placeholder image or 404
      return NextResponse.json(
        { error: 'Image not found' },
        { status: 404 }
      );
    }

    // Read the file
    const imageBuffer = fs.readFileSync(imagePath);

    // Determine content type based on file extension
    const ext = path.extname(filename).toLowerCase();
    let contentType = 'image/jpeg';

    if (ext === '.webp') contentType = 'image/webp';
    else if (ext === '.png') contentType = 'image/png';
    else if (ext === '.gif') contentType = 'image/gif';
    else if (ext === '.jpg' || ext === '.jpeg') contentType = 'image/jpeg';

    // Return image with proper headers for caching
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, immutable',
        'Content-Length': imageBuffer.length.toString(),
      },
    });
  } catch (error) {
    console.error('Error serving image:', error);
    return NextResponse.json(
      { error: 'Failed to load image' },
      { status: 500 }
    );
  }
}
