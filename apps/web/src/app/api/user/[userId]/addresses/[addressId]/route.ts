import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * Delete Address API
 * Deletes an address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; addressId: string } }
) {
  try {
    const { addressId } = params;

    await prisma.address.delete({
      where: { id: addressId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting address:', error);
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    );
  }
}

/**
 * Update Address API
 * Updates an address
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; addressId: string } }
) {
  try {
    const { addressId } = params;
    const body = await request.json();
    const { name, type, street, city, state, zipCode, country, phone, isDefault } = body;

    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        name: name || undefined,
        type: type || undefined,
        street: street || undefined,
        city: city || undefined,
        state: state || undefined,
        zipCode: zipCode || undefined,
        country: country || undefined,
        phone: phone !== undefined ? phone : undefined,
        isDefault: isDefault !== undefined ? isDefault : undefined,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json(address);
  } catch (error) {
    console.error('Error updating address:', error);
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    );
  }
}
