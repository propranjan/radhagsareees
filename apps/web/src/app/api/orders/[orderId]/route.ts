import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * GET /api/orders/[orderId]
 * 
 * Get order details by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                title: true,
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
        shippingAddress: {
          select: {
            id: true,
            name: true,
            street: true,
            city: true,
            state: true,
            zipCode: true,
            phone: true,
          },
        },
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            id: true,
            method: true,
            status: true,
            amount: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format the response
    const formattedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      amount: order.amount,
      tax: order.tax,
      shipping: order.shipping,
      createdAt: order.createdAt.toISOString(),
      items: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: item.price,
        product: item.product,
        variant: item.variant,
      })),
      shippingAddress: order.shippingAddress,
      payment: order.payments[0] || null,
    };

    return NextResponse.json({ order: formattedOrder });

  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}
