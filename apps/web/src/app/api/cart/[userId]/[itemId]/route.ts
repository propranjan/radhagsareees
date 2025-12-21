import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * Update Cart Item API
 * Updates quantity of a specific cart item
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
) {
  try {
    const { itemId } = params;
    const body = await request.json();
    const { quantity } = body;

    if (!quantity || quantity < 1) {
      return NextResponse.json(
        { error: 'Valid quantity is required' },
        { status: 400 }
      );
    }

    const cartItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: {
        quantity,
        updatedAt: new Date(),
      },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            color: true,
            size: true,
            price: true,
            mrp: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      item: cartItem,
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      { error: 'Failed to update cart item' },
      { status: 500 }
    );
  }
}

/**
 * Delete Cart Item API
 * Removes a specific item from cart
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: { userId: string; itemId: string } }
) {
  try {
    const { itemId } = params;

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error deleting cart item:', error);
    return NextResponse.json(
      { error: 'Failed to delete cart item' },
      { status: 500 }
    );
  }
}
