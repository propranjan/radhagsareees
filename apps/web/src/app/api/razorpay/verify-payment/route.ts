import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { createHmac } from 'crypto';
import { z } from 'zod';

// Request validation schema
const verifyPaymentSchema = z.object({
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  orderId: z.string().min(1), // Our internal order ID
});

type VerifyPaymentRequest = z.infer<typeof verifyPaymentSchema>;

/**
 * Verify Razorpay payment signature
 */
function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const secret = process.env.RAZORPAY_KEY_SECRET;
  
  if (!secret) {
    console.error('RAZORPAY_KEY_SECRET not configured');
    return false;
  }

  const body = `${orderId}|${paymentId}`;
  const expectedSignature = createHmac('sha256', secret)
    .update(body)
    .digest('hex');

  return expectedSignature === signature;
}

/**
 * POST /api/razorpay/verify-payment
 * 
 * Verifies Razorpay payment after checkout:
 * 1. Validates the payment signature
 * 2. Updates order status to CONFIRMED
 * 3. Creates payment record
 * 4. Updates inventory
 * 5. Clears user's cart
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    let paymentData: VerifyPaymentRequest;
    try {
      paymentData = verifyPaymentSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data' },
        { status: 400 }
      );
    }

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = paymentData;

    // Verify payment signature
    const isValid = verifyPaymentSignature(
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    );

    if (!isValid) {
      console.error('Invalid payment signature', {
        razorpay_order_id,
        razorpay_payment_id,
      });
      return NextResponse.json(
        { success: false, error: 'Payment verification failed' },
        { status: 400 }
      );
    }

    // Find the order
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                inventory: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { success: false, error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if order is already confirmed (prevent double processing)
    if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
      return NextResponse.json({
        success: true,
        message: 'Payment already verified',
        orderId: order.id,
        orderNumber: order.orderNumber,
      });
    }

    // Verify the Razorpay order ID matches
    if (order.paymentRef !== razorpay_order_id) {
      return NextResponse.json(
        { success: false, error: 'Order mismatch' },
        { status: 400 }
      );
    }

    // Calculate total for payment record
    const total = Number(order.amount) + Number(order.tax || 0) + Number(order.shipping || 0);

    // Process payment in transaction
    await prisma.$transaction(async (tx) => {
      // 1. Update order status
      await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CONFIRMED',
          updatedAt: new Date(),
        },
      });

      // 2. Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          currency: 'INR',
          method: 'razorpay',
          status: 'COMPLETED',
          gatewayId: razorpay_payment_id,
          gatewayData: {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
            verified_at: new Date().toISOString(),
          },
        },
      });

      // 3. Update inventory - reduce stock for each item
      for (const item of order.orderItems) {
        if (item.variant.inventory) {
          await tx.inventory.update({
            where: { id: item.variant.inventory.id },
            data: {
              qtyAvailable: {
                decrement: item.quantity,
              },
            },
          });
        }
      }

      // 4. Clear user's cart
      await tx.cartItem.deleteMany({
        where: { userId: order.userId },
      });
    });

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error) {
    console.error('Error verifying payment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
