import { z } from 'zod';

// Review submission validation
export const reviewSubmissionSchema = z.object({
  productId: z.string().min(1, 'Product ID is required'),
  rating: z.number()
    .int('Rating must be an integer')
    .min(1, 'Rating must be at least 1')
    .max(5, 'Rating must be at most 5'),
  title: z.string()
    .min(1, 'Review title is required')
    .max(100, 'Review title must be 100 characters or less'),
  comment: z.string()
    .min(1, 'Review comment is required')
    .max(2000, 'Review comment must be 2000 characters or less'),
  imageUrls: z.array(z.string())
    .max(3, 'Maximum 3 images allowed')
    .optional()
    .default([]),
});

// Photo upload validation (for multipart form data)
export const photoUploadSchema = z.object({
  file: z.any()
    .refine((file) => file?.size <= 2 * 1024 * 1024, 'Photo must be 2MB or smaller')
    .refine(
      (file) => ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file?.type),
      'Photo must be JPEG, PNG, or WebP format'
    ),
});

// Review query parameters validation
export const reviewQuerySchema = z.object({
  productId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  rating: z.coerce.number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  page: z.coerce.number()
    .int()
    .min(1)
    .default(1),
  limit: z.coerce.number()
    .int()
    .min(1)
    .max(50)
    .default(10),
  sortBy: z.enum(['createdAt', 'rating', 'helpfulCount']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Review moderation validation
export const reviewModerationSchema = z.object({
  reviewId: z.string().min(1, 'Review ID is required'),
  status: z.enum(['APPROVED', 'REJECTED']),
  moderatorId: z.string().min(1, 'Moderator ID is required'),
  reason: z.string().optional(),
});

// Review update validation (for helpful/report actions)
export const reviewActionSchema = z.object({
  action: z.enum(['helpful', 'report']),
  reviewId: z.string().min(1, 'Review ID is required'),
});

// Types for TypeScript
export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;
export type PhotoUpload = z.infer<typeof photoUploadSchema>;
export type ReviewQuery = z.infer<typeof reviewQuerySchema>;
export type ReviewModeration = z.infer<typeof reviewModerationSchema>;
export type ReviewAction = z.infer<typeof reviewActionSchema>;

// Review response types
export type ReviewResponse = {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
  };
};

export type ReviewsListResponse = {
  reviews: ReviewResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
};

export type ReviewSubmissionResponse = {
  success: boolean;
  review?: ReviewResponse;
  message: string;
};

// Validation helper functions
export function validateReviewSubmission(data: unknown) {
  try {
    return {
      success: true,
      data: reviewSubmissionSchema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error : new Error('Validation failed'),
    };
  }
}

export function validateReviewQuery(params: unknown) {
  try {
    return {
      success: true,
      data: reviewQuerySchema.parse(params),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error : new Error('Query validation failed'),
    };
  }
}

export function validatePhotoUpload(file: unknown) {
  try {
    return {
      success: true,
      data: photoUploadSchema.parse({ file }),
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof z.ZodError ? error : new Error('Photo validation failed'),
    };
  }
}

// Content moderation helpers
export const INAPPROPRIATE_WORDS = [
  // Add inappropriate words here for basic content filtering
  'spam', 'fake', 'scam', 'terrible', 'worst', 'hate', 'garbage'
];

export function performBasicContentModeration(text: string): {
  score: number; // 0-1, higher means more likely to be inappropriate
  flags: string[];
} {
  const lowerText = text.toLowerCase();
  let score = 0;
  const flags: string[] = [];

  // Check for inappropriate words
  for (const word of INAPPROPRIATE_WORDS) {
    if (lowerText.includes(word)) {
      score += 0.2;
      flags.push(`Contains inappropriate word: ${word}`);
    }
  }

  // Check for excessive caps
  const capsRatio = (text.match(/[A-Z]/g) || []).length / text.length;
  if (capsRatio > 0.5 && text.length > 10) {
    score += 0.3;
    flags.push('Excessive capitalization');
  }

  // Check for repetitive characters
  if (/(.)\1{3,}/.test(text)) {
    score += 0.2;
    flags.push('Repetitive characters');
  }

  // Check for very short reviews (might be spam)
  if (text.length < 20) {
    score += 0.1;
    flags.push('Very short content');
  }

  return { score: Math.min(score, 1), flags };
}

// Cache key generators for reviews
export function generateReviewsCacheKey(params: ReviewQuery): string {
  const { productId, status, rating, page, limit, sortBy, sortOrder } = params;
  return `reviews:${productId || 'all'}:${status || 'all'}:${rating || 'all'}:${page}:${limit}:${sortBy}:${sortOrder}`;
}

export function generateAverageRatingCacheKey(productId: string): string {
  return `avg-rating:${productId}`;
}

export function generateRatingDistributionCacheKey(productId: string): string {
  return `rating-dist:${productId}`;
}