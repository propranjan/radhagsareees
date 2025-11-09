import { z } from 'zod';

// Cart item validation schema
export const cartItemSchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1').max(10, 'Maximum 10 items per variant'),
});

export type CartItem = z.infer<typeof cartItemSchema>;

// Checkout request schema
export const checkoutSchema = z.object({
  items: z.array(cartItemSchema).min(1, 'At least one item required').max(20, 'Maximum 20 items per order'),
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  userId: z.string().min(1, 'User ID is required'),
  couponCode: z.string().optional(),
});

export type CheckoutRequest = z.infer<typeof checkoutSchema>;

// Razorpay order creation schema
export const razorpayOrderSchema = z.object({
  amount: z.number().min(100, 'Minimum order amount is ₹1'), // Amount in paise
  currency: z.string().default('INR'),
  receipt: z.string().min(1, 'Receipt ID required'),
  notes: z.record(z.string()).optional(),
});

export type RazorpayOrderData = z.infer<typeof razorpayOrderSchema>;

// Razorpay webhook validation schema
export const razorpayWebhookSchema = z.object({
  entity: z.literal('event'),
  account_id: z.string(),
  event: z.enum([
    'payment.authorized',
    'payment.captured',
    'payment.failed',
    'order.paid',
    'refund.created',
  ]),
  contains: z.array(z.string()),
  payload: z.object({
    payment: z.object({
      entity: z.object({
        id: z.string(),
        entity: z.literal('payment'),
        amount: z.number(),
        currency: z.string(),
        status: z.enum(['created', 'authorized', 'captured', 'refunded', 'failed']),
        order_id: z.string(),
        method: z.string(),
        amount_refunded: z.number(),
        refund_status: z.string().nullable(),
        captured: z.boolean(),
        description: z.string().nullable(),
        card_id: z.string().nullable(),
        bank: z.string().nullable(),
        wallet: z.string().nullable(),
        vpa: z.string().nullable(),
        email: z.string().nullable(),
        contact: z.string().nullable(),
        notes: z.record(z.string()),
        fee: z.number().nullable(),
        tax: z.number().nullable(),
        error_code: z.string().nullable(),
        error_description: z.string().nullable(),
        created_at: z.number(),
      }),
    }),
  }),
  created_at: z.number(),
});

export type RazorpayWebhook = z.infer<typeof razorpayWebhookSchema>;

// Order status enum
export const orderStatusSchema = z.enum([
  'DRAFT',
  'PENDING',
  'CONFIRMED',
  'PROCESSING',
  'SHIPPED',
  'DELIVERED',
  'CANCELLED',
  'REFUNDED',
]);

export type OrderStatus = z.infer<typeof orderStatusSchema>;

// Stock validation response schema
export const stockValidationSchema = z.object({
  isValid: z.boolean(),
  errors: z.array(z.object({
    variantId: z.string(),
    requested: z.number(),
    available: z.number(),
    message: z.string(),
  })),
  items: z.array(z.object({
    variantId: z.string(),
    productId: z.string(),
    quantity: z.number(),
    price: z.number(),
    total: z.number(),
    product: z.object({
      title: z.string(),
      slug: z.string(),
    }),
    variant: z.object({
      sku: z.string(),
      color: z.string(),
      size: z.string(),
    }),
  })),
  subtotal: z.number(),
  shipping: z.number(),
  tax: z.number(),
  total: z.number(),
});

export type StockValidationResult = z.infer<typeof stockValidationSchema>;

// Low stock event schema
export const lowStockEventSchema = z.object({
  variantId: z.string(),
  productId: z.string(),
  currentStock: z.number(),
  threshold: z.number(),
  productTitle: z.string(),
  variantSku: z.string(),
  timestamp: z.number(),
});

export type LowStockEvent = z.infer<typeof lowStockEventSchema>;

// Checkout session response schema
export const checkoutSessionSchema = z.object({
  success: z.boolean(),
  sessionId: z.string().optional(),
  orderId: z.string().optional(),
  razorpayOrderId: z.string().optional(),
  amount: z.number().optional(),
  currency: z.string().optional(),
  error: z.string().optional(),
  details: z.array(z.object({
    field: z.string(),
    message: z.string(),
  })).optional(),
});

export type CheckoutSessionResponse = z.infer<typeof checkoutSessionSchema>;