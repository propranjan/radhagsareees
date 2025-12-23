import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const category = searchParams.get('category');
    const categories = searchParams.get('categories'); // comma-separated slugs
    const featured = searchParams.get('featured');
    const limit = parseInt(searchParams.get('limit') || '100');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const minRating = searchParams.get('minRating');
    const sortBy = searchParams.get('sortBy') || 'newest';

    const where: any = {
      isActive: true,
    };

    // Single category filter (backwards compatible)
    if (category) {
      where.category = {
        slug: category,
      };
    }

    // Multiple categories filter
    if (categories) {
      const categoryList = categories.split(',').filter(Boolean);
      if (categoryList.length > 0) {
        where.category = {
          slug: { in: categoryList },
        };
      }
    }

    if (featured === 'true') {
      where.isFeatured = true;
    }

    // Rating filter
    if (minRating) {
      where.ratingAvg = {
        gte: parseFloat(minRating),
      };
    }

    // Determine sort order
    let orderBy: any = { createdAt: 'desc' };
    switch (sortBy) {
      case 'price-low':
        orderBy = { variants: { _min: { price: 'asc' } } };
        break;
      case 'price-high':
        orderBy = { variants: { _max: { price: 'desc' } } };
        break;
      case 'rating':
        orderBy = { ratingAvg: 'desc' };
        break;
      case 'newest':
      default:
        orderBy = { createdAt: 'desc' };
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
      orderBy,
    });

    // Transform data for frontend
    const transformedProducts = products.map((product) => {
      const variantPrices = product.variants.map((v: any) => v.price);
      const productMinPrice = variantPrices.length > 0 ? Math.min(...variantPrices) : 0;
      const productMaxPrice = variantPrices.length > 0 ? Math.max(...variantPrices) : 0;
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
        price: productMinPrice,
        originalPrice: productMaxPrice > productMinPrice ? productMaxPrice : undefined,
        image: typeof firstImage === 'string' 
          ? firstImage 
          : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=500',
        rating: product.ratingAvg || 0,
        reviewCount: product.ratingCount,
        category: product.category.name,
        categorySlug: product.category.slug,
        isNew: product.isNew,
        isSale: productMaxPrice > productMinPrice,
        inStock: totalStock > 0,
        stock: totalStock,
      };
    });

    // Apply price filtering (done after transform since we need min variant price)
    let filteredProducts = transformedProducts;
    
    if (minPrice) {
      const minPriceNum = parseFloat(minPrice);
      filteredProducts = filteredProducts.filter(p => p.price >= minPriceNum);
    }
    
    if (maxPrice) {
      const maxPriceNum = parseFloat(maxPrice);
      filteredProducts = filteredProducts.filter(p => p.price <= maxPriceNum);
    }

    // Apply client-side sorting for price (since DB sorting by variant is complex)
    if (sortBy === 'price-low') {
      filteredProducts = filteredProducts.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-high') {
      filteredProducts = filteredProducts.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'rating') {
      filteredProducts = filteredProducts.sort((a, b) => b.rating - a.rating);
    }

    return NextResponse.json({
      products: filteredProducts,
      total: filteredProducts.length,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
