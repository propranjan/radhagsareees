import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';
import { syncWarehouseWithShiprocket } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/warehouses/[id]
 * 
 * Get warehouse details
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

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        inventoryLocations: {
          include: {
            inventoryItems: {
              take: 5,
              include: {
                variant: {
                  include: {
                    product: { select: { title: true } },
                  },
                },
              },
            },
          },
        },
        fulfillments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            order: {
              select: { orderNumber: true, status: true },
            },
          },
        },
        _count: {
          select: { inventoryLocations: true, fulfillments: true },
        },
      },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ warehouse });
  } catch (error) {
    console.error('[Admin Warehouse Detail] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouse' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/warehouses/[id]
 * 
 * Update warehouse
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

    const {
      name,
      address,
      address2,
      city,
      state,
      country,
      pincode,
      phone,
      email,
      contactPerson,
      isActive,
    } = body;

    // Build update data
    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (address2 !== undefined) updateData.address2 = address2;
    if (city !== undefined) updateData.city = city;
    if (state !== undefined) updateData.state = state;
    if (country !== undefined) updateData.country = country;
    if (pincode !== undefined) updateData.pincode = pincode;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (contactPerson !== undefined) updateData.contactPerson = contactPerson;
    if (isActive !== undefined) updateData.isActive = isActive;

    const warehouse = await prisma.warehouse.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      success: true,
      warehouse,
    });
  } catch (error) {
    console.error('[Admin Warehouse Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update warehouse' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/warehouses/[id]
 * 
 * Delete warehouse (soft delete by deactivating)
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

    // Check if warehouse has active fulfillments
    const activeFulfillments = await prisma.fulfillment.count({
      where: {
        warehouseId: id,
        status: {
          notIn: ['DELIVERED', 'CANCELLED', 'RTO_DELIVERED'],
        },
      },
    });

    if (activeFulfillments > 0) {
      return NextResponse.json(
        { error: `Cannot delete warehouse with ${activeFulfillments} active shipments` },
        { status: 400 }
      );
    }

    // Soft delete by deactivating
    await prisma.warehouse.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({
      success: true,
      message: 'Warehouse deactivated successfully',
    });
  } catch (error) {
    console.error('[Admin Warehouse Delete] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete warehouse' },
      { status: 500 }
    );
  }
}
