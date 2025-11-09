import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { createHmac } from 'crypto';

// Mock dependencies
jest.mock('@radhagsareees/db');
jest.mock('next/cache', () => ({
  revalidateTag: jest.fn(),
}));

const mockPrismaClient = {
  user: {
    findUnique: jest.fn(),
  },
  variant: {
    findUnique: jest.fn(),
  },
  inventory: {
    upsert: jest.fn(),
  },
  $disconnect: jest.fn(),
};

// Mock environment
process.env.ADMIN_SECRET = 'test-secret-key-for-testing-only';

/**
 * Helper function to create valid signature
 */
function createTestSignature(data: {
  updates: Array<{
    variantId: string;
    qtyAvailable: number;
    lowStockThreshold: number;
  }>;
  adminUserId: string;
  timestamp: number;
}): string {
  const sortedUpdates = data.updates
    .map(update => ({
      variantId: update.variantId,
      qtyAvailable: update.qtyAvailable,
      lowStockThreshold: update.lowStockThreshold,
    }))
    .sort((a, b) => a.variantId.localeCompare(b.variantId));

  const payload = JSON.stringify({
    updates: sortedUpdates,
    adminUserId: data.adminUserId,
    timestamp: data.timestamp,
  });

  return createHmac('sha256', process.env.ADMIN_SECRET || 'test-secret').update(payload).digest('hex');
}

/**
 * Helper function to create test request
 */
function createTestRequest(body: any, method = 'POST'): NextRequest {
  return new NextRequest('http://localhost:3000/api/inventory/sync', {
    method,
    body: JSON.stringify(body),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

describe('Inventory Sync API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default mocks
    mockPrismaClient.user.findUnique.mockResolvedValue({
      role: 'ADMIN',
    });
    
    mockPrismaClient.variant.findUnique.mockResolvedValue({
      id: 'variant-1',
      productId: 'product-1',
      inventory: { id: 'inventory-1' },
    });
    
    mockPrismaClient.inventory.upsert.mockResolvedValue({
      id: 'inventory-1',
      qtyAvailable: 50,
      lowStockThreshold: 5,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/inventory/sync', () => {
    it('should return API documentation', async () => {
      const request = createTestRequest({}, 'GET');
      const response = await GET();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('Inventory Sync API');
      expect(data.version).toBe('1.0.0');
      expect(data.endpoints.POST).toBeDefined();
    });
  });

  describe('POST /api/inventory/sync', () => {
    const validPayload = {
      updates: [
        {
          variantId: 'variant-1',
          qtyAvailable: 50,
          lowStockThreshold: 5,
        },
      ],
      adminUserId: 'admin-123',
      timestamp: Date.now(),
    };

    it('should successfully update inventory with valid request', async () => {
      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(1);
      expect(data.failed).toBe(0);
      
      expect(mockPrismaClient.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'admin-123' },
        select: { role: true },
      });
      
      expect(mockPrismaClient.inventory.upsert).toHaveBeenCalledWith({
        where: { variantId: 'variant-1' },
        update: {
          qtyAvailable: 50,
          lowStockThreshold: 5,
          updatedAt: expect.any(Date),
        },
        create: {
          variantId: 'variant-1',
          qtyAvailable: 50,
          lowStockThreshold: 5,
        },
        select: {
          id: true,
          qtyAvailable: true,
          lowStockThreshold: true,
        },
      });
    });

    it('should reject request with invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/inventory/sync', {
        method: 'POST',
        body: 'invalid json',
        headers: { 'Content-Type': 'application/json' },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid JSON body');
    });

    it('should reject request with missing required fields', async () => {
      const invalidPayload = {
        updates: [{ variantId: 'variant-1' }], // Missing required fields
        adminUserId: 'admin-123',
      };

      const request = createTestRequest(invalidPayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details).toBeDefined();
      expect(Array.isArray(data.details)).toBe(true);
    });

    it('should reject request with invalid signature', async () => {
      const payload = {
        ...validPayload,
        signature: 'invalid-signature',
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Invalid signature');
    });

    it('should reject request from non-admin user', async () => {
      mockPrismaClient.user.findUnique.mockResolvedValue({
        role: 'CUSTOMER',
      });

      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(403);
      expect(data.error).toBe('Invalid admin user or insufficient permissions');
    });

    it('should reject request with expired timestamp', async () => {
      const expiredPayload = {
        ...validPayload,
        timestamp: Date.now() - 600000, // 10 minutes ago
      };

      const payload = {
        ...expiredPayload,
        signature: createTestSignature(expiredPayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should reject request with future timestamp', async () => {
      const futurePayload = {
        ...validPayload,
        timestamp: Date.now() + 120000, // 2 minutes in future
      };

      const payload = {
        ...futurePayload,
        signature: createTestSignature(futurePayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
    });

    it('should handle non-existent variant gracefully', async () => {
      mockPrismaClient.variant.findUnique.mockResolvedValue(null);

      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(0);
      expect(data.failed).toBe(1);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toBe('Variant not found');
    });

    it('should handle multiple updates correctly', async () => {
      const multiPayload = {
        updates: [
          {
            variantId: 'variant-1',
            qtyAvailable: 50,
            lowStockThreshold: 5,
          },
          {
            variantId: 'variant-2',
            qtyAvailable: 25,
            lowStockThreshold: 3,
          },
        ],
        adminUserId: 'admin-123',
        timestamp: Date.now(),
      };

      const payload = {
        ...multiPayload,
        signature: createTestSignature(multiPayload),
      };

      // Mock different variants
      mockPrismaClient.variant.findUnique
        .mockResolvedValueOnce({
          id: 'variant-1',
          productId: 'product-1',
          inventory: { id: 'inventory-1' },
        })
        .mockResolvedValueOnce({
          id: 'variant-2',
          productId: 'product-2',
          inventory: { id: 'inventory-2' },
        });

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.updated).toBe(2);
      expect(data.failed).toBe(0);
      expect(mockPrismaClient.inventory.upsert).toHaveBeenCalledTimes(2);
    });

    it('should enforce rate limiting', async () => {
      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      // Make multiple requests rapidly
      const requests = Array.from({ length: 35 }, () => createTestRequest(payload));
      const responses = await Promise.all(requests.map(req => POST(req)));

      // Some requests should be rate limited
      const rateLimitedResponses = responses.filter(res => res.status === 429);
      expect(rateLimitedResponses.length).toBeGreaterThan(0);
    });

    it('should validate inventory constraints', async () => {
      const invalidPayload = {
        updates: [
          {
            variantId: 'variant-1',
            qtyAvailable: -5, // Invalid negative quantity
            lowStockThreshold: 5,
          },
        ],
        adminUserId: 'admin-123',
        timestamp: Date.now(),
      };

      const request = createTestRequest(invalidPayload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Validation failed');
      expect(data.details.some((d: any) => d.field.includes('qtyAvailable'))).toBe(true);
    });

    it('should handle database errors gracefully', async () => {
      mockPrismaClient.inventory.upsert.mockRejectedValue(new Error('Database connection failed'));

      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.failed).toBe(1);
      expect(data.results[0].success).toBe(false);
      expect(data.results[0].error).toContain('Database connection failed');
    });

    it('should create correct signature for sorted updates', async () => {
      const unsortedPayload = {
        updates: [
          { variantId: 'variant-z', qtyAvailable: 10, lowStockThreshold: 2 },
          { variantId: 'variant-a', qtyAvailable: 20, lowStockThreshold: 3 },
          { variantId: 'variant-m', qtyAvailable: 30, lowStockThreshold: 4 },
        ],
        adminUserId: 'admin-123',
        timestamp: Date.now(),
      };

      const signature1 = createTestSignature(unsortedPayload);
      
      // Create same payload with different order
      const reorderedPayload = {
        ...unsortedPayload,
        updates: [
          { variantId: 'variant-a', qtyAvailable: 20, lowStockThreshold: 3 },
          { variantId: 'variant-z', qtyAvailable: 10, lowStockThreshold: 2 },
          { variantId: 'variant-m', qtyAvailable: 30, lowStockThreshold: 4 },
        ],
      };

      const signature2 = createTestSignature(reorderedPayload);

      // Signatures should be identical regardless of order
      expect(signature1).toBe(signature2);
    });
  });

  describe('Error handling', () => {
    it('should handle unexpected errors', async () => {
      mockPrismaClient.user.findUnique.mockRejectedValue(new Error('Unexpected error'));

      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      const request = createTestRequest(payload);
      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Internal server error');
    });

    it('should always disconnect from Prisma', async () => {
      const payload = {
        ...validPayload,
        signature: createTestSignature(validPayload),
      };

      const request = createTestRequest(payload);
      await POST(request);

      expect(mockPrismaClient.$disconnect).toHaveBeenCalled();
    });
  });
});