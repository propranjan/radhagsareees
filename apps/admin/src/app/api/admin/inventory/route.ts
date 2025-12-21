import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/inventory
 * 
 * Get inventory with product/variant details
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
    const filter = searchParams.get('filter'); // 'low-stock', 'out-of-stock', 'all'
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (filter === 'low-stock') {
      where.qtyAvailable = { gt: 0, lte: 5 };
    } else if (filter === 'out-of-stock') {
      where.qtyAvailable = 0;
    }

    // Get inventory with related data
    const inventory = await prisma.inventory.findMany({
      where,
      include: {
        variant: {
          include: {
            product: {
              select: { id: true, title: true, slug: true, images: true },
            },
          },
        },
        location: {
          select: { id: true, name: true, city: true },
        },
      },
      orderBy: { qtyAvailable: 'asc' },
    });

    // Filter by search if provided
    let filteredInventory = inventory;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredInventory = inventory.filter((item) =>
        item.variant.product.title.toLowerCase().includes(searchLower) ||
        item.variant.sku.toLowerCase().includes(searchLower) ||
        item.variant.color?.toLowerCase().includes(searchLower)
      );
    }

    // Transform data
    const items = filteredInventory.map((item) => ({
      id: item.id,
      variantId: item.variantId,
      sku: item.variant.sku,
      qtyAvailable: item.qtyAvailable,
      reservedQty: item.reservedQty,
      lowStockThreshold: item.lowStockThreshold,
      isLowStock: item.qtyAvailable <= item.lowStockThreshold && item.qtyAvailable > 0,
      isOutOfStock: item.qtyAvailable === 0,
      product: {
        id: item.variant.product.id,
        title: item.variant.product.title,
        slug: item.variant.product.slug,
        image: item.variant.product.images[0] || null,
      },
      variant: {
        color: item.variant.color,
        size: item.variant.size,
        price: item.variant.price,
      },
      location: item.location ? {
        id: item.location.id,
        name: item.location.name,
        city: item.location.city,
      } : null,
      updatedAt: item.updatedAt.toISOString(),
    }));

    // Get summary counts
    const totalItems = inventory.length;
    const lowStockCount = inventory.filter(
      (i) => i.qtyAvailable <= i.lowStockThreshold && i.qtyAvailable > 0
    ).length;
    const outOfStockCount = inventory.filter((i) => i.qtyAvailable === 0).length;

    return NextResponse.json({
      items,
      summary: {
        total: totalItems,
        lowStock: lowStockCount,
        outOfStock: outOfStockCount,
        inStock: totalItems - lowStockCount - outOfStockCount,
      },
    });
  } catch (error) {
    console.error('[Admin Inventory] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch inventory' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/inventory
 * 
 * Update inventory quantities
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
    const { inventoryId, qtyAvailable, lowStockThreshold, locationId } = body;

    if (!inventoryId) {
      return NextResponse.json(
        { error: 'Inventory ID is required' },
        { status: 400 }
      );
    }

    // Build update data
    const updateData: any = {};
    if (typeof qtyAvailable === 'number') {
      if (qtyAvailable < 0) {
        return NextResponse.json(
          { error: 'Quantity cannot be negative' },
          { status: 400 }
        );
      }
      updateData.qtyAvailable = qtyAvailable;
    }
    if (typeof lowStockThreshold === 'number') {
      if (lowStockThreshold < 0) {
        return NextResponse.json(
          { error: 'Threshold cannot be negative' },
          { status: 400 }
        );
      }
      updateData.lowStockThreshold = lowStockThreshold;
    }
    if (locationId !== undefined) {
      updateData.locationId = locationId || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    // Update inventory
    const inventory = await prisma.inventory.update({
      where: { id: inventoryId },
      data: updateData,
      include: {
        variant: {
          select: { sku: true, product: { select: { title: true } } },
        },
      },
    });

    return NextResponse.json({
      success: true,
      inventory: {
        id: inventory.id,
        sku: inventory.variant.sku,
        productTitle: inventory.variant.product.title,
        qtyAvailable: inventory.qtyAvailable,
        lowStockThreshold: inventory.lowStockThreshold,
      },
    });
  } catch (error) {
    console.error('[Admin Inventory Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/inventory
 * 
 * Bulk update inventory
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
    const { updates } = body;

    if (!Array.isArray(updates) || updates.length === 0) {
      return NextResponse.json(
        { error: 'Updates array is required' },
        { status: 400 }
      );
    }

    // Validate all updates
    for (const update of updates) {
      if (!update.inventoryId) {
        return NextResponse.json(
          { error: 'Each update must have an inventoryId' },
          { status: 400 }
        );
      }
      if (typeof update.qtyAvailable === 'number' && update.qtyAvailable < 0) {
        return NextResponse.json(
          { error: 'Quantity cannot be negative' },
          { status: 400 }
        );
      }
    }

    // Perform bulk update in transaction
    const results = await prisma.$transaction(
      updates.map((update: any) => {
        const data: any = {};
        if (typeof update.qtyAvailable === 'number') {
          data.qtyAvailable = update.qtyAvailable;
        }
        if (typeof update.lowStockThreshold === 'number') {
          data.lowStockThreshold = update.lowStockThreshold;
        }
        return prisma.inventory.update({
          where: { id: update.inventoryId },
          data,
        });
      })
    );

    return NextResponse.json({
      success: true,
      updated: results.length,
    });
  } catch (error) {
    console.error('[Admin Inventory Bulk Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update inventory' },
      { status: 500 }
    );
  }
}
