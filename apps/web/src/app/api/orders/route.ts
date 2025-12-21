import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * GET /api/orders
 * 
 * Get all orders for a user
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const orders = await prisma.order.findMany({
      where: { userId },
      include: {
        orderItems: {
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
                color: true,
                size: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Format the response
    const formattedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      amount: order.amount,
      tax: order.tax,
      shipping: order.shipping,
      createdAt: order.createdAt.toISOString(),
      itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
      items: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
        variant: item.variant,
      })),
    }));

    return NextResponse.json({ orders: formattedOrders });

  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}
