import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '50');

    const where: any = {
      isActive: true,
    };

    if (category) {
      where.category = {
        slug: category,
      };
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        variants: {
          include: {
            inventory: {
              select: {
                qtyAvailable: true,
              },
            },
          },
        },
      },
      take: limit,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Transform data for frontend
    const transformedProducts = products.map((product) => {
      const minPrice = Math.min(...product.variants.map((v: any) => v.price));
      const maxPrice = Math.max(...product.variants.map((v: any) => v.price));
      const totalStock = product.variants.reduce(
        (sum: number, v: any) => sum + (v.inventory?.qtyAvailable || 0),
        0
      );

      // Parse images from JSON field
      const images = Array.isArray(product.images) ? product.images : [];
      const firstImage = images.length > 0 ? images[0] : null;

      return {
        id: product.id,
        name: product.title,
        slug: product.slug,
        description: product.description,
        price: minPrice,
        originalPrice: maxPrice > minPrice ? maxPrice : undefined,
        image: typeof firstImage === 'string' 
          ? firstImage 
          : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
        rating: product.ratingAvg || 0,
        reviewCount: product.ratingCount,
        category: product.category.name,
        isNew: product.isNew,
        isSale: maxPrice > minPrice,
        inStock: totalStock > 0,
        stock: totalStock,
      };
    });

    return NextResponse.json({
      products: transformedProducts,
      total: transformedProducts.length,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
