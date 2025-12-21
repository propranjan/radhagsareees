import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * GET /api/admin/locations
 * List all inventory locations
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const where = search
      ? {
          OR: [
            { name: { contains: search, mode: 'insensitive' as const } },
            { city: { contains: search, mode: 'insensitive' as const } },
          ],
        }
      : {};

    const locations = await prisma.inventoryLocation.findMany({
      where,
      include: {
        _count: {
          select: { inventory: true },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formattedLocations = locations.map((location) => ({
      id: location.id,
      name: location.name,
      city: location.city,
      address: location.address,
      phone: location.phone,
      isActive: location.isActive,
      inventoryCount: location._count.inventory,
      createdAt: location.createdAt.toISOString(),
      updatedAt: location.updatedAt.toISOString(),
    }));

    return NextResponse.json({ locations: formattedLocations });
  } catch (error) {
    console.error('Failed to fetch locations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch locations' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/locations
 * Create a new inventory location
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, city, address, phone, isActive = true } = body;

    if (!name || !city || !address) {
      return NextResponse.json(
        { error: 'Name, city, and address are required' },
        { status: 400 }
      );
    }

    // Check for duplicate name
    const existing = await prisma.inventoryLocation.findUnique({
      where: { name },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'A location with this name already exists' },
        { status: 409 }
      );
    }

    const location = await prisma.inventoryLocation.create({
      data: {
        name,
        city,
        address,
        phone: phone || null,
        isActive,
      },
    });

    return NextResponse.json(
      {
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
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Failed to create location:', error);
    return NextResponse.json(
      { error: 'Failed to create location' },
      { status: 500 }
    );
  }
}
