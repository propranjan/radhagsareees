import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/locations/[id]
 * Get a single inventory location
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const location = await prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    });

    if (!location) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        city: location.city,
        address: location.address,
        phone: location.phone,
        isActive: location.isActive,
        inventoryCount: location._count.inventory,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to fetch location:', error);
    return NextResponse.json(
      { error: 'Failed to fetch location' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/admin/locations/[id]
 * Update an inventory location
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, city, address, phone, isActive } = body;

    // Check if location exists
    const existing = await prisma.inventoryLocation.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Check for duplicate name (excluding current)
    if (name && name !== existing.name) {
      const duplicate = await prisma.inventoryLocation.findUnique({
        where: { name },
      });

      if (duplicate) {
        return NextResponse.json(
          { error: 'A location with this name already exists' },
          { status: 409 }
        );
      }
    }

    const location = await prisma.inventoryLocation.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(city !== undefined && { city }),
        ...(address !== undefined && { address }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({
      location: {
        id: location.id,
        name: location.name,
        city: location.city,
        address: location.address,
        phone: location.phone,
        isActive: location.isActive,
        createdAt: location.createdAt.toISOString(),
        updatedAt: location.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to update location:', error);
    return NextResponse.json(
      { error: 'Failed to update location' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/locations/[id]
 * Delete an inventory location
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    // Check if location exists
    const existing = await prisma.inventoryLocation.findUnique({
      where: { id },
      include: {
        _count: {
          select: { inventory: true },
        },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'Location not found' },
        { status: 404 }
      );
    }

    // Prevent deletion if inventory items are assigned
    if (existing._count.inventory > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete location with assigned inventory items',
          inventoryCount: existing._count.inventory,
        },
        { status: 400 }
      );
    }

    await prisma.inventoryLocation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete location:', error);
    return NextResponse.json(
      { error: 'Failed to delete location' },
      { status: 500 }
    );
  }
}
