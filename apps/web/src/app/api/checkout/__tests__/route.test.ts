import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { POST } from '../route';
import * as checkoutValidations from '../../../../lib/checkout-validations';
import * as razorpayUtils from '../../../../lib/razorpay-utils';
import { prisma } from '@radhagsareees/db';

// Mock dependencies
vi.mock('@radhagsareees/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    variant: {
      findMany: vi.fn(),
    },
    order: {
      create: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('../../../../lib/checkout-validations');
vi.mock('../../../../lib/razorpay-utils');

// Test data
const mockCartItems = [
  {
    variantId: 'variant_1',
    quantity: 2,
  },
  {
    variantId: 'variant_2',
    quantity: 1,
  },
];

const mockVariantsWithInventory = [
  {
    id: 'variant_1',
    price: 2999.00,
    sku: 'RED-SAREE-001-M',
    inventory: {
      qtyAvailable: 10,
      lowStockThreshold: 5,
    },
    product: {
      id: 'product_1',
      title: 'Red Silk Saree',
    },
  },
  {
    id: 'variant_2',
    price: 1999.00,
    sku: 'BLUE-BLOUSE-002-L',
    inventory: {
      qtyAvailable: 3,
      lowStockThreshold: 2,
    },
    product: {
      id: 'product_2',
      title: 'Blue Designer Blouse',
    },
  },
];

const mockCheckoutRequest = {
  cartItems: mockCartItems,
  userId: 'user_123',
  shippingAddress: {
    street: '123 Test Street',
    city: 'Mumbai',
    state: 'Maharashtra',
    pincode: '400001',
    country: 'India',
  },
  paymentMethod: 'razorpay',
};

const mockRazorpayOrder = {
  id: 'order_abc123',
  amount: 799700, // in paise
  currency: 'INR',
  status: 'created',
};

const mockDraftOrder = {
  id: 'order_draft_1',
  userId: 'user_123',
  amount: 7997.00,
  status: 'PENDING' as const,
  paymentRef: 'order_abc123',
  items: mockCartItems,
};

describe('POST /api/checkout', () => {
  let mockPrismaTransaction: MockedFunction<any>;
  let mockValidateCartRequest: MockedFunction<any>;
  let mockValidateCartAndStock: MockedFunction<any>;
  let mockCreateRazorpayOrder: MockedFunction<any>;
  let mockCalculateOrderTotals: MockedFunction<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup prisma mocks
    mockPrismaTransaction = vi.mocked(prisma.$transaction);
    
    // Setup validation mocks
    mockValidateCartRequest = vi.mocked(checkoutValidations.validateCartRequest);
    mockValidateCartAndStock = vi.mocked(checkoutValidations.validateCartAndStock);
    
    // Setup Razorpay mocks
    mockCreateRazorpayOrder = vi.mocked(razorpayUtils.createRazorpayOrder);
    mockCalculateOrderTotals = vi.mocked(razorpayUtils.calculateOrderTotals);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Successful checkout flow', () => {
    it('should process checkout request successfully', async () => {
      // Setup mocks for success case
      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      mockPrismaTransaction.mockImplementation(async (callback) => {
        // Mock the transaction callback
        const mockTx = {
          variant: {
            findMany: vi.fn().mockResolvedValue(mockVariantsWithInventory),
          },
          order: {
            create: vi.fn().mockResolvedValue(mockDraftOrder),
          },
        };
        return await callback(mockTx);
      });

      mockValidateCartAndStock.mockReturnValue({
        valid: true,
        errors: [],
        stockValidation: mockVariantsWithInventory.map((variant, index) => ({
          variantId: variant.id,
          requestedQty: mockCartItems[index].quantity,
          availableQty: variant.inventory.qtyAvailable,
          isAvailable: true,
          price: variant.price,
        })),
      });

      mockCalculateOrderTotals.mockReturnValue({
        subtotal: 7997.00,
        shipping: 0.00,
        tax: 0.00,
        total: 7997.00,
      });

      mockCreateRazorpayOrder.mockResolvedValue(mockRazorpayOrder);

      // Create request
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockCheckoutRequest),
      });

      // Execute
      const response = await POST(request);
      const responseData = await response.json();

      // Assertions
      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.orderId).toBe(mockDraftOrder.id);
      expect(responseData.razorpayOrderId).toBe(mockRazorpayOrder.id);
      expect(responseData.amount).toBe(7997.00);

      // Verify function calls
      expect(mockValidateCartRequest).toHaveBeenCalledWith(mockCheckoutRequest);
      expect(mockPrismaTransaction).toHaveBeenCalled();
      expect(mockCreateRazorpayOrder).toHaveBeenCalledWith({
        amount: 7997.00,
        currency: 'INR',
        receipt: mockDraftOrder.id,
        notes: {
          orderId: mockDraftOrder.id,
          userId: mockCheckoutRequest.userId,
        },
      });
    });

    it('should handle checkout with exact stock availability', async () => {
      const exactStockVariants = mockVariantsWithInventory.map(variant => ({
        ...variant,
        inventory: {
          ...variant.inventory,
          qtyAvailable: mockCartItems.find(item => item.variantId === variant.id)?.quantity || 0,
        },
      }));

      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          variant: {
            findMany: vi.fn().mockResolvedValue(exactStockVariants),
          },
          order: {
            create: vi.fn().mockResolvedValue(mockDraftOrder),
          },
        };
        return await callback(mockTx);
      });

      mockValidateCartAndStock.mockReturnValue({
        valid: true,
        errors: [],
        stockValidation: exactStockVariants.map((variant, index) => ({
          variantId: variant.id,
          requestedQty: mockCartItems[index].quantity,
          availableQty: variant.inventory.qtyAvailable,
          isAvailable: true,
          price: variant.price,
        })),
      });

      mockCalculateOrderTotals.mockReturnValue({
        subtotal: 7997.00,
        shipping: 0.00,
        tax: 0.00,
        total: 7997.00,
      });

      mockCreateRazorpayOrder.mockResolvedValue(mockRazorpayOrder);

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(mockValidateCartAndStock).toHaveBeenCalled();
    });
  });

  describe('Insufficient stock scenarios', () => {
    it('should reject checkout when stock is insufficient', async () => {
      const insufficientStockVariants = mockVariantsWithInventory.map(variant => ({
        ...variant,
        inventory: {
          ...variant.inventory,
          qtyAvailable: 0, // No stock available
        },
      }));

      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          variant: {
            findMany: vi.fn().mockResolvedValue(insufficientStockVariants),
          },
        };
        return await callback(mockTx);
      });

      mockValidateCartAndStock.mockReturnValue({
        valid: false,
        errors: [
          'Insufficient stock for variant RED-SAREE-001-M. Available: 0, Requested: 2',
          'Insufficient stock for variant BLUE-BLOUSE-002-L. Available: 0, Requested: 1',
        ],
        stockValidation: insufficientStockVariants.map((variant, index) => ({
          variantId: variant.id,
          requestedQty: mockCartItems[index].quantity,
          availableQty: variant.inventory.qtyAvailable,
          isAvailable: false,
          price: variant.price,
        })),
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Stock validation failed');
      expect(responseData.details).toEqual([
        'Insufficient stock for variant RED-SAREE-001-M. Available: 0, Requested: 2',
        'Insufficient stock for variant BLUE-BLOUSE-002-L. Available: 0, Requested: 1',
      ]);
      
      // Should not create Razorpay order
      expect(mockCreateRazorpayOrder).not.toHaveBeenCalled();
    });

    it('should reject checkout for partial stock availability', async () => {
      const partialStockVariants = [
        {
          ...mockVariantsWithInventory[0],
          inventory: {
            ...mockVariantsWithInventory[0].inventory,
            qtyAvailable: 1, // Less than requested (2)
          },
        },
        mockVariantsWithInventory[1], // This one has enough stock
      ];

      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          variant: {
            findMany: vi.fn().mockResolvedValue(partialStockVariants),
          },
        };
        return await callback(mockTx);
      });

      mockValidateCartAndStock.mockReturnValue({
        valid: false,
        errors: [
          'Insufficient stock for variant RED-SAREE-001-M. Available: 1, Requested: 2',
        ],
        stockValidation: [
          {
            variantId: 'variant_1',
            requestedQty: 2,
            availableQty: 1,
            isAvailable: false,
            price: 2999.00,
          },
          {
            variantId: 'variant_2',
            requestedQty: 1,
            availableQty: 3,
            isAvailable: true,
            price: 1999.00,
          },
        ],
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Stock validation failed');
      expect(responseData.details).toContain(
        'Insufficient stock for variant RED-SAREE-001-M. Available: 1, Requested: 2'
      );
    });
  });

  describe('Validation errors', () => {
    it('should reject invalid request body', async () => {
      mockValidateCartRequest.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['cartItems'], message: 'Cart items are required' },
            { path: ['userId'], message: 'User ID is required' },
          ],
        },
      });

      const invalidRequest = { invalid: 'data' };

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid request data');
      expect(responseData.details).toBeDefined();
    });

    it('should reject empty cart', async () => {
      const emptyCartRequest = {
        ...mockCheckoutRequest,
        cartItems: [],
      };

      mockValidateCartRequest.mockReturnValue({
        success: false,
        error: {
          issues: [
            { path: ['cartItems'], message: 'Cart must contain at least one item' },
          ],
        },
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(emptyCartRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid request data');
    });
  });

  describe('Razorpay integration errors', () => {
    it('should handle Razorpay order creation failure', async () => {
      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          variant: {
            findMany: vi.fn().mockResolvedValue(mockVariantsWithInventory),
          },
          order: {
            create: vi.fn().mockResolvedValue(mockDraftOrder),
          },
        };
        return await callback(mockTx);
      });

      mockValidateCartAndStock.mockReturnValue({
        valid: true,
        errors: [],
        stockValidation: mockVariantsWithInventory.map((variant, index) => ({
          variantId: variant.id,
          requestedQty: mockCartItems[index].quantity,
          availableQty: variant.inventory.qtyAvailable,
          isAvailable: true,
          price: variant.price,
        })),
      });

      mockCalculateOrderTotals.mockReturnValue({
        subtotal: 7997.00,
        shipping: 0.00,
        tax: 0.00,
        total: 7997.00,
      });

      // Mock Razorpay failure
      mockCreateRazorpayOrder.mockRejectedValue(new Error('Razorpay API error'));

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Payment gateway error');
    });
  });

  describe('Database errors', () => {
    it('should handle database transaction failure', async () => {
      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      // Mock database transaction failure
      mockPrismaTransaction.mockRejectedValue(new Error('Database connection failed'));

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(500);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Internal server error');
    });
  });

  describe('Edge cases', () => {
    it('should handle malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: '{ invalid json',
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Invalid JSON in request body');
    });

    it('should handle missing content-type header', async () => {
      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      
      // Should still process if body is valid JSON
      expect(mockValidateCartRequest).toHaveBeenCalled();
    });

    it('should handle variants that no longer exist', async () => {
      mockValidateCartRequest.mockReturnValue({ success: true, data: mockCheckoutRequest });
      
      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          variant: {
            findMany: vi.fn().mockResolvedValue([]), // No variants found
          },
        };
        return await callback(mockTx);
      });

      mockValidateCartAndStock.mockReturnValue({
        valid: false,
        errors: [
          'Variant variant_1 not found',
          'Variant variant_2 not found',
        ],
        stockValidation: [],
      });

      const request = new NextRequest('http://localhost:3000/api/checkout', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(mockCheckoutRequest),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.success).toBe(false);
      expect(responseData.error).toBe('Stock validation failed');
    });
  });
});