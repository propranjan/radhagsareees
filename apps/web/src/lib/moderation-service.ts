import { prisma } from '@radhagsareees/db';
import { revalidateTag } from 'next/cache';
import { performBasicContentModeration } from './review-validations';
import { analyzeContentSafety, NSFWHeuristicResult } from './nsfw-heuristic-analyzer';

export interface ModerationResult {
  reviewId: string;
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_MANUAL_REVIEW';
  confidence: number;
  reasons: string[];
  moderatedAt: Date;
}

export interface ModerationJob {
  reviewId: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  metadata: {
    contentScore: number;
    flags: string[];
    isVerifiedPurchase: boolean;
    userHistory?: {
      totalReviews: number;
      rejectedReviews: number;
      reportedReviews: number;
    };
  };
}

/**
 * Advanced content moderation using multiple signals
 */
export async function moderateReview(reviewId: string): Promise<ModerationResult> {
  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!review) {
      throw new Error(`Review not found: ${reviewId}`);
    }

    // 1. Get user history for comprehensive analysis
    const userHistory = await getUserModerationHistory(review.userId);

    // 2. Comprehensive content analysis using NSFW heuristic analyzer
    const contentAnalysis = analyzeContentSafety({
      text: {
        title: review.title,
        body: review.comment || review.body, // Handle both old and new field names
      },
      images: (review.imageUrls || review.photos)?.length ? {
        urls: review.imageUrls || review.photos,
        metadata: (review.imageUrls || review.photos).map((url: string) => ({
          filename: url.split('/').pop() || 'unknown',
          size: 1024000, // Default size - would be actual in production
          contentType: 'image/jpeg', // Default - would detect actual type in production
        })),
      } : undefined,
      user: {
        id: review.userId,
        trustScore: userHistory.trustScore,
        reviewHistory: {
          totalReviews: userHistory.totalReviews,
          rejectedReviews: userHistory.rejectedReviews,
          reportedReviews: userHistory.reportedReviews,
        },
      },
      context: {
        productCategory: review.product.category || 'general',
        isVerifiedPurchase: review.isVerified,
      },
    });

    // 3. Additional pattern analysis for supplementary checks
    const patternAnalysis = await analyzeReviewPatterns(review);

    // 4. Combine analysis results with weighted scoring
    const finalRiskScore = Math.min(1.0, Math.max(
      contentAnalysis.riskScore,
      patternAnalysis.suspiciousScore * 0.4 // Weight pattern analysis less than content analysis
    ));

    const allFlags = [
      ...contentAnalysis.flags,
      ...patternAnalysis.flags,
    ];

    // 5. Make final moderation decision
    let finalDecision: 'APPROVED' | 'REJECTED' | 'NEEDS_MANUAL_REVIEW';
    let confidence = contentAnalysis.confidence;

    if (contentAnalysis.recommendation === 'REJECT' || finalRiskScore >= 0.8) {
      finalDecision = 'REJECTED';
    } else if (contentAnalysis.recommendation === 'APPROVE' && finalRiskScore <= 0.3) {
      finalDecision = 'APPROVED';
    } else {
      finalDecision = 'NEEDS_MANUAL_REVIEW';
      confidence *= 0.7; // Lower confidence for manual review cases
    }

    // 6. Update review with comprehensive moderation results
    const moderatedAt = new Date();
    const processingTimeHours = (moderatedAt.getTime() - review.createdAt.getTime()) / (1000 * 60 * 60);

    await prisma.review.update({
      where: { id: reviewId },
      data: {
        status: finalDecision === 'NEEDS_MANUAL_REVIEW' ? 'PENDING' : finalDecision,
        riskScore: finalRiskScore,
        moderationFlags: allFlags,
        moderatedAt: finalDecision !== 'NEEDS_MANUAL_REVIEW' ? moderatedAt : null,
        moderatorId: finalDecision !== 'NEEDS_MANUAL_REVIEW' ? 'system' : null,
        processingTimeHours: finalDecision !== 'NEEDS_MANUAL_REVIEW' ? processingTimeHours : null,
      },
    });

    const decision = {
      decision: finalDecision,
      confidence,
      reasons: allFlags,
    };

    // 8. Invalidate caches if approved
    if (decision.decision === 'APPROVED') {
      revalidateTag(`reviews:${review.productId}`);
      revalidateTag(`avg-rating:${review.productId}`);
      revalidateTag(`rating-dist:${review.productId}`);
      revalidateTag('reviews');
    }

    // 9. Log moderation result
    console.log(`Review ${reviewId} moderated:`, {
      decision: decision.decision,
      score: finalRiskScore,
      reasons: decision.reasons,
    });

    return {
      reviewId,
      decision: decision.decision,
      confidence: decision.confidence,
      reasons: decision.reasons,
      moderatedAt: new Date(),
    };

  } catch (error) {
    console.error(`Error moderating review ${reviewId}:`, error);
    throw error;
  }
}

/**
 * Get user's moderation history and calculate risk scores
 */
async function getUserModerationHistory(userId: string) {
  const userReviews = await prisma.review.findMany({
    where: { userId },
    select: {
      status: true,
      reportCount: true,
      createdAt: true,
    },
  });

  const totalReviews = userReviews.length;
  const rejectedReviews = userReviews.filter((r: any) => r.status === 'REJECTED').length;
  const reportedReviews = userReviews.filter((r: any) => r.reportCount > 0).length;
  const recentReviews = userReviews.filter(
    (r: any) => Date.now() - r.createdAt.getTime() < 7 * 24 * 60 * 60 * 1000 // Last 7 days
  ).length;

  // Calculate risk score (0-1, higher is riskier)
  let riskScore = 0;
  
  if (totalReviews > 0) {
    riskScore += (rejectedReviews / totalReviews) * 0.4; // 40% weight for rejection rate
    riskScore += (reportedReviews / totalReviews) * 0.3; // 30% weight for report rate
  }
  
  // New users or users with very recent activity get higher risk
  if (totalReviews < 3) riskScore += 0.2;
  if (recentReviews > 3) riskScore += 0.1; // Rapid submission pattern

  // Trust score is inverse of risk score
  const trustScore = Math.max(0, 1 - riskScore);

  return {
    totalReviews,
    rejectedReviews,
    reportedReviews,
    riskScore: Math.min(1, riskScore),
    trustScore,
  };
}

/**
 * Analyze review patterns for suspicious behavior
 */
async function analyzeReviewPatterns(review: any) {
  let suspiciousScore = 0;
  const flags: string[] = [];

  // Check for duplicate content
  const similarReviews = await prisma.review.findMany({
    where: {
      OR: [
        { title: review.title },
        { body: review.body },
      ],
      NOT: { id: review.id },
    },
    select: { id: true, userId: true },
  });

  if (similarReviews.length > 0) {
    suspiciousScore += 0.4;
    flags.push('Duplicate or similar content found');
  }

  // Check for rapid submissions from same user
  const recentUserReviews = await prisma.review.findMany({
    where: {
      userId: review.userId,
      createdAt: {
        gte: new Date(Date.now() - 60 * 60 * 1000), // Last hour
      },
    },
    select: { id: true },
  });

  if (recentUserReviews.length > 2) {
    suspiciousScore += 0.3;
    flags.push('Rapid submission pattern detected');
  }

  // Check review length patterns (very short or suspiciously long)
  const totalLength = review.title.length + review.body.length;
  if (totalLength < 30) {
    suspiciousScore += 0.2;
    flags.push('Unusually short review');
  } else if (totalLength > 2000) {
    suspiciousScore += 0.1;
    flags.push('Unusually long review');
  }

  // Check for extreme ratings without sufficient justification
  if ((review.rating === 1 || review.rating === 5) && review.body.length < 50) {
    suspiciousScore += 0.2;
    flags.push('Extreme rating with minimal justification');
  }

  return {
    suspiciousScore: Math.min(1, suspiciousScore),
    flags,
  };
}

/**
 * Moderate uploaded photos (placeholder for actual image moderation)
 */
async function moderatePhotos(photoUrls: string[]): Promise<number> {
  if (!photoUrls || photoUrls.length === 0) return 0;

  // In a real implementation, this would:
  // - Check for inappropriate content using AI services (Google Vision, AWS Rekognition)
  // - Verify photos are actually of the product
  // - Check for watermarks or stolen images
  // - Validate image quality and authenticity

  // For now, return a placeholder score
  let score = 0;
  
  // Simple checks
  if (photoUrls.length > 3) score += 0.1; // Too many photos might be spam
  
  // Check for suspicious URL patterns
  const suspiciousPatterns = ['tmp', 'temp', 'random', 'fake'];
  for (const url of photoUrls) {
    for (const pattern of suspiciousPatterns) {
      if (url.toLowerCase().includes(pattern)) {
        score += 0.2;
        break;
      }
    }
  }

  return Math.min(1, score);
}

/**
 * Calculate final moderation score using weighted factors
 */
function calculateFinalModerationScore({
  contentScore,
  userHistoryScore,
  patternScore,
  photoScore,
  isVerifiedPurchase,
}: {
  contentScore: number;
  userHistoryScore: number;
  patternScore: number;
  photoScore: number;
  isVerifiedPurchase: boolean;
}): number {
  let finalScore = 0;

  // Weight the different factors
  finalScore += contentScore * 0.4;      // 40% - Content is most important
  finalScore += userHistoryScore * 0.25; // 25% - User history
  finalScore += patternScore * 0.2;      // 20% - Pattern analysis
  finalScore += photoScore * 0.15;       // 15% - Photo moderation

  // Bonus for verified purchases (reduce risk score)
  if (isVerifiedPurchase) {
    finalScore *= 0.7; // 30% reduction for verified purchases
  }

  return Math.min(1, Math.max(0, finalScore));
}

/**
 * Make final moderation decision based on score and additional factors
 */
function makeModerationDecision(
  score: number,
  factors: {
    isVerifiedPurchase: boolean;
    userTrustScore: number;
    contentFlags: string[];
    patternFlags: string[];
  }
): {
  decision: 'APPROVED' | 'REJECTED' | 'NEEDS_MANUAL_REVIEW';
  confidence: number;
  reasons: string[];
} {
  const reasons: string[] = [];
  let decision: 'APPROVED' | 'REJECTED' | 'NEEDS_MANUAL_REVIEW';
  let confidence: number;

  // High-risk thresholds
  if (score >= 0.8) {
    decision = 'REJECTED';
    confidence = 0.9;
    reasons.push('High-risk content detected');
  }
  // Medium-risk thresholds
  else if (score >= 0.5) {
    decision = 'NEEDS_MANUAL_REVIEW';
    confidence = 0.6;
    reasons.push('Medium-risk content requires manual review');
  }
  // Low-risk thresholds
  else if (score < 0.2 && factors.isVerifiedPurchase && factors.userTrustScore > 0.7) {
    decision = 'APPROVED';
    confidence = 0.85;
    reasons.push('Low-risk content from trusted verified purchaser');
  }
  // Default to manual review for edge cases
  else {
    decision = 'NEEDS_MANUAL_REVIEW';
    confidence = 0.5;
    reasons.push('Standard manual review required');
  }

  // Add specific reasons based on flags
  if (factors.contentFlags.length > 0) {
    reasons.push(`Content issues: ${factors.contentFlags.join(', ')}`);
  }
  if (factors.patternFlags.length > 0) {
    reasons.push(`Pattern issues: ${factors.patternFlags.join(', ')}`);
  }

  return { decision, confidence, reasons };
}

/**
 * Process a batch of pending reviews
 */
export async function processModerationQueue(batchSize = 10): Promise<ModerationResult[]> {
  const pendingReviews = await prisma.review.findMany({
    where: { status: 'PENDING' },
    orderBy: { createdAt: 'asc' },
    take: batchSize,
    select: { id: true },
  });

  const results: ModerationResult[] = [];

  for (const review of pendingReviews) {
    try {
      const result = await moderateReview(review.id);
      results.push(result);
    } catch (error) {
      console.error(`Failed to moderate review ${review.id}:`, error);
      // Continue processing other reviews even if one fails
    }
  }

  return results;
}

/**
 * Manual moderation endpoint for admin users
 */
export async function manuallyModerateReview(
  reviewId: string,
  decision: 'APPROVED' | 'REJECTED',
  moderatorId: string,
  reason?: string
): Promise<void> {
  await prisma.review.update({
    where: { id: reviewId },
    data: {
      status: decision,
      // Add moderation metadata if schema supports it
      // moderationData: {
      //   decision,
      //   moderatorId,
      //   reason,
      //   moderatedAt: new Date(),
      //   manual: true,
      // },
    },
  });

  // Invalidate caches if approved
  if (decision === 'APPROVED') {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { productId: true },
    });

    if (review) {
      revalidateTag(`reviews:${review.productId}`);
      revalidateTag(`avg-rating:${review.productId}`);
      revalidateTag(`rating-dist:${review.productId}`);
      revalidateTag('reviews');
    }
  }

  console.log(`Review ${reviewId} manually moderated by ${moderatorId}: ${decision}`);
}