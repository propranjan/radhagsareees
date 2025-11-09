import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyJWT } from '@/lib/auth-utils';

/**
 * POST /api/admin/moderation/reviews/bulk-approve
 * Bulk approve low-risk reviews that meet certain criteria
 */
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const authResult = await verifyJWT(request);
    if (!authResult.success || authResult.payload?.role !== 'admin') {
      return NextResponse.json(
        { error: 'Unauthorized - Admin access required' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { maxRiskScore = 0.3, maxAge = 24 } = body; // Default: risk score <= 0.3, submitted within 24 hours

    const moderatorId = authResult.payload?.userId;
    if (!moderatorId) {
      return NextResponse.json(
        { error: 'Moderator ID not found' },
        { status: 400 }
      );
    }

    // Find reviews that meet bulk approval criteria
    const eligibleReviews = await prisma.review.findMany({
      where: {
        status: 'PENDING',
        riskScore: {
          lte: maxRiskScore,
        },
        createdAt: {
          gte: new Date(Date.now() - maxAge * 60 * 60 * 1000), // Within maxAge hours
        },
        // Additional safety checks
        moderationFlags: {
          none: {}, // No moderation flags
        },
      },
      select: {
        id: true,
        productId: true,
        createdAt: true,
        riskScore: true,
      },
      take: 50, // Limit bulk operations to prevent timeout
    });

    if (eligibleReviews.length === 0) {
      return NextResponse.json({
        success: true,
        approvedCount: 0,
        message: 'No reviews found matching bulk approval criteria',
      });
    }

    // Perform bulk approval in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const approvedReviews = [];
      const currentTime = new Date();

      for (const review of eligibleReviews) {
        const processingTimeHours = (currentTime.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60);

        // Update review status
        await tx.review.update({
          where: { id: review.id },
          data: {
            status: 'APPROVED',
            moderatedAt: currentTime,
            moderatorId,
            processingTimeHours,
          },
        });

        // Add moderation history
        await tx.moderationHistory.create({
          data: {
            reviewId: review.id,
            action: 'APPROVE',
            reason: `Bulk approval - Low risk score (${review.riskScore})`,
            moderatorId,
          },
        });

        approvedReviews.push({
          id: review.id,
          productId: review.productId,
          processingTimeHours: Math.round(processingTimeHours * 100) / 100,
        });
      }

      return approvedReviews;
    });

    // Invalidate cache for affected products
    const uniqueProductIds = [...new Set(result.map(review => review.productId))];
    
    try {
      // Import revalidateTag if available
      const { revalidateTag } = await import('next/cache');
      
      for (const productId of uniqueProductIds) {
        revalidateTag(`product-reviews-${productId}`);
      }
      revalidateTag('product-ratings');
    } catch (error) {
      console.warn('Cache revalidation not available:', error);
    }

    // Log bulk approval
    console.log(`Bulk approved ${result.length} reviews by moderator ${moderatorId}`, {
      maxRiskScore,
      maxAge,
      affectedProducts: uniqueProductIds.length,
      averageProcessingTime: result.reduce((sum, r) => sum + r.processingTimeHours, 0) / result.length,
    });

    return NextResponse.json({
      success: true,
      approvedCount: result.length,
      affectedProducts: uniqueProductIds.length,
      criteria: {
        maxRiskScore,
        maxAge,
      },
      message: `Successfully approved ${result.length} low-risk reviews`,
    });

  } catch (error) {
    console.error('Error in bulk approve:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}