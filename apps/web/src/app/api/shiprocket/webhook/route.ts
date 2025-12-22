/**
 * Shiprocket Webhook Handler
 * 
 * POST /api/shiprocket/webhook
 * 
 * Handles shipment status updates from Shiprocket.
 * 
 * Webhook Events Handled:
 * - Shipment status updates (picked, in-transit, delivered, RTO, etc.)
 * - Tracking updates
 * 
 * Security:
 * - Validates webhook token if configured
 * - Implements idempotency to prevent duplicate updates
 * 
 * @see https://apidocs.shiprocket.in/#webhook-integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { mapShiprocketStatus } from '../../../../lib/shiprocket';

// ============================================================================
// TYPES
// ============================================================================

interface ShiprocketWebhookPayload {
  // Order/Shipment identifiers
  order_id?: number;
  shipment_id?: number;
  awb?: string;
  
  // Status information
  current_status?: string;
  current_status_id?: number;
  courier_name?: string;
  
  // Tracking details
  scans?: Array<{
    date: string;
    time: string;
    location: string;
    activity: string;
    status: string;
  }>;
  
  // EDD (Estimated Delivery Date)
  etd?: string;
  edd?: string;
  
  // Additional details
  sr_order_id?: number;
  channel_order_id?: string;
  pod?: string; // Proof of Delivery URL
  
  // RTO details
  rto_initiated?: boolean;
  rto_delivered?: boolean;
}

// ============================================================================
// WEBHOOK TOKEN VERIFICATION
// ============================================================================

/**
 * Verify webhook authenticity using token
 * Shiprocket uses a simple token-based verification
 */
function verifyWebhookToken(request: NextRequest): boolean {
  const webhookToken = process.env.SHIPROCKET_WEBHOOK_TOKEN;
  
  // If no token configured, skip verification (not recommended for production)
  if (!webhookToken) {
    console.warn('[Shiprocket Webhook] No SHIPROCKET_WEBHOOK_TOKEN configured - skipping verification');
    return true;
  }

  // Check Authorization header
  const authHeader = request.headers.get('authorization');
  if (authHeader) {
    const token = authHeader.replace('Bearer ', '').trim();
    if (token === webhookToken) {
      return true;
    }
  }

  // Check X-Webhook-Token header (alternative)
  const tokenHeader = request.headers.get('x-webhook-token');
  if (tokenHeader === webhookToken) {
    return true;
  }

  return false;
}

// ============================================================================
// IDEMPOTENCY CHECK
// ============================================================================

/**
 * Check if this exact status update has already been processed
 * Prevents duplicate processing of the same webhook event
 */
async function isAlreadyProcessed(
  fulfillmentId: string,
  status: string,
  timestamp: Date
): Promise<boolean> {
  const existingEvent = await prisma.shipmentTracking.findFirst({
    where: {
      fulfillmentId,
      status,
      timestamp: {
        gte: new Date(timestamp.getTime() - 1000), // Within 1 second
        lte: new Date(timestamp.getTime() + 1000),
      },
    },
  });

  return !!existingEvent;
}

// ============================================================================
// STATUS UPDATE HANDLER
// ============================================================================

/**
 * Update fulfillment and order status based on webhook data
 */
async function processStatusUpdate(
  fulfillment: any,
  payload: ShiprocketWebhookPayload
): Promise<void> {
  const currentStatus = payload.current_status || '';
  const mappedStatus = mapShiprocketStatus(currentStatus);
  const now = new Date();

  // Build update data for fulfillment
  const fulfillmentUpdate: any = {
    shiprocketStatus: currentStatus,
    status: mappedStatus,
    statusUpdatedAt: now,
  };

  // Handle specific status updates
  switch (mappedStatus) {
    case 'DELIVERED':
      fulfillmentUpdate.deliveredAt = now;
      break;
    
    case 'RTO_INITIATED':
      fulfillmentUpdate.rtoInitiatedAt = now;
      break;
    
    case 'RTO_DELIVERED':
      fulfillmentUpdate.rtoDeliveredAt = now;
      break;
  }

  // Update estimated delivery if provided
  if (payload.edd) {
    fulfillmentUpdate.estimatedDelivery = new Date(payload.edd);
  }

  // Update courier name if changed
  if (payload.courier_name) {
    fulfillmentUpdate.courierName = payload.courier_name;
  }

  // Update fulfillment record
  await prisma.fulfillment.update({
    where: { id: fulfillment.id },
    data: fulfillmentUpdate,
  });

  // Update order status based on fulfillment status
  const orderStatusMap: Record<string, string> = {
    'PICKED': 'PROCESSING',
    'IN_TRANSIT': 'SHIPPED',
    'OUT_FOR_DELIVERY': 'SHIPPED',
    'DELIVERED': 'DELIVERED',
    'RTO_INITIATED': 'PROCESSING',
    'RTO_IN_TRANSIT': 'PROCESSING',
    'RTO_DELIVERED': 'CANCELLED', // Or REFUNDED based on business logic
    'CANCELLED': 'CANCELLED',
  };

  const newOrderStatus = orderStatusMap[mappedStatus];
  if (newOrderStatus) {
    await prisma.order.update({
      where: { id: fulfillment.orderId },
      data: { status: newOrderStatus as any },
    });
  }
}

/**
 * Record tracking event from webhook
 */
async function recordTrackingEvent(
  fulfillmentId: string,
  payload: ShiprocketWebhookPayload
): Promise<void> {
  // Get the most recent scan if available
  const latestScan = payload.scans?.[0];
  
  const timestamp = latestScan
    ? new Date(`${latestScan.date} ${latestScan.time}`)
    : new Date();

  // Check for idempotency
  const status = payload.current_status || latestScan?.status || 'UNKNOWN';
  if (await isAlreadyProcessed(fulfillmentId, status, timestamp)) {
    console.log('[Shiprocket Webhook] Duplicate event, skipping');
    return;
  }

  // Create tracking record
  await prisma.shipmentTracking.create({
    data: {
      fulfillmentId,
      status,
      statusMessage: latestScan?.activity || payload.current_status || 'Status Update',
      location: latestScan?.location || null,
      timestamp,
      rawData: payload as any,
    },
  });
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  console.log('[Shiprocket Webhook] Received webhook');

  try {
    // ========================================================================
    // 1. Verify webhook authenticity
    // ========================================================================
    if (!verifyWebhookToken(request)) {
      console.error('[Shiprocket Webhook] Invalid webhook token');
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // ========================================================================
    // 2. Parse webhook payload
    // ========================================================================
    let payload: ShiprocketWebhookPayload;
    try {
      payload = await request.json();
    } catch (error) {
      console.error('[Shiprocket Webhook] Invalid JSON payload');
      return NextResponse.json(
        { success: false, error: 'Invalid payload' },
        { status: 400 }
      );
    }

    console.log('[Shiprocket Webhook] Payload:', JSON.stringify({
      order_id: payload.order_id,
      shipment_id: payload.shipment_id,
      awb: payload.awb,
      current_status: payload.current_status,
    }));

    // ========================================================================
    // 3. Find fulfillment record
    // ========================================================================
    // Try to find by AWB first (most reliable), then by shipment_id, then by order_id
    let fulfillment = null;

    if (payload.awb) {
      fulfillment = await prisma.fulfillment.findFirst({
        where: { awbCode: payload.awb },
      });
    }

    if (!fulfillment && payload.shipment_id) {
      fulfillment = await prisma.fulfillment.findFirst({
        where: { shipmentId: payload.shipment_id },
      });
    }

    if (!fulfillment && payload.order_id) {
      fulfillment = await prisma.fulfillment.findFirst({
        where: { shiprocketOrderId: payload.order_id },
      });
    }

    if (!fulfillment) {
      console.warn('[Shiprocket Webhook] No matching fulfillment found for:', {
        awb: payload.awb,
        shipment_id: payload.shipment_id,
        order_id: payload.order_id,
      });
      
      // Return 200 to acknowledge receipt (don't retry)
      return NextResponse.json({
        success: false,
        message: 'Fulfillment not found, webhook acknowledged',
      });
    }

    // ========================================================================
    // 4. Process status update
    // ========================================================================
    await processStatusUpdate(fulfillment, payload);

    // ========================================================================
    // 5. Record tracking event
    // ========================================================================
    await recordTrackingEvent(fulfillment.id, payload);

    console.log(`[Shiprocket Webhook] Successfully processed: ${payload.current_status} for AWB: ${payload.awb}`);

    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      fulfillmentId: fulfillment.id,
    });

  } catch (error) {
    console.error('[Shiprocket Webhook] Error processing webhook:', error);
    
    // Return 500 to trigger Shiprocket retry
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Health check / webhook info
// ============================================================================

export async function GET() {
  return NextResponse.json({
    success: true,
    message: 'Shiprocket webhook endpoint is active',
    endpoints: {
      webhook: 'POST /api/shiprocket/webhook',
      info: 'GET /api/shiprocket/webhook',
    },
    docs: 'https://apidocs.shiprocket.in/#webhook-integration',
  });
}
