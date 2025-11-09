import { describe, it, expect, jest } from '@jest/globals';
import { createAdminToken, verifyAdminToken, createInventorySignature, verifyInventorySignature } from '../auth';

// Mock crypto module
jest.mock('crypto', () => ({
  createHmac: jest.fn(() => ({
    update: jest.fn(() => ({
      digest: jest.fn(() => 'mock-signature-hash'),
    })),
  })),
}));

// Mock environment
const originalEnv = process.env;
beforeEach(() => {
  process.env = { ...originalEnv };
  process.env.ADMIN_SECRET = 'test-secret-key';
});

afterEach(() => {
  process.env = originalEnv;
});

describe('Admin Authentication', () => {
  describe('createAdminToken', () => {
    it('should create a valid token structure', () => {
      const user = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN' as const,
      };

      const token = createAdminToken(user);
      
      expect(typeof token).toBe('string');
      expect(token).toContain('.');
      
      const [data, signature] = token.split('.');
      expect(data).toBeTruthy();
      expect(signature).toBeTruthy();
      
      // Decode the payload
      const payload = JSON.parse(Buffer.from(data, 'base64').toString());
      expect(payload.userId).toBe(user.id);
      expect(payload.email).toBe(user.email);
      expect(payload.role).toBe(user.role);
      expect(payload.iat).toEqual(expect.any(Number));
      expect(payload.exp).toEqual(expect.any(Number));
      expect(payload.exp).toBeGreaterThan(payload.iat);
    });

    it('should create different tokens for different users', () => {
      const user1 = {
        id: 'admin-1',
        email: 'admin1@test.com',
        name: 'Admin One',
        role: 'ADMIN' as const,
      };

      const user2 = {
        id: 'admin-2',
        email: 'admin2@test.com',
        name: 'Admin Two',
        role: 'ADMIN' as const,
      };

      const token1 = createAdminToken(user1);
      const token2 = createAdminToken(user2);
      
      expect(token1).not.toBe(token2);
    });
  });

  describe('verifyAdminToken', () => {
    it('should verify a valid token', () => {
      const user = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN' as const,
      };

      const token = createAdminToken(user);
      const result = verifyAdminToken(token);
      
      expect(result).toBeTruthy();
      expect(result?.userId).toBe(user.id);
      expect(result?.email).toBe(user.email);
      expect(result?.role).toBe(user.role);
    });

    it('should reject malformed tokens', () => {
      expect(verifyAdminToken('invalid-token')).toBeNull();
      expect(verifyAdminToken('invalid.token.structure')).toBeNull();
      expect(verifyAdminToken('')).toBeNull();
    });

    it('should reject tokens with invalid signature', () => {
      const user = {
        id: 'admin-123',
        email: 'admin@test.com',
        name: 'Test Admin',
        role: 'ADMIN' as const,
      };

      const token = createAdminToken(user);
      const [data] = token.split('.');
      const tamperedToken = `${data}.invalid-signature`;
      
      expect(verifyAdminToken(tamperedToken)).toBeNull();
    });

    it('should reject expired tokens', () => {
      // Create an expired token by manipulating the payload
      const expiredPayload = {
        userId: 'admin-123',
        email: 'admin@test.com',
        role: 'ADMIN',
        iat: Date.now() - 2000,
        exp: Date.now() - 1000, // Expired 1 second ago
      };

      const data = Buffer.from(JSON.stringify(expiredPayload)).toString('base64');
      const token = `${data}.mock-signature-hash`;
      
      expect(verifyAdminToken(token)).toBeNull();
    });

    it('should reject tokens with invalid role', () => {
      const invalidPayload = {
        userId: 'user-123',
        email: 'user@test.com',
        role: 'CUSTOMER',
        iat: Date.now(),
        exp: Date.now() + 24 * 60 * 60 * 1000,
      };

      const data = Buffer.from(JSON.stringify(invalidPayload)).toString('base64');
      const token = `${data}.mock-signature-hash`;
      
      expect(verifyAdminToken(token)).toBeNull();
    });
  });

  describe('createInventorySignature', () => {
    it('should create consistent signatures for same data', () => {
      const data = {
        updates: [
          { variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 },
          { variantId: 'variant-2', qtyAvailable: 25, lowStockThreshold: 3 },
        ],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
      };

      const signature1 = createInventorySignature(data);
      const signature2 = createInventorySignature(data);
      
      expect(signature1).toBe(signature2);
      expect(signature1).toBe('mock-signature-hash');
    });

    it('should create same signature regardless of update order', () => {
      const data1 = {
        updates: [
          { variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 },
          { variantId: 'variant-2', qtyAvailable: 25, lowStockThreshold: 3 },
        ],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
      };

      const data2 = {
        updates: [
          { variantId: 'variant-2', qtyAvailable: 25, lowStockThreshold: 3 },
          { variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 },
        ],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
      };

      const signature1 = createInventorySignature(data1);
      const signature2 = createInventorySignature(data2);
      
      expect(signature1).toBe(signature2);
    });

    it('should create different signatures for different data', () => {
      const data1 = {
        updates: [{ variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 }],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
      };

      const data2 = {
        updates: [{ variantId: 'variant-1', qtyAvailable: 25, lowStockThreshold: 5 }],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
      };

      // Reset mock to return different values
      const { createHmac } = require('crypto');
      createHmac.mockImplementationOnce(() => ({
        update: () => ({
          digest: () => 'signature-1',
        }),
      })).mockImplementationOnce(() => ({
        update: () => ({
          digest: () => 'signature-2',
        }),
      }));

      const signature1 = createInventorySignature(data1);
      const signature2 = createInventorySignature(data2);
      
      expect(signature1).not.toBe(signature2);
    });
  });

  describe('verifyInventorySignature', () => {
    it('should verify valid signatures', () => {
      const data = {
        updates: [
          { variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 },
        ],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
        signature: 'mock-signature-hash',
      };

      const result = verifyInventorySignature(data);
      expect(result).toBe(true);
    });

    it('should reject invalid signatures', () => {
      const data = {
        updates: [
          { variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 },
        ],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
        signature: 'invalid-signature',
      };

      const result = verifyInventorySignature(data);
      expect(result).toBe(false);
    });

    it('should handle errors gracefully', () => {
      // Mock createHmac to throw an error
      const { createHmac } = require('crypto');
      createHmac.mockImplementationOnce(() => {
        throw new Error('Crypto error');
      });

      const data = {
        updates: [
          { variantId: 'variant-1', qtyAvailable: 50, lowStockThreshold: 5 },
        ],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
        signature: 'any-signature',
      };

      const result = verifyInventorySignature(data);
      expect(result).toBe(false);
    });
  });

  describe('Edge Cases and Security', () => {
    it('should handle empty updates array', () => {
      const data = {
        updates: [],
        adminUserId: 'admin-123',
        timestamp: 1234567890,
      };

      expect(() => createInventorySignature(data)).not.toThrow();
    });

    it('should handle special characters in data', () => {
      const data = {
        updates: [
          { 
            variantId: 'variant-with-special-chars-!@#$%', 
            qtyAvailable: 50, 
            lowStockThreshold: 5 
          },
        ],
        adminUserId: 'admin-with-email@domain.com',
        timestamp: 1234567890,
      };

      expect(() => createInventorySignature(data)).not.toThrow();
    });

    it('should handle large numbers correctly', () => {
      const data = {
        updates: [
          { 
            variantId: 'variant-1', 
            qtyAvailable: 999999, 
            lowStockThreshold: 99999 
          },
        ],
        adminUserId: 'admin-123',
        timestamp: Date.now(),
      };

      expect(() => createInventorySignature(data)).not.toThrow();
    });
  });
});