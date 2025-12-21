import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/stats
 * 
 * Get dashboard statistics
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

    // Get stats in parallel
    const [
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCustomers,
      lowStockCount,
      revenueResult,
    ] = await Promise.all([
      // Total orders
      prisma.order.count(),
      
      // Pending orders
      prisma.order.count({
        where: { status: { in: ['PENDING', 'PROCESSING'] } },
      }),
      
      // Total products
      prisma.product.count({ where: { isActive: true } }),
      
      // Total customers
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      
      // Low stock products (quantity <= 5)
      prisma.inventory.count({
        where: {
          qtyAvailable: { lte: 5 },
        },
      }),
      
      // Total revenue (sum of delivered orders)
      prisma.order.aggregate({
        _sum: { amount: true },
        where: { status: 'DELIVERED' },
      }),
    ]);

    return NextResponse.json({
      totalOrders,
      pendingOrders,
      totalProducts,
      totalCustomers,
      lowStockProducts: lowStockCount,
      totalRevenue: Number(revenueResult._sum.amount || 0),
    });
  } catch (error) {
    console.error('[Admin Stats] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
