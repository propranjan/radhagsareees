import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyJWT } from '@/lib/auth-utils';
import { analyzeContentSafety } from '@/lib/nsfw-heuristic-analyzer';

/**
 * GET /api/admin/moderation/reviews
 * Fetch reviews for moderation with filtering and statistics
 */
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || authResult.payload?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'PENDING';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    // Build filter conditions
    let whereClause: any = {};
    
    switch (filter) {
      case 'PENDING':
        whereClause.status = 'PENDING';
        break;
      case 'HIGH_RISK':
        whereClause = {
          status: 'PENDING',
          riskScore: {
            gte: 0.7,
          },
        };
        break;
      case 'APPROVED':
        whereClause.status = 'APPROVED';
        break;
      case 'REJECTED':
        whereClause.status = 'REJECTED';
        break;
      // 'ALL' - no additional filter
    }

    // Fetch reviews with product and user information
    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        user: {
          select: {
            id: true,
            email: true,
          },
        },
        moderationHistory: {
          orderBy: {
            createdAt: 'desc',
          },
          select: {
            action: true,
            reason: true,
            createdAt: true,
            moderatorId: true,
          },
        },
      },
      orderBy: [
        { riskScore: 'desc' }, // High risk first
        { createdAt: 'asc' },  // Older reviews first
      ],
      skip: offset,
      take: limit,
    });

    // Calculate statistics
    const stats = await Promise.all([
      prisma.review.count({ where: { status: 'PENDING' } }),
      prisma.review.count({ where: { status: 'APPROVED' } }),
      prisma.review.count({ where: { status: 'REJECTED' } }),
      // Calculate average processing time for completed reviews
      prisma.review.aggregate({
        where: {
          status: { in: ['APPROVED', 'REJECTED'] },
          moderatedAt: { not: null },
        },
        _avg: {
          processingTimeHours: true,
        },
      }),
    ]);

    const [totalPending, totalApproved, totalRejected, avgProcessing] = stats;

    // Transform reviews for frontend
    const formattedReviews = reviews.map((review) => ({
      id: review.id,
      productId: review.product.id,
      productName: review.product.name,
      rating: review.rating,
      title: review.title,
      comment: review.comment,
      imageUrls: review.imageUrls || [],
      userEmail: review.user.email,
      userId: review.user.id,
      status: review.status,
      riskScore: review.riskScore,
      moderationFlags: review.moderationFlags || [],
      createdAt: review.createdAt.toISOString(),
      moderationHistory: review.moderationHistory.map((entry) => ({
        action: entry.action,
        reason: entry.reason,
        timestamp: entry.createdAt.toISOString(),
        moderatorId: entry.moderatorId,
      })),
    }));

    return NextResponse.json({
      reviews: formattedReviews,
      stats: {
        totalPending,
        totalApproved,
        totalRejected,
        averageProcessingTime: avgProcessing._avg.processingTimeHours || 0,
      },
      pagination: {
        page,
        limit,
        hasMore: reviews.length === limit,
      },
    });

  } catch (error) {
    console.error('Error fetching reviews for moderation:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}