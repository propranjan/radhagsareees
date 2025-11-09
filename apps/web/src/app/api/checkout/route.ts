import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@radhagsareees/db';
import { 
  checkoutSchema, 
  stockValidationSchema,
  type CheckoutRequest,
  type StockValidationResult,
  type CheckoutSessionResponse 
} from '../../../lib/checkout-validations';
import { 
  createRazorpayOrder, 
  calculateOrderTotals, 
  generateReceiptId,
  createOrderMetadata,
  formatAmountToPaise 
} from '../../../lib/razorpay-utils';

const prisma = new PrismaClient();

/**
 * Validate cart items and check stock availability
 */
async function validateCartAndStock(items: CheckoutRequest['items']): Promise<StockValidationResult> {
  const errors: StockValidationResult['errors'] = [];
  const validatedItems: StockValidationResult['items'] = [];

  for (const item of items) {
    try {
      // Fetch variant with product and inventory details
      const variant = await prisma.variant.findUnique({
        where: { id: item.variantId },
        include: {
          product: {
            select: { id: true, title: true, slug: true, isActive: true }
          },
          inventory: {
            select: { qtyAvailable: true, lowStockThreshold: true }
          }
        }
      });

      if (!variant) {
        errors.push({
          variantId: item.variantId,
          requested: item.quantity,
          available: 0,
          message: 'Product variant not found'
        });
        continue;
      }

      if (!variant.product.isActive) {
        errors.push({
          variantId: item.variantId,
          requested: item.quantity,
          available: 0,
          message: 'Product is no longer available'
        });
        continue;
      }

      const availableStock = variant.inventory?.qtyAvailable || 0;

      if (item.quantity > availableStock) {
        errors.push({
          variantId: item.variantId,
          requested: item.quantity,
          available: availableStock,
          message: `Insufficient stock. Only ${availableStock} items available`
        });
        continue;
      }

      // Add to validated items
      validatedItems.push({
        variantId: variant.id,
        productId: variant.product.id,
        quantity: item.quantity,
        price: variant.price,
        total: item.quantity * variant.price,
        product: {
          title: variant.product.title,
          slug: variant.product.slug,
        },
        variant: {
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
        },
      });

    } catch (error) {
      console.error(`Error validating variant ${item.variantId}:`, error);
      errors.push({
        variantId: item.variantId,
        requested: item.quantity,
        available: 0,
        message: 'Error validating product availability'
      });
    }
  }

  // Calculate totals
  const totals = calculateOrderTotals(validatedItems);

  return {
    isValid: errors.length === 0,
    errors,
    items: validatedItems,
    subtotal: totals.subtotal,
    shipping: totals.shipping,
    tax: totals.tax,
    total: totals.total,
  };
}

/**
 * Create draft order in database
 */
async function createDraftOrder(
  validationResult: StockValidationResult,
  checkoutData: CheckoutRequest
): Promise<string> {
  return await prisma.$transaction(async (tx) => {
    // Create the order
    const order = await tx.order.create({
      data: {
        userId: checkoutData.userId,
        orderNumber: generateReceiptId(),
        items: validationResult.items.map(item => ({
          variantId: item.variantId,
          qty: item.quantity,
          price: item.price,
        })),
        amount: validationResult.total / 100, // Convert from paise to rupees for DB
        status: 'DRAFT',
        shippingAddressId: checkoutData.shippingAddressId,
        orderItems: {
          create: validationResult.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            quantity: item.quantity,
            price: item.price,
            total: item.total,
          }))
        }
      }
    });

    return order.id;
  });
}

/**
 * POST /api/checkout
 * 
 * Validates cart, checks stock availability, and creates Razorpay checkout session
 */
export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    let checkoutData: CheckoutRequest;
    try {
      checkoutData = checkoutSchema.parse(body);
    } catch (error) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request data',
        details: error instanceof Error ? [{ field: 'general', message: error.message }] : []
      } satisfies CheckoutSessionResponse, { status: 400 });
    }

    // Validate cart items and stock
    const stockValidation = await validateCartAndStock(checkoutData.items);
    
    if (!stockValidation.isValid) {
      return NextResponse.json({
        success: false,
        error: 'Stock validation failed',
        details: stockValidation.errors.map(err => ({
          field: err.variantId,
          message: err.message
        }))
      } satisfies CheckoutSessionResponse, { status: 400 });
    }

    // Verify user exists and has valid shipping address
    const user = await prisma.user.findUnique({
      where: { id: checkoutData.userId },
      include: {
        addresses: {
          where: { id: checkoutData.shippingAddressId },
          take: 1
        }
      }
    });

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      } satisfies CheckoutSessionResponse, { status: 404 });
    }

    if (user.addresses.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Invalid shipping address'
      } satisfies CheckoutSessionResponse, { status: 400 });
    }

    // Create draft order
    const orderId = await createDraftOrder(stockValidation, checkoutData);

    // Create Razorpay order
    const receiptId = generateReceiptId();
    const orderMetadata = createOrderMetadata({
      userId: checkoutData.userId,
      shippingAddressId: checkoutData.shippingAddressId,
      itemCount: stockValidation.items.length,
      couponCode: checkoutData.couponCode,
    });

    const razorpayOrderResult = await createRazorpayOrder({
      amount: stockValidation.total, // Already in paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        ...orderMetadata,
        order_id: orderId, // Link to our internal order ID
      },
    });

    if (!razorpayOrderResult.success || !razorpayOrderResult.order) {
      // Clean up draft order
      await prisma.order.delete({ where: { id: orderId } });
      
      return NextResponse.json({
        success: false,
        error: 'Failed to create payment session',
        details: [{ field: 'payment', message: razorpayOrderResult.error || 'Payment service unavailable' }]
      } satisfies CheckoutSessionResponse, { status: 500 });
    }

    // Update order with Razorpay order ID and set status to PENDING
    await prisma.order.update({
      where: { id: orderId },
      data: {
        paymentRef: razorpayOrderResult.order.id,
        status: 'PENDING'
      }
    });

    // Return checkout session details
    return NextResponse.json({
      success: true,
      sessionId: razorpayOrderResult.order.id,
      orderId: orderId,
      razorpayOrderId: razorpayOrderResult.order.id,
      amount: stockValidation.total,
      currency: 'INR'
    } satisfies CheckoutSessionResponse);

  } catch (error) {
    console.error('Checkout API error:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: [{ field: 'general', message: 'An unexpected error occurred' }]
    } satisfies CheckoutSessionResponse, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * GET /api/checkout
 * 
 * Health check and documentation
 */
export async function GET() {
  return NextResponse.json({
    message: 'Checkout API',
    version: '1.0.0',
    endpoints: {
      POST: {
        description: 'Create checkout session with cart validation and stock checking',
        requires: ['items', 'shippingAddressId', 'userId'],
        validates: ['product availability', 'stock levels', 'user permissions'],
        returns: 'Razorpay checkout session details',
      }
    },
    flow: [
      '1. Validate request schema',
      '2. Check product availability and stock levels',
      '3. Verify user and shipping address',
      '4. Create draft order in database',
      '5. Generate Razorpay payment session',
      '6. Return checkout session details'
    ]
  });
}