import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/orders/[id]
 * 
 * Get order details including fulfillments
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

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        orderItems: {
          include: {
            product: { select: { title: true, images: true } },
            variant: { select: { sku: true, color: true, size: true } },
          },
        },
        payments: true,
        shippingAddress: true,
        fulfillments: {
          include: {
            warehouse: {
              select: { id: true, name: true, city: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Transform order
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.amount),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      discount: Number(order.discount),
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerName: order.user.name || order.user.email.split('@')[0],
      customerEmail: order.user.email,
      customerId: order.user.id,
      items: order.orderItems.map((item) => ({
        id: item.id,
        quantity: item.quantity,
        price: Number(item.price),
        total: Number(item.total),
        productTitle: item.product.title,
        productImage: item.product.images[0],
        variantSku: item.variant?.sku,
        variantColor: item.variant?.color,
        variantSize: item.variant?.size,
      })),
      payment: order.payments[0] ? {
        id: order.payments[0].id,
        method: order.payments[0].method,
        status: order.payments[0].status,
        amount: Number(order.payments[0].amount),
        transactionId: order.payments[0].transactionId,
      } : null,
      shippingAddress: order.shippingAddress ? {
        name: order.shippingAddress.name,
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        country: order.shippingAddress.country,
        phone: order.shippingAddress.phone,
      } : null,
      fulfillments: order.fulfillments.map((f) => ({
        id: f.id,
        awbCode: f.awbCode,
        courierName: f.courierName,
        status: f.status,
        trackingUrl: f.trackingUrl,
        labelUrl: f.labelUrl,
        pickupScheduledDate: f.pickupScheduledDate?.toISOString(),
        pickedUpAt: f.pickedUpAt?.toISOString(),
        deliveredAt: f.deliveredAt?.toISOString(),
        estimatedDelivery: f.estimatedDelivery?.toISOString(),
        currentLocation: f.currentLocation,
        warehouse: f.warehouse ? {
          id: f.warehouse.id,
          name: f.warehouse.name,
          city: f.warehouse.city,
        } : null,
      })),
    };

    return NextResponse.json({ order: transformedOrder });
  } catch (error) {
    console.error('[Admin Order Detail] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch order' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders/[id]
 * 
 * Update order status or details
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
    const { status, notes } = body;

    // Validate status if provided
    if (status) {
      const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
      if (!validStatuses.includes(status)) {
        return NextResponse.json(
          { error: 'Invalid status' },
          { status: 400 }
        );
      }
    }

    // Build update data
    const updateData: any = {};
    if (status) updateData.status = status;
    if (notes !== undefined) updateData.notes = notes;

    const order = await prisma.order.update({
      where: { id },
      data: updateData,
      include: {
        user: { select: { name: true, email: true } },
      },
    });

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        status: order.status,
        notes: order.notes,
      },
    });
  } catch (error) {
    console.error('[Admin Order Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
