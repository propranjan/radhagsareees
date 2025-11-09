import { describe, it, expect, beforeEach, afterEach, vi, MockedFunction } from 'vitest';
import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import * as checkoutValidations from '../../../../../lib/checkout-validations';
import * as razorpayUtils from '../../../../../lib/razorpay-utils';
import { prisma } from '@radhagsareees/db';

// Mock dependencies
vi.mock('@radhagsareees/db', () => ({
  prisma: {
    $transaction: vi.fn(),
    order: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    inventory: {
      update: vi.fn(),
    },
    payment: {
      create: vi.fn(),
    },
  },
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
}));

vi.mock('../../../../../lib/checkout-validations');
vi.mock('../../../../../lib/razorpay-utils');

// Test data
const mockSuccessfulWebhookPayload = {
  event: 'payment.captured',
  payload: {
    payment: {
      entity: {
        id: 'pay_abc123def456',
        order_id: 'order_xyz789',
        amount: 799700, // ₹7997 in paise
        currency: 'INR',
        method: 'card',
        status: 'captured',
        captured: true,
        created_at: 1640995200,
      },
    },
  },
};

const mockFailedWebhookPayload = {
  event: 'payment.failed',
  payload: {
    payment: {
      entity: {
        id: 'pay_failed123',
        order_id: 'order_xyz789',
        amount: 799700,
        currency: 'INR',
        method: 'card',
        status: 'failed',
        captured: false,
        error_code: 'GATEWAY_ERROR',
        error_description: 'Payment failed at gateway',
        created_at: 1640995200,
      },
    },
  },
};

const mockOrder = {
  id: 'order_draft_1',
  userId: 'user_123',
  amount: 7997.00,
  status: 'PENDING' as const,
  paymentRef: 'order_xyz789',
  orderItems: [
    {
      id: 'item_1',
      variantId: 'variant_1',
      productId: 'product_1',
      quantity: 2,
      price: 2999.00,
      variant: {
        id: 'variant_1',
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
    },
    {
      id: 'item_2',
      variantId: 'variant_2',
      productId: 'product_2',
      quantity: 1,
      price: 1999.00,
      variant: {
        id: 'variant_2',
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
    },
  ],
};

const mockUpdatedOrder = {
  ...mockOrder,
  status: 'CONFIRMED' as const,
  updatedAt: new Date(),
};

describe('POST /api/razorpay/webhook', () => {
  let mockPrismaTransaction: MockedFunction<any>;
  let mockVerifyRazorpayWebhook: MockedFunction<any>;
  let mockRazorpayWebhookSchema: MockedFunction<any>;
  let mockValidatePaymentAmount: MockedFunction<any>;
  let mockEmitLowStockEvent: MockedFunction<any>;
  let mockGetPaymentMethodName: MockedFunction<any>;
  let mockIsValidRazorpayOrderId: MockedFunction<any>;
  let mockIsValidRazorpayPaymentId: MockedFunction<any>;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup prisma mocks
    mockPrismaTransaction = vi.mocked(prisma.$transaction);
    
    // Setup Razorpay utility mocks
    mockVerifyRazorpayWebhook = vi.mocked(razorpayUtils.verifyRazorpayWebhook);
    mockValidatePaymentAmount = vi.mocked(razorpayUtils.validatePaymentAmount);
    mockEmitLowStockEvent = vi.mocked(razorpayUtils.emitLowStockEvent);
    mockGetPaymentMethodName = vi.mocked(razorpayUtils.getPaymentMethodName);
    mockIsValidRazorpayOrderId = vi.mocked(razorpayUtils.isValidRazorpayOrderId);
    mockIsValidRazorpayPaymentId = vi.mocked(razorpayUtils.isValidRazorpayPaymentId);
    
    // Setup validation mocks
    mockRazorpayWebhookSchema = vi.mocked(checkoutValidations.razorpayWebhookSchema);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('Successful payment processing', () => {
    it('should process payment.captured event successfully', async () => {
      const webhookSignature = 'valid_signature_123';
      
      // Setup mocks for success case
      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockSuccessfulWebhookPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);
      mockValidatePaymentAmount.mockReturnValue(true);
      mockGetPaymentMethodName.mockReturnValue('Card');
      mockEmitLowStockEvent.mockResolvedValue(undefined);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(mockOrder),
            update: vi.fn().mockResolvedValue(mockUpdatedOrder),
          },
          inventory: {
            update: vi.fn().mockResolvedValue({ qtyAvailable: 8 }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment_1',
              orderId: mockOrder.id,
              status: 'COMPLETED',
            }),
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': webhookSignature,
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Payment processed successfully');
      expect(responseData.orderId).toBe(mockOrder.id);

      // Verify function calls
      expect(mockVerifyRazorpayWebhook).toHaveBeenCalledWith(
        JSON.stringify(mockSuccessfulWebhookPayload),
        webhookSignature
      );
      expect(mockPrismaTransaction).toHaveBeenCalled();
      expect(mockValidatePaymentAmount).toHaveBeenCalledWith(799700, 799700);
    });

    it('should emit low stock events when stock falls below threshold', async () => {
      const webhookSignature = 'valid_signature_123';
      
      // Order that will trigger low stock
      const lowStockOrder = {
        ...mockOrder,
        orderItems: [
          {
            ...mockOrder.orderItems[0],
            quantity: 8, // This will leave 2 items, below threshold of 5
          },
          {
            ...mockOrder.orderItems[1],
            quantity: 2, // This will leave 1 item, below threshold of 2
          },
        ],
      };

      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockSuccessfulWebhookPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);
      mockValidatePaymentAmount.mockReturnValue(true);
      mockGetPaymentMethodName.mockReturnValue('Card');
      mockEmitLowStockEvent.mockResolvedValue(undefined);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(lowStockOrder),
            update: vi.fn().mockResolvedValue({
              ...lowStockOrder,
              status: 'CONFIRMED',
            }),
          },
          inventory: {
            update: vi.fn()
              .mockResolvedValueOnce({ qtyAvailable: 2 })
              .mockResolvedValueOnce({ qtyAvailable: 1 }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment_1',
              orderId: lowStockOrder.id,
              status: 'COMPLETED',
            }),
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': webhookSignature,
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Verify low stock events were emitted
      expect(mockEmitLowStockEvent).toHaveBeenCalledTimes(2);
      expect(mockEmitLowStockEvent).toHaveBeenCalledWith({
        variantId: 'variant_1',
        productId: 'product_1',
        currentStock: 2,
        threshold: 5,
        productTitle: 'Red Silk Saree',
        variantSku: 'RED-SAREE-001-M',
        timestamp: expect.any(Number),
      });
      expect(mockEmitLowStockEvent).toHaveBeenCalledWith({
        variantId: 'variant_2',
        productId: 'product_2',
        currentStock: 1,
        threshold: 2,
        productTitle: 'Blue Designer Blouse',
        variantSku: 'BLUE-BLOUSE-002-L',
        timestamp: expect.any(Number),
      });
    });

    it('should handle payment.authorized event', async () => {
      const authorizedPayload = {
        ...mockSuccessfulWebhookPayload,
        event: 'payment.authorized',
        payload: {
          payment: {
            entity: {
              ...mockSuccessfulWebhookPayload.payload.payment.entity,
              status: 'authorized',
              captured: false,
            },
          },
        },
      };

      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(authorizedPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);
      mockValidatePaymentAmount.mockReturnValue(true);
      mockGetPaymentMethodName.mockReturnValue('Card');
      mockEmitLowStockEvent.mockResolvedValue(undefined);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(mockOrder),
            update: vi.fn().mockResolvedValue(mockUpdatedOrder),
          },
          inventory: {
            update: vi.fn().mockResolvedValue({ qtyAvailable: 8 }),
          },
          payment: {
            create: vi.fn().mockResolvedValue({
              id: 'payment_1',
              orderId: mockOrder.id,
              status: 'COMPLETED',
            }),
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(authorizedPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Payment processed successfully');
    });
  });

  describe('Failed payment processing', () => {
    it('should process payment.failed event correctly', async () => {
      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockFailedWebhookPayload);
      mockGetPaymentMethodName.mockReturnValue('Card');

      const mockFailedOrder = {
        id: 'order_draft_1',
        userId: 'user_123',
        amount: 7997.00,
        status: 'PENDING' as const,
        paymentRef: 'order_xyz789',
      };

      // Mock Prisma operations for failed payment
      prisma.order.findFirst = vi.fn().mockResolvedValue(mockFailedOrder);
      prisma.order.update = vi.fn().mockResolvedValue({
        ...mockFailedOrder,
        status: 'CANCELLED',
      });
      prisma.payment.create = vi.fn().mockResolvedValue({
        id: 'payment_failed_1',
        orderId: mockFailedOrder.id,
        status: 'FAILED',
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockFailedWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Payment failure processed');
      expect(responseData.orderId).toBe(mockFailedOrder.id);

      // Verify order was cancelled
      expect(prisma.order.update).toHaveBeenCalledWith({
        where: { id: mockFailedOrder.id },
        data: {
          status: 'CANCELLED',
          updatedAt: expect.any(Date),
        },
      });

      // Verify failed payment record was created
      expect(prisma.payment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: mockFailedOrder.id,
          status: 'FAILED',
          method: 'Card',
          gatewayResponse: expect.objectContaining({
            errorCode: 'GATEWAY_ERROR',
            errorDescription: 'Payment failed at gateway',
          }),
        }),
      });
    });
  });

  describe('Webhook security and validation', () => {
    it('should reject webhook with missing signature', async () => {
      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Missing signature');
      expect(mockVerifyRazorpayWebhook).not.toHaveBeenCalled();
    });

    it('should reject webhook with invalid signature', async () => {
      mockVerifyRazorpayWebhook.mockReturnValue(false);

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'invalid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(401);
      expect(responseData.error).toBe('Invalid signature');
      expect(mockVerifyRazorpayWebhook).toHaveBeenCalled();
    });

    it('should reject webhook with malformed payload', async () => {
      mockVerifyRazorpayWebhook.mockReturnValue(true);

      const invalidPayload = '{ invalid json';

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: invalidPayload,
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid payload format');
    });

    it('should reject webhook with invalid payload structure', async () => {
      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockImplementation(() => {
        throw new Error('Invalid schema');
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify({ invalid: 'structure' }),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(400);
      expect(responseData.error).toBe('Invalid payload format');
    });
  });

  describe('Business logic validation', () => {
    it('should reject webhook for non-existent order', async () => {
      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockSuccessfulWebhookPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(null), // Order not found
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Order not found');
    });

    it('should reject webhook with amount mismatch', async () => {
      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockSuccessfulWebhookPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);
      mockValidatePaymentAmount.mockReturnValue(false); // Amount mismatch

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(mockOrder),
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Payment amount mismatch');
    });

    it('should handle insufficient stock during webhook processing', async () => {
      const orderWithHighQuantity = {
        ...mockOrder,
        orderItems: [
          {
            ...mockOrder.orderItems[0],
            quantity: 15, // More than available (10)
          },
        ],
      };

      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockSuccessfulWebhookPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);
      mockValidatePaymentAmount.mockReturnValue(true);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(orderWithHighQuantity),
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(false);
      expect(responseData.message).toContain('Insufficient stock');
    });

    it('should skip processing for already processed orders', async () => {
      const alreadyProcessedOrder = {
        ...mockOrder,
        status: 'CONFIRMED' as const,
      };

      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(mockSuccessfulWebhookPayload);
      mockIsValidRazorpayOrderId.mockReturnValue(true);
      mockIsValidRazorpayPaymentId.mockReturnValue(true);

      mockPrismaTransaction.mockImplementation(async (callback) => {
        const mockTx = {
          order: {
            findFirst: vi.fn().mockResolvedValue(alreadyProcessedOrder),
          },
        };
        return await callback(mockTx);
      });

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(mockSuccessfulWebhookPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      
      // Should not attempt inventory updates
      expect(mockPrismaTransaction).toHaveBeenCalled();
    });
  });

  describe('Unhandled webhook events', () => {
    it('should acknowledge but not process unhandled events', async () => {
      const unhandledPayload = {
        event: 'refund.processed',
        payload: {
          refund: {
            entity: {
              id: 'rfnd_123',
              amount: 100000,
            },
          },
        },
      };

      mockVerifyRazorpayWebhook.mockReturnValue(true);
      mockRazorpayWebhookSchema.parse.mockReturnValue(unhandledPayload);

      const request = new NextRequest('http://localhost:3000/api/razorpay/webhook', {
        method: 'POST',
        headers: {
          'x-razorpay-signature': 'valid_signature',
          'content-type': 'application/json',
        },
        body: JSON.stringify(unhandledPayload),
      });

      const response = await POST(request);
      const responseData = await response.json();

      expect(response.status).toBe(200);
      expect(responseData.success).toBe(true);
      expect(responseData.message).toBe('Event received but not processed');
    });
  });
});

describe('GET /api/razorpay/webhook', () => {
  it('should return webhook documentation', async () => {
    const response = await GET();
    const responseData = await response.json();

    expect(response.status).toBe(200);
    expect(responseData.message).toBe('Razorpay Webhook Handler');
    expect(responseData.version).toBe('1.0.0');
    expect(responseData.supportedEvents).toBeDefined();
    expect(responseData.security).toBeDefined();
    expect(responseData.processing).toBeDefined();
  });
});