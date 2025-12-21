import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/variants
 * 
 * Get all variants with product details
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const search = searchParams.get('search');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build where clause
    const where: any = {};
    if (productId) {
      where.productId = productId;
    }
    if (search) {
      where.OR = [
        { color: { contains: search, mode: 'insensitive' } },
        { size: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { product: { title: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get variants with product details
    const [variants, total] = await Promise.all([
      prisma.variant.findMany({
        where,
        include: {
          product: { select: { id: true, title: true, slug: true } },
          inventory: { select: { qtyAvailable: true } },
        },
        orderBy: [
          { product: { title: 'asc' } },
          { color: 'asc' },
          { size: 'asc' },
        ],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.variant.count({ where }),
    ]);

    // Get products for dropdown
    const products = await prisma.product.findMany({
      select: { id: true, title: true },
      orderBy: { title: 'asc' },
    });

    // Transform data
    const transformedVariants = variants.map((variant) => ({
      id: variant.id,
      productId: variant.productId,
      productName: variant.product.title,
      productSlug: variant.product.slug,
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: Number(variant.price),
      mrp: Number(variant.mrp),
      stock: variant.inventory?.qtyAvailable || 0,
      createdAt: variant.createdAt.toISOString(),
    }));

    return NextResponse.json({
      variants: transformedVariants,
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Variants] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch variants' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/variants
 * 
 * Update a variant
 */
export async function PATCH(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { variantId, sku, color, size, price, mrp } = body;

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (sku !== undefined) updateData.sku = sku;
    if (color !== undefined) updateData.color = color;
    if (size !== undefined) updateData.size = size;
    if (price !== undefined) updateData.price = price;
    if (mrp !== undefined) updateData.mrp = mrp;

    // Validate price and MRP
    if (price !== undefined && price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
    }
    if (mrp !== undefined && mrp < 0) {
      return NextResponse.json({ error: 'MRP cannot be negative' }, { status: 400 });
    }
    if (price !== undefined && mrp !== undefined && price > mrp) {
      return NextResponse.json({ error: 'Price cannot exceed MRP' }, { status: 400 });
    }

    // Update variant
    const variant = await prisma.variant.update({
      where: { id: variantId },
      data: updateData,
      include: {
        product: { select: { title: true } },
      },
    });

    return NextResponse.json({
      success: true,
      variant: {
        id: variant.id,
        productName: variant.product.title,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: Number(variant.price),
        mrp: Number(variant.mrp),
      },
    });
  } catch (error) {
    console.error('[Admin Variants Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update variant' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/variants
 * 
 * Create a new variant
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { productId, sku, color, size, price, mrp, stock } = body;

    // Validate required fields
    if (!productId || !sku || !color || !size || price === undefined || mrp === undefined) {
      return NextResponse.json(
        { error: 'All fields are required: productId, sku, color, size, price, mrp' },
        { status: 400 }
      );
    }

    // Validate price and MRP
    if (price < 0) {
      return NextResponse.json({ error: 'Price cannot be negative' }, { status: 400 });
    }
    if (mrp < 0) {
      return NextResponse.json({ error: 'MRP cannot be negative' }, { status: 400 });
    }
    if (price > mrp) {
      return NextResponse.json({ error: 'Price cannot exceed MRP' }, { status: 400 });
    }

    // Check if SKU already exists
    const existingSku = await prisma.variant.findUnique({ where: { sku } });
    if (existingSku) {
      return NextResponse.json({ error: 'SKU already exists' }, { status: 400 });
    }

    // Create variant with inventory
    const variant = await prisma.variant.create({
      data: {
        productId,
        sku,
        color,
        size,
        price,
        mrp,
        inventory: {
          create: {
            qtyAvailable: stock || 0,
          },
        },
      },
      include: {
        product: { select: { title: true } },
        inventory: { select: { qtyAvailable: true } },
      },
    });

    return NextResponse.json({
      success: true,
      variant: {
        id: variant.id,
        productName: variant.product.title,
        sku: variant.sku,
        color: variant.color,
        size: variant.size,
        price: Number(variant.price),
        mrp: Number(variant.mrp),
        stock: variant.inventory?.qtyAvailable || 0,
      },
    });
  } catch (error) {
    console.error('[Admin Variants Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create variant' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/variants
 * 
 * Delete a variant
 */
export async function DELETE(request: NextRequest) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { variantId } = body;

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Delete inventory first (if exists)
    await prisma.inventory.deleteMany({
      where: { variantId },
    });

    // Delete variant
    await prisma.variant.delete({
      where: { id: variantId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Admin Variants Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete variant' },
      { status: 500 }
    );
  }
}
