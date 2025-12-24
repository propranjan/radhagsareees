import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * GET /api/products/[slug]
 * Get product details by slug
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const { slug } = params;

    if (!slug) {
      return NextResponse.json(
        { error: 'Product slug is required' },
        { status: 400 }
      );
    }

    // Fetch product with all related data
    const product = await prisma.product.findUnique({
      where: {
        slug: slug,
        isActive: true, // Only return active products
      },
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          where: {
            isActive: true,
          },
          include: {
            inventory: {
              select: {
                qtyAvailable: true,
                lowStockThreshold: true,
              },
            },
          },
          orderBy: [
            { color: 'asc' },
            { size: 'asc' },
          ],
        },
        reviews: {
          where: {
            status: 'APPROVED',
          },
          select: {
            rating: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    // Calculate average rating and review count
    const ratings = product.reviews.map((r: any) => r.rating);
    const averageRating = ratings.length > 0 
      ? ratings.reduce((sum: number, rating: number) => sum + rating, 0) / ratings.length 
      : null;
    
    const totalReviews = ratings.length;

    // Extract product SKU from first variant SKU (e.g., 'ban-001-blu' -> 'BAN-001')
    const firstVariantSku = product.variants[0]?.sku || '';
    const productSku = firstVariantSku
      .split('-')
      .slice(0, 2) // Take first two parts (e.g., 'ban', '001')
      .join('-')
      .toUpperCase();

    // Transform the response
    const responseData = {
      id: product.id,
      sku: productSku, // Derived product SKU for try-on
      title: product.title,
      slug: product.slug,
      description: product.description,
      care: product.care,
      images: product.images,
      categoryId: product.categoryId,
      category: product.category,
      isActive: product.isActive,
      isNew: product.isNew,
      isFeatured: product.isFeatured,
      variants: product.variants.map((variant: any) => ({
        id: variant.id,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        mrp: variant.mrp,
        price: variant.price,
        overlayPng: variant.overlayPng, // Try-on overlay image
        inventory: variant.inventory,
      })),
      averageRating,
      totalReviews,
      createdAt: product.createdAt.toISOString(),
      updatedAt: product.updatedAt.toISOString(),
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}