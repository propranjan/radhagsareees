import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { revalidateTag } from 'next/cache';
import { 
  razorpayWebhookSchema,
  type RazorpayWebhook,
  type LowStockEvent 
} from '../../../../lib/checkout-validations';
import { 
  verifyRazorpayWebhook, 
  validatePaymentAmount,
  emitLowStockEvent,
  getPaymentMethodName,
  isValidRazorpayOrderId,
  isValidRazorpayPaymentId 
} from '../../../../lib/razorpay-utils';
import { withWebhookLogging } from '../../../../middleware/correlation-id';
import { businessLogger, securityLogger, performanceLogger, errorLogger } from '../../../../lib/structured-logging';
import { correlationId } from '../../../../lib/logger';

/**
 * Process successful payment and update order status
 */
async function processPaymentSuccess(webhookData: RazorpayWebhook) {
  const payment = webhookData.payload.payment.entity;
  const orderId = payment.order_id;
  const paymentId = payment.id;
  const paymentAmount = payment.amount;

  // Validate Razorpay ID formats
  if (!isValidRazorpayOrderId(orderId)) {
    throw new Error(`Invalid Razorpay order ID format: ${orderId}`);
  }

  if (!isValidRazorpayPaymentId(paymentId)) {
    throw new Error(`Invalid Razorpay payment ID format: ${paymentId}`);
  }

  return await prisma.$transaction(async (tx: any) => {
    // Find the order by Razorpay order ID
    const order = await tx.order.findFirst({
      where: { paymentRef: orderId },
      include: {
        orderItems: {
          include: {
            variant: {
              include: {
                inventory: true,
                product: {
                  select: { id: true, title: true }
                }
              }
            }
          }
        }
      }
    });

    if (!order) {
      throw new Error(`Order not found for Razorpay order ID: ${orderId}`);
    }

    // Validate payment amount matches order total (in paise)
    const orderAmountInPaise = Math.round(order.amount * 100);
    if (!validatePaymentAmount(paymentAmount, orderAmountInPaise)) {
      throw new Error(
        `Payment amount mismatch. Expected: ${orderAmountInPaise}, Received: ${paymentAmount}`
      );
    }

    // Check if order is already processed
    if (order.status === 'CONFIRMED' || order.status === 'PROCESSING') {
      console.warn(`Order ${order.id} already processed, skipping webhook`);
      return order;
    }

    // Update inventory and collect low stock events
    const lowStockEvents: LowStockEvent[] = [];
    
    for (const orderItem of order.orderItems) {
      if (!orderItem.variant.inventory) {
        throw new Error(`No inventory found for variant ${orderItem.variantId}`);
      }

      const currentStock = orderItem.variant.inventory.qtyAvailable;
      const newStock = currentStock - orderItem.quantity;

      if (newStock < 0) {
        throw new Error(
          `Insufficient stock for variant ${orderItem.variant.sku}. ` +
          `Available: ${currentStock}, Required: ${orderItem.quantity}`
        );
      }

      // Update inventory
      await tx.inventory.update({
        where: { variantId: orderItem.variantId },
        data: {
          qtyAvailable: newStock,
          updatedAt: new Date()
        }
      });

      // Check for low stock
      const threshold = orderItem.variant.inventory.lowStockThreshold;
      if (newStock <= threshold) {
        lowStockEvents.push({
          variantId: orderItem.variantId,
          productId: orderItem.variant.product.id,
          currentStock: newStock,
          threshold,
          productTitle: orderItem.variant.product.title,
          variantSku: orderItem.variant.sku,
          timestamp: Date.now(),
        });
      }
    }

    // Update order status and payment information
    const updatedOrder = await tx.order.update({
      where: { id: order.id },
      data: {
        status: 'CONFIRMED',
        updatedAt: new Date(),
      }
    });

    // Create payment record
    await tx.payment.create({
      data: {
        orderId: order.id,
        amount: order.amount,
        status: 'COMPLETED',
        method: getPaymentMethodName(payment.method),
        gatewayId: paymentId,
        gatewayOrderId: orderId,
        gatewayResponse: {
          paymentId,
          orderId,
          amount: paymentAmount,
          currency: payment.currency,
          method: payment.method,
          status: payment.status,
          captured: payment.captured,
          createdAt: payment.created_at,
        }
      }
    });

    // Emit low stock events after successful transaction
    for (const event of lowStockEvents) {
      await emitLowStockEvent(event);
    }

    // Trigger cache invalidation
    revalidateTag(`order:${order.id}`);
    revalidateTag(`user-orders:${order.userId}`);
    revalidateTag('orders');
    revalidateTag('inventory');
    
    // Invalidate product caches for updated variants
    for (const item of order.orderItems) {
      revalidateTag(`product:${item.productId}`);
      revalidateTag(`inventory:${item.variantId}`);
    }

    return updatedOrder;
  });
}

/**
 * Process failed payment
 */
async function processPaymentFailure(webhookData: RazorpayWebhook) {
  const payment = webhookData.payload.payment.entity;
  const orderId = payment.order_id;

  const order = await prisma.order.findFirst({
    where: { paymentRef: orderId }
  });

  if (!order) {
    throw new Error(`Order not found for Razorpay order ID: ${orderId}`);
  }

  // Update order status to cancelled
  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'CANCELLED',
      updatedAt: new Date(),
    }
  });

  // Create payment record for the failed payment
  await prisma.payment.create({
    data: {
      orderId: order.id,
      amount: order.amount,
      status: 'FAILED',
      method: getPaymentMethodName(payment.method),
      gatewayId: payment.id,
      gatewayOrderId: orderId,
      gatewayResponse: {
        paymentId: payment.id,
        orderId,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        status: payment.status,
        errorCode: payment.error_code,
        errorDescription: payment.error_description,
        createdAt: payment.created_at,
      }
    }
  });

  // Trigger cache invalidation
  revalidateTag(`order:${order.id}`);
  revalidateTag(`user-orders:${order.userId}`);

  return updatedOrder;
}

/**
 * POST /api/razorpay/webhook
 * 
 * Handles Razorpay webhook events for payment processing
 */
async function handleRazorpayWebhook(request: NextRequest) {
  const startTime = Date.now();
  const cId = correlationId.generate();
  
  try {
    // Get raw body and signature
    const body = await request.text();
    const signature = request.headers.get('x-razorpay-signature');

    // Log webhook received
    businessLogger.paymentEvent(
      cId,
      'initiated',
      'razorpay-webhook',
      undefined,
      undefined,
      {
        hasSignature: !!signature,
        bodySize: body.length,
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    );

    if (!signature) {
      securityLogger.suspiciousActivity(
        cId,
        'missing_webhook_signature',
        'high',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined,
        { provider: 'razorpay' }
      );
      
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    const verificationStartTime = Date.now();
    const isValidSignature = verifyRazorpayWebhook(body, signature);
    const verificationTime = Date.now() - verificationStartTime;
    
    performanceLogger.cacheOperation(
      cId,
      isValidSignature ? 'hit' : 'miss',
      'webhook-signature-verification',
      verificationTime
    );

    if (!isValidSignature) {
      securityLogger.suspiciousActivity(
        cId,
        'invalid_webhook_signature',
        'high',
        request.headers.get('x-forwarded-for') || undefined,
        request.headers.get('user-agent') || undefined,
        { provider: 'razorpay', signatureProvided: true }
      );
      
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse webhook payload
    let webhookData: RazorpayWebhook;
    try {
      const parsedBody = JSON.parse(body);
      webhookData = razorpayWebhookSchema.parse(parsedBody);
    } catch (error) {
      errorLogger.validationError(
        cId,
        'webhook_payload',
        body.substring(0, 100),
        'valid_razorpay_webhook_schema'
      );
      
      return NextResponse.json(
        { error: 'Invalid payload format' },
        { status: 400 }
      );
    }

    // Log webhook event details
    businessLogger.paymentEvent(
      cId,
      'initiated',
      webhookData.payload.payment?.entity?.id || 'unknown',
      webhookData.payload.payment?.entity?.amount,
      webhookData.payload.payment?.entity?.currency,
      {
        event: webhookData.event,
        status: webhookData.payload.payment?.entity?.status,
        orderId: webhookData.payload.payment?.entity?.order_id,
        method: webhookData.payload.payment?.entity?.method
      }
    );

    // Process different webhook events
    switch (webhookData.event) {
      case 'payment.captured':
      case 'payment.authorized':
        if (webhookData.payload.payment.entity.status === 'captured' || 
            webhookData.payload.payment.entity.status === 'authorized') {
          const order = await processPaymentSuccess(webhookData);
          
          businessLogger.paymentEvent(
            cId,
            'successful',
            webhookData.payload.payment.entity.id,
            webhookData.payload.payment.entity.amount / 100, // Convert from paise
            webhookData.payload.payment.entity.currency,
            {
              orderId: order.id,
              processingTime: Date.now() - startTime
            }
          );
          
          return NextResponse.json({
            success: true,
            message: 'Payment processed successfully',
            orderId: order.id
          });
        }
        break;

      case 'payment.failed':
        const failedOrder = await processPaymentFailure(webhookData);
        
        businessLogger.paymentEvent(
          cId,
          'failed',
          webhookData.payload.payment.entity.id,
          webhookData.payload.payment.entity.amount / 100,
          webhookData.payload.payment.entity.currency,
          {
            orderId: failedOrder.id,
            reason: (webhookData.payload.payment.entity as any).error_reason || 'Unknown',
            processingTime: Date.now() - startTime
          }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Payment failure processed',
          orderId: failedOrder.id
        });

      case 'order.paid':
        // Handle order-level paid event (backup/confirmation)
        const paidOrder = await processPaymentSuccess(webhookData);
        
        businessLogger.paymentEvent(
          cId,
          'successful',
          webhookData.payload.payment.entity.id,
          webhookData.payload.payment.entity.amount / 100,
          webhookData.payload.payment.entity.currency,
          {
            orderId: paidOrder.id,
            eventType: 'order.paid',
            processingTime: Date.now() - startTime
          }
        );
        
        return NextResponse.json({
          success: true,
          message: 'Order paid event processed',
          orderId: paidOrder.id
        });

      default:
        performanceLogger.cacheOperation(
          cId,
          'miss',
          `unhandled-event-${webhookData.event}`,
          Date.now() - startTime
        );
        
        return NextResponse.json({
          success: true,
          message: 'Event received but not processed'
        });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook processed'
    });

  } catch (error) {
    const processingTime = Date.now() - startTime;
    
    errorLogger.logError(cId, error as Error, {
      component: 'razorpay-webhook',
      operation: 'webhook_processing',
      metadata: {
        processingTime,
        hasSignature: !!request.headers.get('x-razorpay-signature'),
        userAgent: request.headers.get('user-agent')
      }
    });
    
    // Return 200 to prevent Razorpay from retrying
    return NextResponse.json({
      success: false,
      error: 'Internal processing error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 200 });
  }
}

// Export wrapped function with structured logging
export const POST = withWebhookLogging('razorpay', handleRazorpayWebhook);

/**
 * GET /api/razorpay/webhook
 * 
 * Health check and documentation
 */
export async function GET() {
  return NextResponse.json({
    message: 'Razorpay Webhook Handler',
    version: '1.0.0',
    supportedEvents: [
      'payment.captured - Payment successfully captured',
      'payment.authorized - Payment authorized (for two-step payments)',
      'payment.failed - Payment failed or declined',
      'order.paid - Order marked as paid (confirmation)',
    ],
    security: [
      'Signature verification using HMAC-SHA256',
      'Payload validation with Zod schemas',
      'Duplicate event protection',
      'Amount validation against order total',
    ],
    processing: [
      '1. Verify webhook signature',
      '2. Validate payload structure',
      '3. Process payment status change',
      '4. Update order and inventory in transaction',
      '5. Emit low stock events if needed',
      '6. Trigger cache revalidation',
    ]
  });
}