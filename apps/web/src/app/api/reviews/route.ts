import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { revalidateTag, unstable_cache } from 'next/cache';
import { authenticateRequest, checkReviewRateLimit } from '../../../lib/auth-utils';
import { 
  validateReviewSubmission,
  validateReviewQuery,
  performBasicContentModeration,
  generateReviewsCacheKey,
  generateAverageRatingCacheKey,
  generateRatingDistributionCacheKey,
  type ReviewSubmission,
  type ReviewSubmissionResponse,
  type ReviewsListResponse 
} from '../../../lib/review-validations';

/**
 * GET /api/reviews?productId=[id]&status=approved&page=1&limit=10
 * 
 * Fetch reviews with pagination and filtering
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Validate query parameters
    const validation = validateReviewQuery(queryParams);
    if (!validation.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validation.error,
        },
        { status: 400 }
      );
    }

    const { productId, status = 'APPROVED', page, limit, sortBy, sortOrder } = validation.data;

    // Build cache key
    const cacheKey = generateReviewsCacheKey(validation.data);

    // Use cached data with 10 minute TTL
    const getCachedReviews = unstable_cache(
      async () => {
        // Build where clause
        const where: any = {};
        if (productId) where.productId = productId;
        if (status) where.status = status;

        // Calculate pagination
        const skip = (page - 1) * limit;

        // Build sort clause
        const orderBy: any = {};
        orderBy[sortBy] = sortOrder;

        // Fetch reviews with user info
        const [reviews, total] = await Promise.all([
          prisma.review.findMany({
            where,
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: false, // Don't expose email to public
                },
              },
            },
            orderBy,
            skip,
            take: limit,
          }),
          prisma.review.count({ where }),
        ]);

        return { reviews, total };
      },
      [cacheKey],
      {
        revalidate: 600, // 10 minutes
        tags: [
          'reviews',
          productId ? `reviews:${productId}` : 'reviews:all',
          status ? `reviews:status:${status}` : 'reviews:all-statuses'
        ],
      }
    );

    const { reviews, total } = await getCachedReviews();

    // Calculate average rating and distribution (if productId provided)
    let averageRating = 0;
    let ratingDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

    if (productId) {
      // Use cached average rating
      const getCachedAverageRating = unstable_cache(
        async () => {
          const approvedReviews = await prisma.review.findMany({
            where: { productId, status: 'APPROVED' },
            select: { rating: true },
          });

          if (approvedReviews.length === 0) return { avg: 0, dist: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

          const avg = approvedReviews.reduce((sum, r) => sum + r.rating, 0) / approvedReviews.length;
          const dist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
          
          approvedReviews.forEach(r => {
            dist[r.rating as keyof typeof dist]++;
          });

          return { avg, dist };
        },
        [generateAverageRatingCacheKey(productId)],
        {
          revalidate: 600, // 10 minutes
          tags: [`avg-rating:${productId}`, `rating-dist:${productId}`],
        }
      );

      const ratingData = await getCachedAverageRating();
      averageRating = ratingData.avg;
      ratingDistribution = ratingData.dist;
    }

    // Format response
    const response: ReviewsListResponse = {
      reviews: reviews.map(review => ({
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        photos: review.photos,
        status: review.status as 'PENDING' | 'APPROVED' | 'REJECTED',
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        reportCount: review.reportCount,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        user: {
          id: review.user.id,
          name: review.user.name || 'Anonymous User',
        },
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reviews' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/reviews
 * 
 * Creates a new product review with authentication and moderation
 */
export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate user
    const authResult = await authenticateRequest(request);
    if (!authResult.success || !authResult.user) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Authentication required',
          message: authResult.error || 'Please log in to submit a review'
        },
        { status: 401 }
      );
    }

    const user = authResult.user;

    // 2. Check rate limiting
    const rateLimit = checkReviewRateLimit(user.id);
    if (!rateLimit.allowed) {
      const resetTime = rateLimit.resetTime ? new Date(rateLimit.resetTime).toISOString() : undefined;
      return NextResponse.json(
        {
          success: false,
          error: 'Rate limit exceeded',
          message: 'Too many review submissions. Please try again later.',
          resetTime,
        },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    let requestBody: unknown;
    try {
      requestBody = await request.json();
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid JSON in request body',
          message: 'Please provide valid JSON data'
        },
        { status: 400 }
      );
    }

    const validation = validateReviewSubmission(requestBody);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          message: 'Please check your submission data',
          details: validation.error,
        },
        { status: 400 }
      );
    }

    const reviewData: ReviewSubmission = validation.data;

    // 4. Verify product exists and user hasn't already reviewed it
    const [product, existingReview] = await Promise.all([
      prisma.product.findUnique({
        where: { id: reviewData.productId },
        select: { id: true, title: true }
      }),
      prisma.review.findUnique({
        where: {
          userId_productId: {
            userId: user.id,
            productId: reviewData.productId
          }
        },
        select: { id: true }
      })
    ]);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found',
          message: 'The product you are trying to review does not exist'
        },
        { status: 404 }
      );
    }

    if (existingReview) {
      return NextResponse.json(
        {
          success: false,
          error: 'Review already exists',
          message: 'You have already reviewed this product'
        },
        { status: 409 }
      );
    }

    // 5. Perform basic content moderation
    const titleModeration = performBasicContentModeration(reviewData.title);
    const bodyModeration = performBasicContentModeration(reviewData.body);
    
    const totalScore = (titleModeration.score + bodyModeration.score) / 2;
    const allFlags = [...titleModeration.flags, ...bodyModeration.flags];

    // Auto-reject if moderation score is too high
    let initialStatus: 'PENDING' | 'REJECTED' = 'PENDING';
    if (totalScore > 0.7) {
      initialStatus = 'REJECTED';
    }

    // 6. Check if user has verified purchase (optional enhancement)
    const verifiedPurchase = await prisma.orderItem.findFirst({
      where: {
        productId: reviewData.productId,
        order: {
          userId: user.id,
          status: 'CONFIRMED'
        }
      },
      select: { id: true }
    });

    // 7. Create review in database
    const review = await prisma.review.create({
      data: {
        productId: reviewData.productId,
        userId: user.id,
        rating: reviewData.rating,
        title: reviewData.title,
        body: reviewData.body,
        photos: reviewData.photos || [],
        status: initialStatus,
        isVerified: !!verifiedPurchase,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 8. Trigger background moderation job (if not auto-rejected)
    if (initialStatus === 'PENDING') {
      try {
        await triggerModerationJob(review.id, {
          score: totalScore,
          flags: allFlags,
          isVerifiedPurchase: !!verifiedPurchase
        });
      } catch (error) {
        console.error('Failed to trigger moderation job:', error);
        // Don't fail the request if moderation job fails
      }
    }

    // 9. Invalidate relevant caches
    revalidateTag(`reviews:${reviewData.productId}`);
    revalidateTag(`avg-rating:${reviewData.productId}`);
    revalidateTag(`rating-dist:${reviewData.productId}`);
    revalidateTag('reviews');

    // 10. Return success response
    const response: ReviewSubmissionResponse = {
      success: true,
      review: {
        id: review.id,
        productId: review.productId,
        userId: review.userId,
        rating: review.rating,
        title: review.title,
        body: review.body,
        photos: review.photos,
        status: review.status,
        isVerified: review.isVerified,
        helpfulCount: review.helpfulCount,
        reportCount: review.reportCount,
        createdAt: review.createdAt.toISOString(),
        updatedAt: review.updatedAt.toISOString(),
        user: {
          id: review.user.id,
          name: review.user.name || 'Anonymous User',
          email: user.role === 'ADMIN' ? review.user.email : undefined
        }
      },
      message: initialStatus === 'PENDING' 
        ? 'Review submitted successfully and is pending moderation'
        : 'Review was automatically rejected due to content policy violations'
    };

    return NextResponse.json(response, { status: 201 });

  } catch (error) {
    console.error('Error creating review:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
        message: 'Failed to submit review. Please try again later.'
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Trigger background moderation job
 */
async function triggerModerationJob(
  reviewId: string, 
  moderationData: {
    score: number;
    flags: string[];
    isVerifiedPurchase: boolean;
  }
) {
  // In a real application, this would trigger a background job
  // For now, we'll simulate by logging and potentially auto-approving low-risk reviews
  
  console.log(`Moderation job triggered for review ${reviewId}:`, moderationData);

  // Auto-approve low-risk reviews from verified purchases
  if (moderationData.score < 0.2 && moderationData.isVerifiedPurchase && moderationData.flags.length === 0) {
    try {
      await prisma.review.update({
        where: { id: reviewId },
        data: { status: 'APPROVED' }
      });
      
      console.log(`Auto-approved low-risk review ${reviewId}`);
      
      // Invalidate caches after auto-approval
      const review = await prisma.review.findUnique({
        where: { id: reviewId },
        select: { productId: true }
      });
      
      if (review) {
        revalidateTag(`reviews:${review.productId}`);
        revalidateTag(`avg-rating:${review.productId}`);
        revalidateTag(`rating-dist:${review.productId}`);
      }
      
    } catch (error) {
      console.error(`Failed to auto-approve review ${reviewId}:`, error);
    }
  }

  // In a production environment, you might:
  // - Send to a queue (Redis, Bull, etc.)
  // - Call an external AI moderation API
  // - Notify moderators via email/Slack
  // - Schedule for manual review
}