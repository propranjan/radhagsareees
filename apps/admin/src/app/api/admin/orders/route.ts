import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/orders
 * 
 * Get all orders with filtering and pagination
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
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { user: { email: { contains: search, mode: 'insensitive' } } },
        { user: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get orders with pagination
    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
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
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              status: true,
              awbCode: true,
              courierName: true,
              trackingUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    // Transform orders
    const transformedOrders = orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      totalAmount: Number(order.amount),
      tax: Number(order.tax),
      shipping: Number(order.shipping),
      discount: Number(order.discount),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      customerName: order.user.name || order.user.email.split('@')[0],
      customerEmail: order.user.email,
      itemCount: order.orderItems.length,
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
      } : null,
      shippingAddress: order.shippingAddress ? {
        name: order.shippingAddress.name,
        street: order.shippingAddress.street,
        city: order.shippingAddress.city,
        state: order.shippingAddress.state,
        zipCode: order.shippingAddress.zipCode,
        phone: order.shippingAddress.phone,
      } : null,
      fulfillment: order.fulfillments[0] ? {
        id: order.fulfillments[0].id,
        status: order.fulfillments[0].status,
        awbCode: order.fulfillments[0].awbCode,
        courierName: order.fulfillments[0].courierName,
        trackingUrl: order.fulfillments[0].trackingUrl,
      } : null,
    }));

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Orders] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/orders
 * 
 * Update order status
 */
export async function PATCH(request: NextRequest) {
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
    const { orderId, status, notes } = body;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update order
    const updateData: any = { status };
    if (notes) {
      updateData.notes = notes;
    }

    const order = await prisma.order.update({
      where: { id: orderId },
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
    console.error('[Admin Orders Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    );
  }
}
