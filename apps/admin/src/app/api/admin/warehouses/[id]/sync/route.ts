import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';
import { syncWarehouseWithShiprocket } from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/warehouses/[id]/sync
 * 
 * Sync warehouse with Shiprocket pickup location
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
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

    // Check if warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    if (!warehouse) {
      return NextResponse.json(
        { error: 'Warehouse not found' },
        { status: 404 }
      );
    }

    if (warehouse.shiprocketPickupId) {
      return NextResponse.json(
        { error: 'Warehouse is already synced with Shiprocket' },
        { status: 400 }
      );
    }

    // Sync with Shiprocket
    await syncWarehouseWithShiprocket(id);

    // Get updated warehouse
    const updatedWarehouse = await prisma.warehouse.findUnique({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      warehouse: updatedWarehouse,
      message: 'Warehouse synced with Shiprocket successfully',
    });
  } catch (error: any) {
    console.error('[Admin Warehouse Sync] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to sync warehouse with Shiprocket' },
      { status: 500 }
    );
  }
}
