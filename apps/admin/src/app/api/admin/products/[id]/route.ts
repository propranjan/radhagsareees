import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/products/[id]
 * 
 * Get a single product with all details
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        variants: {
          include: {
            inventory: { select: { qtyAvailable: true, lowStockThreshold: true } },
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      ...product,
      variants: product.variants.map((v) => ({
        ...v,
        mrp: Number(v.mrp),
        price: Number(v.price),
      })),
    });
  } catch (error) {
    console.error('[Admin Product Detail] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/products/[id]
 * 
 * Update product status or details
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await request.json();

    // Build update data
    const updateData: any = {};
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isNew !== undefined) updateData.isNew = body.isNew;
    if (body.isFeatured !== undefined) updateData.isFeatured = body.isFeatured;
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) updateData.slug = body.slug;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.care !== undefined) updateData.care = body.care;
    if (body.images !== undefined) updateData.images = body.images;
    if (body.categoryId !== undefined) updateData.categoryId = body.categoryId;

    const product = await prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        category: { select: { id: true, name: true, slug: true } },
      },
    });

    return NextResponse.json({
      success: true,
      product,
    });
  } catch (error) {
    console.error('[Admin Product Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/products/[id]
 * 
 * Full product update including variants
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;
    const body = await request.json();
    const { product: productData, variants } = body;

    // Update product and variants in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update product
      const updatedProduct = await tx.product.update({
        where: { id },
        data: {
          title: productData.title,
          slug: productData.slug,
          description: productData.description,
          care: productData.care,
          images: productData.images,
          categoryId: productData.categoryId,
          isActive: productData.isActive,
          isNew: productData.isNew,
          isFeatured: productData.isFeatured,
        },
      });

      // Get existing variants
      const existingVariants = await tx.variant.findMany({
        where: { productId: id },
        select: { id: true, sku: true },
      });

      // Update or create variants
      for (const variant of variants) {
        const existingVariant = existingVariants.find((v) => v.sku === variant.sku);

        if (existingVariant) {
          // Update existing variant
          await tx.variant.update({
            where: { id: existingVariant.id },
            data: {
              color: variant.color,
              size: variant.size,
              mrp: variant.mrp,
              price: variant.price,
            },
          });

          // Update inventory
          await tx.inventory.update({
            where: { variantId: existingVariant.id },
            data: {
              qtyAvailable: variant.inventory.qtyAvailable,
              lowStockThreshold: variant.inventory.lowStockThreshold,
            },
          });
        } else {
          // Create new variant with inventory
          await tx.variant.create({
            data: {
              productId: id,
              sku: variant.sku,
              color: variant.color,
              size: variant.size,
              mrp: variant.mrp,
              price: variant.price,
              inventory: {
                create: {
                  qtyAvailable: variant.inventory.qtyAvailable,
                  lowStockThreshold: variant.inventory.lowStockThreshold,
                },
              },
            },
          });
        }
      }

      return updatedProduct;
    });

    return NextResponse.json({
      success: true,
      id: result.id,
    });
  } catch (error) {
    console.error('[Admin Product Full Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/products/[id]
 * 
 * Delete a product and its variants
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
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

    const { id } = await params;

    // Check if product has any orders
    const ordersCount = await prisma.orderItem.count({
      where: { productId: id },
    });

    if (ordersCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete product with existing orders. Deactivate it instead.' },
        { status: 400 }
      );
    }

    // Delete product (cascade will delete variants and inventory)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('[Admin Product Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
