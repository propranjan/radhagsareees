import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/payments
 * 
 * Get all payments with order details
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
    const status = searchParams.get('status');
    const method = searchParams.get('method');
    const limit = parseInt(searchParams.get('limit') || '50');
    const page = parseInt(searchParams.get('page') || '1');

    // Build where clause
    const where: any = {};
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    if (method && method !== 'all') {
      where.method = method.toUpperCase();
    }

    // Get payments with order details
    const [payments, total] = await Promise.all([
      prisma.payment.findMany({
        where,
        include: {
          order: {
            include: {
              user: { select: { name: true, email: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payment.count({ where }),
    ]);

    // Get summary stats
    const [completedSum, pendingSum, failedCount] = await Promise.all([
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'COMPLETED' },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { status: 'PENDING' },
      }),
      prisma.payment.count({ where: { status: 'FAILED' } }),
    ]);

    // Transform data
    const transformedPayments = payments.map((payment) => ({
      id: payment.id,
      orderId: payment.orderId,
      orderNumber: payment.order.orderNumber,
      customerName: payment.order.user.name || payment.order.user.email.split('@')[0],
      customerEmail: payment.order.user.email,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      transactionId: payment.transactionId,
      createdAt: payment.createdAt.toISOString(),
      updatedAt: payment.updatedAt.toISOString(),
    }));

    return NextResponse.json({
      payments: transformedPayments,
      summary: {
        totalCompleted: Number(completedSum._sum.amount || 0),
        totalPending: Number(pendingSum._sum.amount || 0),
        failedCount,
      },
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Payments] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch payments' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/payments
 * 
 * Update payment status (for manual verification)
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
    const { paymentId, status, transactionId } = body;

    if (!paymentId || !status) {
      return NextResponse.json(
        { error: 'Payment ID and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['PENDING', 'COMPLETED', 'FAILED', 'REFUNDED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status' },
        { status: 400 }
      );
    }

    // Update payment
    const updateData: any = { status };
    if (transactionId) {
      updateData.transactionId = transactionId;
    }

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: updateData,
      include: {
        order: { select: { orderNumber: true } },
      },
    });

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        orderNumber: payment.order.orderNumber,
        status: payment.status,
        transactionId: payment.transactionId,
      },
    });
  } catch (error) {
    console.error('[Admin Payments Update] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update payment' },
      { status: 500 }
    );
  }
}
