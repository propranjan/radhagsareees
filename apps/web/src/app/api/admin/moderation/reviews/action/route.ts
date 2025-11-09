import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyJWT } from '@/lib/auth-utils';

/**
 * POST /api/admin/moderation/reviews/action
 * Handle individual review approval/rejection actions
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
    const { reviewId, action, reason } = body;

    // Validate input
    if (!reviewId || !action) {
      return NextResponse.json(
        { error: 'Review ID and action are required' },
        { status: 400 }
      );
    }

    if (!['APPROVE', 'REJECT'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be APPROVE or REJECT' },
        { status: 400 }
      );
    }

    const moderatorId = authResult.payload?.userId;
    if (!moderatorId) {
      return NextResponse.json(
        { error: 'Moderator ID not found' },
        { status: 400 }
      );
    }

    // Fetch the review to ensure it exists and is in PENDING status
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        product: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!review) {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }

    if (review.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'Review has already been processed' },
        { status: 400 }
      );
    }

    // Calculate processing time
    const processingTimeHours = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);

    // Update review status and add moderation history
    const updatedReview = await prisma.$transaction(async (tx) => {
      // Update review status
      const updated = await tx.review.update({
        where: { id: reviewId },
        data: {
          status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED',
          moderatedAt: new Date(),
          moderatorId,
          processingTimeHours,
        },
      });

      // Add moderation history entry
      await tx.moderationHistory.create({
        data: {
          reviewId,
          action,
          reason: reason || null,
          moderatorId,
        },
      });

      return updated;
    });

    // If approved, invalidate product reviews cache
    if (action === 'APPROVE') {
      // Note: In a real implementation, you'd use your caching strategy
      // This could be Redis, Next.js revalidation, etc.
      try {
        // Import revalidateTag if available
        const { revalidateTag } = await import('next/cache');
        revalidateTag(`product-reviews-${review.productId}`);
        revalidateTag('product-ratings');
      } catch (error) {
        console.warn('Cache revalidation not available:', error);
      }
    }

    // Log the moderation action
    console.log(`Review ${reviewId} ${action.toLowerCase()}ed by moderator ${moderatorId}`, {
      productId: review.productId,
      productName: review.product.name,
      reason: reason || 'No reason provided',
      processingTimeHours: Math.round(processingTimeHours * 100) / 100,
    });

    return NextResponse.json({
      success: true,
      reviewId,
      action,
      status: updatedReview.status,
      processingTimeHours: Math.round(processingTimeHours * 100) / 100,
    });

  } catch (error) {
    console.error('Error processing review action:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}