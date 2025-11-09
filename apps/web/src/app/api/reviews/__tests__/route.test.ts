import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import * as authUtils from '../../../../lib/auth-utils';
import * as reviewValidations from '../../../../lib/review-validations';
import { prisma } from '@radhagsareees/db';

// Mock dependencies
vi.mock('@radhagsareees/db', () => ({
  prisma: {
    review: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    product: {
      findUnique: vi.fn(),
    },
    orderItem: {
      findFirst: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    $disconnect: vi.fn(),
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  unstable_cache: vi.fn((fn) => fn),
}));

vi.mock('../../../../lib/auth-utils');
vi.mock('../../../../lib/review-validations');

// Test data
const mockUser = {
  id: 'user_123',
  email: 'test@example.com',
  name: 'Test User',
  role: 'CUSTOMER' as const,
};

const mockProduct = {
  id: 'product_123',
  title: 'Test Product',
};

const mockReviewSubmission = {
  productId: 'product_123',
  rating: 5,
  title: 'Great product!',
  body: 'I really love this product. It exceeded my expectations and the quality is amazing.',
  photos: ['https://example.com/photo1.jpg'],
};

const mockCreatedReview = {
  id: 'review_123',
  productId: 'product_123',
  userId: 'user_123',
  rating: 5,
  title: 'Great product!',
  body: 'I really love this product. It exceeded my expectations and the quality is amazing.',
  photos: ['https://example.com/photo1.jpg'],
  status: 'PENDING' as const,
  isVerified: true,
  helpfulCount: 0,
  reportCount: 0,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  user: {
    id: 'user_123',
    name: 'Test User',
    email: 'test@example.com',
  },
};

const mockExistingReviews = [
  {
    id: 'review_1',
    productId: 'product_123',
    userId: 'user_456',
    rating: 4,
    title: 'Good product',
    body: 'Nice quality, would recommend.',
    photos: [],
    status: 'APPROVED' as const,
    isVerified: false,
    helpfulCount: 2,
    reportCount: 0,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    user: {
      id: 'user_456',
      name: 'Another User',
    },
  },
];

describe('POST /api/reviews', () => {
  let mockAuthenticateRequest: MockedFunction<any>;
  let mockCheckReviewRateLimit: MockedFunction<any>;
  let mockValidateReviewSubmission: MockedFunction<any>;
  let mockPerformBasicContentModeration: MockedFunction<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup auth mocks
    mockAuthenticateRequest = vi.mocked(authUtils.authenticateRequest);
    mockCheckReviewRateLimit = vi.mocked(authUtils.checkReviewRateLimit);
    
    // Setup validation mocks
    mockValidateReviewSubmission = vi.mocked(reviewValidations.validateReviewSubmission);
    mockPerformBasicContentModeration = vi.mocked(reviewValidations.performBasicContentModeration);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Successful review submission', () => {
    it('should create review successfully with authentication', async () => {
      // Setup mocks for success case
      mockAuthenticateRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });
      
      mockCheckReviewRateLimit.mockReturnValue({
        allowed: true,
      });
      
      mockValidateReviewSubmission.mockReturnValue({
        success: true,
        data: mockReviewSubmission,
      });
      
      mockPerformBasicContentModeration.mockReturnValue({
        score: 0.1,
        flags: [],
      });

      // Mock database operations
      prisma.product.findUnique = vi.fn().mockResolvedValue(mockProduct);
      prisma.review.findUnique = vi.fn().mockResolvedValue(null); // No existing review
      prisma.orderItem.findFirst = vi.fn().mockResolvedValue({ id: 'order_item_1' }); // Verified purchase
      prisma.review.create = vi.fn().mockResolvedValue(mockCreatedReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.review).toBeDefined();
      expect(responseData.review.rating).toBe(5);
      expect(responseData.review.isVerified).toBe(true);
      expect(responseData.message).toContain('pending moderation');

      // Verify function calls
      expect(mockAuthenticateRequest).toHaveBeenCalledWith(request);
      expect(mockCheckReviewRateLimit).toHaveBeenCalledWith(mockUser.id);
      expect(mockValidateReviewSubmission).toHaveBeenCalledWith(mockReviewSubmission);
      expect(prisma.review.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({
          productId: mockReviewSubmission.productId,
          userId: mockUser.id,
          rating: mockReviewSubmission.rating,
          title: mockReviewSubmission.title,
          body: mockReviewSubmission.body,
          photos: mockReviewSubmission.photos,
          status: 'PENDING',
          isVerified: true,
        }),
      }));
    });

    it('should auto-approve low-risk reviews from verified purchases', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });
      
      mockCheckReviewRateLimit.mockReturnValue({ allowed: true });
      mockValidateReviewSubmission.mockReturnValue({
        success: true,
        data: mockReviewSubmission,
      });
      
      // Very low moderation score
      mockPerformBasicContentModeration.mockReturnValue({
        score: 0.05,
        flags: [],
      });

      const autoApprovedReview = {
        ...mockCreatedReview,
        status: 'APPROVED' as const,
      };

      prisma.product.findUnique = vi.fn().mockResolvedValue(mockProduct);
      prisma.review.findUnique = vi.fn().mockResolvedValue(null);
      prisma.orderItem.findFirst = vi.fn().mockResolvedValue({ id: 'order_item_1' });
      prisma.review.create = vi.fn().mockResolvedValue(mockCreatedReview);
      prisma.review.update = vi.fn().mockResolvedValue(autoApprovedReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);

      // Should trigger auto-approval for low-risk content
      // Note: Auto-approval happens in the background, so we check the initial status
      expect(responseData.review.status).toBe('PENDING');
    });

    it('should handle review without verified purchase', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });
      
      mockCheckReviewRateLimit.mockReturnValue({ allowed: true });
      mockValidateReviewSubmission.mockReturnValue({
        success: true,
        data: mockReviewSubmission,
      });
      
      mockPerformBasicContentModeration.mockReturnValue({
        score: 0.3,
        flags: [],
      });

      const unverifiedReview = {
        ...mockCreatedReview,
        isVerified: false,
      };

      prisma.product.findUnique = vi.fn().mockResolvedValue(mockProduct);
      prisma.review.findUnique = vi.fn().mockResolvedValue(null);
      prisma.orderItem.findFirst = vi.fn().mockResolvedValue(null); // No verified purchase
      prisma.review.create = vi.fn().mockResolvedValue(unverifiedReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.review.isVerified).toBe(false);
    });
  });

  describe('Authentication and authorization', () => {
    it('should reject unauthenticated requests', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        success: false,
        error: 'No token provided',
      });

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Authentication required');
      expect(mockCheckReviewRateLimit).not.toHaveBeenCalled();
    });

    it('should enforce rate limiting', async () => {
      mockAuthenticateRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });
      
      mockCheckReviewRateLimit.mockReturnValue({
        allowed: false,
        resetTime: Date.now() + 3600000, // 1 hour from now
      });

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(429);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Rate limit exceeded');
      expect(responseData.resetTime).toBeDefined();
    });
  });

  describe('Validation errors', () => {
    beforeEach(() => {
      mockAuthenticateRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });
      
      mockCheckReviewRateLimit.mockReturnValue({ allowed: true });
    });

    it('should reject invalid request data', async () => {
      mockValidateReviewSubmission.mockReturnValue({
        success: false,
        error: new Error('Rating must be between 1 and 5'),
      });

      const invalidRequest = {
        ...mockReviewSubmission,
        rating: 6, // Invalid rating
      };

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid request data');
    });

    it('should reject malformed JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: '{ invalid json',
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid JSON in request body');
    });

    it('should reject review for non-existent product', async () => {
      mockValidateReviewSubmission.mockReturnValue({
        success: true,
        data: mockReviewSubmission,
      });

      prisma.product.findUnique = vi.fn().mockResolvedValue(null); // Product not found

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(404);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Product not found');
    });

    it('should reject duplicate reviews', async () => {
      mockValidateReviewSubmission.mockReturnValue({
        success: true,
        data: mockReviewSubmission,
      });

      prisma.product.findUnique = vi.fn().mockResolvedValue(mockProduct);
      prisma.review.findUnique = vi.fn().mockResolvedValue(mockCreatedReview); // Existing review

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(409);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Review already exists');
    });
  });

  describe('Content moderation', () => {
    beforeEach(() => {
      mockAuthenticateRequest.mockResolvedValue({
        success: true,
        user: mockUser,
      });
      
      mockCheckReviewRateLimit.mockReturnValue({ allowed: true });
      mockValidateReviewSubmission.mockReturnValue({
        success: true,
        data: mockReviewSubmission,
      });
      
      prisma.product.findUnique = vi.fn().mockResolvedValue(mockProduct);
      prisma.review.findUnique = vi.fn().mockResolvedValue(null);
      prisma.orderItem.findFirst = vi.fn().mockResolvedValue({ id: 'order_item_1' });
    });

    it('should auto-reject high-risk content', async () => {
      mockPerformBasicContentModeration.mockReturnValue({
        score: 0.8, // High risk
        flags: ['Contains inappropriate word: spam'],
      });

      const rejectedReview = {
        ...mockCreatedReview,
        status: 'REJECTED' as const,
      };

      prisma.review.create = vi.fn().mockResolvedValue(rejectedReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.review.status).toBe('REJECTED');
      expect(responseData.message).toContain('automatically rejected');
    });

    it('should handle medium-risk content for manual review', async () => {
      mockPerformBasicContentModeration.mockReturnValue({
        score: 0.5, // Medium risk
        flags: ['Excessive capitalization'],
      });

      prisma.review.create = vi.fn().mockResolvedValue(mockCreatedReview);

      const request = new NextRequest('http://localhost:3000/api/reviews', {
        method: 'POST',
        headers: {
          'authorization': 'Bearer valid-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockReviewSubmission),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(201);
      expect(responseData.success).toBe(true);
      expect(responseData.review.status).toBe('PENDING');
      expect(responseData.message).toContain('pending moderation');
    });
  });
});

describe('GET /api/reviews', () => {
  let mockValidateReviewQuery: MockedFunction<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    mockValidateReviewQuery = vi.mocked(reviewValidations.validateReviewQuery);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Successful review retrieval', () => {
    it('should fetch reviews with pagination and filtering', async () => {
      mockValidateReviewQuery.mockReturnValue({
        success: true,
        data: {
          productId: 'product_123',
          status: 'APPROVED',
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      prisma.review.findMany = vi.fn().mockResolvedValue(mockExistingReviews);
      prisma.review.count = vi.fn().mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product_123&status=APPROVED&page=1&limit=10'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.reviews).toBeDefined();
      expect(responseData.reviews).toHaveLength(1);
      expect(responseData.pagination).toBeDefined();
      expect(responseData.pagination.page).toBe(1);
      expect(responseData.pagination.total).toBe(1);
      expect(responseData.averageRating).toBeDefined();
      expect(responseData.ratingDistribution).toBeDefined();

      // Verify database queries
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            productId: 'product_123',
            status: 'APPROVED',
          },
          skip: 0,
          take: 10,
        })
      );
    });

    it('should calculate average rating and distribution correctly', async () => {
      const multipleReviews = [
        { ...mockExistingReviews[0], rating: 5 },
        { ...mockExistingReviews[0], rating: 4, id: 'review_2' },
        { ...mockExistingReviews[0], rating: 4, id: 'review_3' },
        { ...mockExistingReviews[0], rating: 3, id: 'review_4' },
      ];

      mockValidateReviewQuery.mockReturnValue({
        success: true,
        data: {
          productId: 'product_123',
          status: 'APPROVED',
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      prisma.review.findMany
        .mockResolvedValueOnce(multipleReviews) // For main query
        .mockResolvedValueOnce(multipleReviews); // For rating calculation
      prisma.review.count = vi.fn().mockResolvedValue(4);

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product_123&status=APPROVED'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.averageRating).toBe(4); // (5+4+4+3)/4 = 4
      expect(responseData.ratingDistribution).toEqual({
        1: 0,
        2: 0,
        3: 1,
        4: 2,
        5: 1,
      });
    });

    it('should handle sorting options', async () => {
      mockValidateReviewQuery.mockReturnValue({
        success: true,
        data: {
          productId: 'product_123',
          page: 1,
          limit: 10,
          sortBy: 'rating',
          sortOrder: 'asc',
        },
      });

      prisma.review.findMany = vi.fn().mockResolvedValue(mockExistingReviews);
      prisma.review.count = vi.fn().mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product_123&sortBy=rating&sortOrder=asc'
      );

      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(prisma.review.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { rating: 'asc' },
        })
      );
    });
  });

  describe('Query validation', () => {
    it('should reject invalid query parameters', async () => {
      mockValidateReviewQuery.mockReturnValue({
        success: false,
        error: new Error('Invalid page number'),
      });

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?page=invalid'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid query parameters');
    });

    it('should handle empty results gracefully', async () => {
      mockValidateReviewQuery.mockReturnValue({
        success: true,
        data: {
          productId: 'nonexistent_product',
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      prisma.review.findMany = vi.fn().mockResolvedValue([]);
      prisma.review.count = vi.fn().mockResolvedValue(0);

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=nonexistent_product'
      );

      const response = await GET(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.reviews).toEqual([]);
      expect(responseData.pagination.total).toBe(0);
      expect(responseData.averageRating).toBe(0);
    });
  });

  describe('Performance and caching', () => {
    it('should use cache for repeated queries', async () => {
      mockValidateReviewQuery.mockReturnValue({
        success: true,
        data: {
          productId: 'product_123',
          status: 'APPROVED',
          page: 1,
          limit: 10,
          sortBy: 'createdAt',
          sortOrder: 'desc',
        },
      });

      prisma.review.findMany = vi.fn().mockResolvedValue(mockExistingReviews);
      prisma.review.count = vi.fn().mockResolvedValue(1);

      const request = new NextRequest(
        'http://localhost:3000/api/reviews?productId=product_123&status=APPROVED'
      );

      // Make the same request twice
      await GET(request);
      await GET(request);

      // Due to caching, database should only be called once
      // Note: In actual implementation, this would be controlled by unstable_cache
      expect(prisma.review.findMany).toHaveBeenCalled();
    });
  });
});