import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { verifyAdminToken } from '@/lib/auth';
import {
  createShiprocketOrder,
  generateAWB,
  requestPickup,
  generateLabel,
  trackShipment,
  cancelShipment,
  formatShiprocketDate,
  getDefaultPackageDimensions,
  type ShiprocketOrderPayload,
} from '@/lib/shiprocket';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/shipments
 * 
 * Create a shipment for an order via Shiprocket
 */
export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { orderId, warehouseId, courierId } = body;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get order with all details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: true,
        orderItems: {
          include: {
            product: true,
            variant: true,
          },
        },
        shippingAddress: true,
        payments: true,
        fulfillments: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Check if already has active fulfillment
    const activeFulfillment = order.fulfillments.find(
      f => !['CANCELLED', 'RTO_DELIVERED'].includes(f.status)
    );

    if (activeFulfillment) {
      return NextResponse.json(
        { error: 'Order already has an active shipment' },
        { status: 400 }
      );
    }

    if (!order.shippingAddress) {
      return NextResponse.json(
        { error: 'Order has no shipping address' },
        { status: 400 }
      );
    }

    // Get warehouse for pickup location
    let warehouse;
    if (warehouseId) {
      warehouse = await prisma.warehouse.findUnique({
        where: { id: warehouseId, isActive: true },
      });
    } else {
      // Use first active warehouse as default
      warehouse = await prisma.warehouse.findFirst({
        where: { isActive: true, shiprocketPickupId: { not: null } },
      });
    }

    if (!warehouse) {
      return NextResponse.json(
        { error: 'No active warehouse with Shiprocket pickup location found' },
        { status: 400 }
      );
    }

    // Prepare Shiprocket order payload
    const itemCount = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const dimensions = getDefaultPackageDimensions(itemCount);

    // Determine payment method
    const payment = order.payments[0];
    const isPrepaid = payment?.status === 'COMPLETED';

    const shiprocketPayload: ShiprocketOrderPayload = {
      order_id: order.orderNumber,
      order_date: formatShiprocketDate(order.createdAt),
      pickup_location: warehouse.pickupLocationCode || warehouse.code,
      billing_customer_name: order.shippingAddress.name.split(' ')[0],
      billing_last_name: order.shippingAddress.name.split(' ').slice(1).join(' ') || '',
      billing_address: order.shippingAddress.street,
      billing_address_2: '',
      billing_city: order.shippingAddress.city,
      billing_pincode: order.shippingAddress.zipCode,
      billing_state: order.shippingAddress.state,
      billing_country: order.shippingAddress.country || 'India',
      billing_email: order.user.email,
      billing_phone: order.shippingAddress.phone || '',
      shipping_is_billing: true,
      order_items: order.orderItems.map(item => ({
        name: item.product.title,
        sku: item.variant?.sku || item.product.id,
        units: item.quantity,
        selling_price: Number(item.price),
        hsn: '',
      })),
      payment_method: isPrepaid ? 'Prepaid' : 'COD',
      sub_total: Number(order.amount),
      length: dimensions.length,
      breadth: dimensions.breadth,
      height: dimensions.height,
      weight: dimensions.weight,
    };

    // Create order in Shiprocket
    const shiprocketOrder = await createShiprocketOrder(shiprocketPayload);

    // Generate AWB
    const awbResult = await generateAWB(shiprocketOrder.shipment_id, courierId);

    // Request pickup
    const pickupResult = await requestPickup(shiprocketOrder.shipment_id);

    // Generate label
    let labelUrl: string | null = null;
    try {
      const labelResult = await generateLabel(shiprocketOrder.shipment_id);
      labelUrl = labelResult.label_url;
    } catch (error) {
      console.warn('[Admin Shipment] Label generation failed:', error);
    }

    // Create fulfillment record
    const fulfillment = await prisma.fulfillment.create({
      data: {
        orderId: order.id,
        warehouseId: warehouse.id,
        shiprocketOrderId: shiprocketOrder.order_id,
        shiprocketShipmentId: shiprocketOrder.shipment_id,
        awbCode: awbResult.awb_code,
        courierCompanyId: awbResult.courier_company_id,
        courierName: awbResult.courier_name,
        status: 'PICKUP_SCHEDULED',
        pickupScheduledDate: pickupResult.pickup_scheduled_date
          ? new Date(pickupResult.pickup_scheduled_date)
          : null,
        labelUrl,
        trackingUrl: `https://shiprocket.co/tracking/${awbResult.awb_code}`,
      },
    });

    // Update order status to PROCESSING
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'PROCESSING' },
    });

    return NextResponse.json({
      success: true,
      fulfillment: {
        id: fulfillment.id,
        awbCode: fulfillment.awbCode,
        courierName: fulfillment.courierName,
        status: fulfillment.status,
        trackingUrl: fulfillment.trackingUrl,
        labelUrl: fulfillment.labelUrl,
        pickupScheduledDate: fulfillment.pickupScheduledDate?.toISOString(),
      },
    });
  } catch (error: any) {
    console.error('[Admin Shipment Create] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create shipment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/shipments
 * 
 * Get shipments with filtering and pagination
 */
export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {};
    
    if (status && status !== 'all') {
      where.status = status.toUpperCase();
    }
    
    if (search) {
      where.OR = [
        { awbCode: { contains: search, mode: 'insensitive' } },
        { courierName: { contains: search, mode: 'insensitive' } },
        { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get fulfillments with pagination
    const [fulfillments, total] = await Promise.all([
      prisma.fulfillment.findMany({
        where,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
              status: true,
              amount: true,
              user: { select: { name: true, email: true } },
              shippingAddress: true,
            },
          },
          warehouse: {
            select: { id: true, name: true, city: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.fulfillment.count({ where }),
    ]);

    // Transform fulfillments
    const transformedFulfillments = fulfillments.map((f) => ({
      id: f.id,
      awbCode: f.awbCode,
      courierName: f.courierName,
      status: f.status,
      trackingUrl: f.trackingUrl,
      labelUrl: f.labelUrl,
      pickupScheduledDate: f.pickupScheduledDate?.toISOString(),
      pickedUpAt: f.pickedUpAt?.toISOString(),
      deliveredAt: f.deliveredAt?.toISOString(),
      estimatedDelivery: f.estimatedDelivery?.toISOString(),
      createdAt: f.createdAt.toISOString(),
      order: {
        id: f.order.id,
        orderNumber: f.order.orderNumber,
        status: f.order.status,
        amount: Number(f.order.amount),
        customerName: f.order.user.name || f.order.user.email.split('@')[0],
        shippingCity: f.order.shippingAddress?.city,
        shippingPincode: f.order.shippingAddress?.zipCode,
      },
      warehouse: f.warehouse ? {
        id: f.warehouse.id,
        name: f.warehouse.name,
        city: f.warehouse.city,
      } : null,
    }));

    return NextResponse.json({
      fulfillments: transformedFulfillments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('[Admin Shipments] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shipments' },
      { status: 500 }
    );
  }
}
