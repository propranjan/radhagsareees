import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';
import {
  addPickupLocation,
  getPickupLocations,
  syncWarehouseWithShiprocket,
} from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/warehouses
 * 
 * Get all warehouses
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
    const activeOnly = searchParams.get('activeOnly') === 'true';

    const where: any = {};
    if (activeOnly) {
      where.isActive = true;
    }

    const warehouses = await prisma.warehouse.findMany({
      where,
      include: {
        _count: {
          select: { inventoryLocations: true, fulfillments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const transformedWarehouses = warehouses.map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code,
      address: w.address,
      address2: w.address2,
      city: w.city,
      state: w.state,
      country: w.country,
      pincode: w.pincode,
      phone: w.phone,
      email: w.email,
      contactPerson: w.contactPerson,
      isActive: w.isActive,
      shiprocketPickupId: w.shiprocketPickupId,
      pickupLocationCode: w.pickupLocationCode,
      inventoryLocationCount: w._count.inventoryLocations,
      fulfillmentCount: w._count.fulfillments,
      createdAt: w.createdAt.toISOString(),
      updatedAt: w.updatedAt.toISOString(),
    }));

    return NextResponse.json({ warehouses: transformedWarehouses });
  } catch (error) {
    console.error('[Admin Warehouses] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch warehouses' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/warehouses
 * 
 * Create a new warehouse
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
    const {
      name,
      code,
      address,
      address2,
      city,
      state,
      country = 'India',
      pincode,
      phone,
      email,
      contactPerson,
      syncWithShiprocket = true,
    } = body;

    // Validate required fields
    if (!name || !code || !address || !city || !state || !pincode || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, address, city, state, pincode, phone' },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingWarehouse = await prisma.warehouse.findUnique({
      where: { code },
    });

    if (existingWarehouse) {
      return NextResponse.json(
        { error: 'Warehouse with this code already exists' },
        { status: 400 }
      );
    }

    // Create warehouse
    const warehouse = await prisma.warehouse.create({
      data: {
        name,
        code,
        address,
        address2,
        city,
        state,
        country,
        pincode,
        phone,
        email,
        contactPerson,
        isActive: true,
      },
    });

    // Sync with Shiprocket if requested
    if (syncWithShiprocket) {
      try {
        await syncWarehouseWithShiprocket(warehouse.id);
        
        // Refresh warehouse data
        const updatedWarehouse = await prisma.warehouse.findUnique({
          where: { id: warehouse.id },
        });

        return NextResponse.json({
          success: true,
          warehouse: updatedWarehouse,
          shiprocketSynced: true,
        });
      } catch (error: any) {
        console.error('[Admin Warehouse] Shiprocket sync failed:', error);
        return NextResponse.json({
          success: true,
          warehouse,
          shiprocketSynced: false,
          shiprocketError: error.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      warehouse,
      shiprocketSynced: false,
    });
  } catch (error) {
    console.error('[Admin Warehouse Create] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create warehouse' },
      { status: 500 }
    );
  }
}
