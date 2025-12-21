import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * Create Address API
 * Creates a new address for a user
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;
    const body = await request.json();
    const { name, type, street, city, state, zipCode, country, phone } = body;

    if (!street || !city || !zipCode) {
      return NextResponse.json(
        { error: 'Street, city, and zip code are required' },
        { status: 400 }
      );
    }

    const address = await prisma.address.create({
      data: {
        userId,
        name: name || 'Address',
        type: type || 'HOME',
        street,
        city,
        state: state || '',
        zipCode,
        country: country || 'India',
        phone: phone || null,
        isDefault: false,
      },
    });

    return NextResponse.json({ success: true, address });
  } catch (error) {
    console.error('Error creating address:', error);
    return NextResponse.json(
      { error: 'Failed to create address' },
      { status: 500 }
    );
  }
}

/**
 * Get Addresses API
 * Retrieves all addresses for a user
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string } }
) {
  try {
    const { userId } = params;

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return NextResponse.json(
      { error: 'Failed to fetch addresses' },
      { status: 500 }
    );
  }
}
