import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';
import {
  trackShipment,
  cancelShipment,
  mapShiprocketStatus,
} from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/admin/shipments/[id]
 * 
 * Get shipment details with tracking
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    // Get fulfillment
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id },
      include: {
        order: {
          include: {
            user: { select: { name: true, email: true } },
            shippingAddress: true,
            orderItems: {
              include: {
                product: { select: { title: true, images: true } },
                variant: { select: { sku: true, color: true, size: true } },
              },
            },
          },
        },
        warehouse: true,
        trackingHistory: {
          orderBy: { eventTime: 'desc' },
          take: 20,
        },
      },
    });

    if (!fulfillment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Get live tracking from Shiprocket if AWB exists
    let liveTracking = null;
    if (fulfillment.awbCode) {
      try {
        const trackingData = await trackShipment(fulfillment.awbCode);
        liveTracking = trackingData.tracking_data;
        
        // Update fulfillment status if changed
        if (trackingData.tracking_data.shipment_track?.[0]) {
          const latestTrack = trackingData.tracking_data.shipment_track[0];
          const mappedStatus = mapShiprocketStatus(latestTrack.current_status);
          
          if (mappedStatus !== fulfillment.status) {
            await prisma.fulfillment.update({
              where: { id },
              data: {
                status: mappedStatus as any,
                currentLocation: latestTrack.destination || undefined,
                estimatedDelivery: latestTrack.edd ? new Date(latestTrack.edd) : undefined,
                ...(mappedStatus === 'DELIVERED' && !fulfillment.deliveredAt
                  ? { deliveredAt: new Date() }
                  : {}),
              },
            });
          }
        }
      } catch (error) {
        console.warn('[Admin Shipment] Live tracking failed:', error);
      }
    }

    return NextResponse.json({
      fulfillment: {
        id: fulfillment.id,
        shiprocketOrderId: fulfillment.shiprocketOrderId,
        shiprocketShipmentId: fulfillment.shiprocketShipmentId,
        awbCode: fulfillment.awbCode,
        courierName: fulfillment.courierName,
        courierCompanyId: fulfillment.courierCompanyId,
        status: fulfillment.status,
        trackingUrl: fulfillment.trackingUrl,
        labelUrl: fulfillment.labelUrl,
        manifestUrl: fulfillment.manifestUrl,
        currentLocation: fulfillment.currentLocation,
        pickupScheduledDate: fulfillment.pickupScheduledDate?.toISOString(),
        pickedUpAt: fulfillment.pickedUpAt?.toISOString(),
        deliveredAt: fulfillment.deliveredAt?.toISOString(),
        estimatedDelivery: fulfillment.estimatedDelivery?.toISOString(),
        weight: fulfillment.weight,
        dimensions: fulfillment.dimensions,
        createdAt: fulfillment.createdAt.toISOString(),
        updatedAt: fulfillment.updatedAt.toISOString(),
      },
      order: {
        id: fulfillment.order.id,
        orderNumber: fulfillment.order.orderNumber,
        status: fulfillment.order.status,
        amount: Number(fulfillment.order.amount),
        customer: {
          name: fulfillment.order.user.name,
          email: fulfillment.order.user.email,
        },
        shippingAddress: fulfillment.order.shippingAddress,
        items: fulfillment.order.orderItems.map(item => ({
          id: item.id,
          productTitle: item.product.title,
          productImage: item.product.images[0],
          quantity: item.quantity,
          price: Number(item.price),
          variant: item.variant ? {
            sku: item.variant.sku,
            color: item.variant.color,
            size: item.variant.size,
          } : null,
        })),
      },
      warehouse: fulfillment.warehouse ? {
        id: fulfillment.warehouse.id,
        name: fulfillment.warehouse.name,
        city: fulfillment.warehouse.city,
        state: fulfillment.warehouse.state,
      } : null,
      trackingHistory: fulfillment.trackingHistory.map(t => ({
        id: t.id,
        status: t.status,
        location: t.location,
        description: t.description,
        eventTime: t.eventTime.toISOString(),
      })),
      liveTracking,
    });
  } catch (error) {
    console.error('[Admin Shipment Detail] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipment' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/shipments/[id]
 * 
 * Cancel a shipment
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    // Verify admin token
    const token = request.cookies.get('admin_token')?.value;
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyAdminToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id } = await params;

    // Get fulfillment
    const fulfillment = await prisma.fulfillment.findUnique({
      where: { id },
    });

    if (!fulfillment) {
      return NextResponse.json(
        { error: 'Shipment not found' },
        { status: 404 }
      );
    }

    // Check if cancellable
    const nonCancellableStatuses = [
      'PICKED',
      'IN_TRANSIT',
      'OUT_FOR_DELIVERY',
      'DELIVERED',
      'RTO_INITIATED',
      'RTO_IN_TRANSIT',
      'RTO_DELIVERED',
      'CANCELLED',
    ];

    if (nonCancellableStatuses.includes(fulfillment.status)) {
      return NextResponse.json(
        { error: `Cannot cancel shipment with status: ${fulfillment.status}` },
        { status: 400 }
      );
    }

    // Cancel in Shiprocket
    if (fulfillment.awbCode) {
      try {
        await cancelShipment([fulfillment.awbCode]);
      } catch (error) {
        console.error('[Admin Shipment] Shiprocket cancellation failed:', error);
        // Continue with local cancellation
      }
    }

    // Update fulfillment status
    await prisma.fulfillment.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });

    return NextResponse.json({
      success: true,
      message: 'Shipment cancelled successfully',
    });
  } catch (error) {
    console.error('[Admin Shipment Cancel] Error:', error);
    return NextResponse.json(
      { error: 'Failed to cancel shipment' },
      { status: 500 }
    );
  }
}
