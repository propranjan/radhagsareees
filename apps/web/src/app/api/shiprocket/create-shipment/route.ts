/**
 * Shiprocket Create Shipment API Route
 * 
 * POST /api/shiprocket/create-shipment
 * 
 * Creates a shipment in Shiprocket for a confirmed order.
 * 
 * Flow:
 * 1. Validate order exists and is confirmed
 * 2. Select warehouse based on inventory availability + pincode proximity
 * 3. Check pincode serviceability
 * 4. Create order in Shiprocket
 * 5. Generate AWB (auto-select courier)
 * 6. Request pickup
 * 7. Generate shipping label
 * 8. Save fulfillment record with all tracking details
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { z } from 'zod';
import {
  createShiprocketOrder,
  generateAWB,
  requestPickup,
  generateLabel,
  checkServiceability,
  formatShiprocketDate,
  getDefaultPackageDimensions,
  type ShiprocketOrderPayload,
  type ShiprocketOrderItem,
  type ShiprocketError,
} from '../../../../lib/shiprocket';

// ============================================================================
// REQUEST VALIDATION
// ============================================================================

const createShipmentSchema = z.object({
  orderId: z.string().min(1, 'Order ID is required'),
  // Optional overrides
  warehouseId: z.string().optional(), // Override warehouse selection
  weight: z.number().positive().optional(), // Override weight in kg
  length: z.number().positive().optional(), // Override length in cm
  breadth: z.number().positive().optional(), // Override breadth in cm
  height: z.number().positive().optional(), // Override height in cm
});

type CreateShipmentRequest = z.infer<typeof createShipmentSchema>;

// ============================================================================
// WAREHOUSE SELECTION
// ============================================================================

/**
 * Select the best warehouse for fulfillment based on:
 * 1. Stock availability for all order items
 * 2. Pincode proximity to delivery address
 * 3. Warehouse priority (primary warehouse as fallback)
 */
async function selectWarehouse(
  orderItems: Array<{ variantId: string; quantity: number }>,
  deliveryPincode: string
): Promise<{ warehouseId: string; pickupLocationCode: string } | null> {
  // Get all active warehouses with their inventory locations
  const warehouses = await prisma.warehouse.findMany({
    where: { isActive: true, pickupLocationCode: { not: null } },
    include: {
      inventoryLocations: {
        include: {
          inventory: {
            where: {
              variantId: { in: orderItems.map(item => item.variantId) },
            },
          },
        },
      },
    },
    orderBy: [
      { isPrimary: 'desc' }, // Primary warehouse first
    ],
  });

  // Find warehouse with sufficient stock for all items
  for (const warehouse of warehouses) {
    let hasAllStock = true;

    for (const orderItem of orderItems) {
      const inventory = warehouse.inventoryLocations
        .flatMap(loc => loc.inventory)
        .find(inv => inv.variantId === orderItem.variantId);

      if (!inventory || inventory.qtyAvailable < orderItem.quantity) {
        hasAllStock = false;
        break;
      }
    }

    if (hasAllStock && warehouse.pickupLocationCode) {
      // Check serviceability for this warehouse
      try {
        const couriers = await checkServiceability({
          pickup_postcode: warehouse.pincode,
          delivery_postcode: deliveryPincode,
          weight: 0.5, // Default weight for check
          cod: false,
        });

        if (couriers.length > 0) {
          return {
            warehouseId: warehouse.id,
            pickupLocationCode: warehouse.pickupLocationCode,
          };
        }
      } catch (error) {
        console.warn(`[Shiprocket] Warehouse ${warehouse.name} not serviceable to ${deliveryPincode}`);
        continue;
      }
    }
  }

  return null;
}

// ============================================================================
// ORDER PAYLOAD BUILDER
// ============================================================================

/**
 * Build Shiprocket order payload from internal order data
 */
function buildShiprocketPayload(
  order: any,
  shippingAddress: any,
  billingAddress: any,
  orderItems: any[],
  pickupLocation: string,
  dimensions: { length: number; breadth: number; height: number; weight: number }
): ShiprocketOrderPayload {
  // Determine payment method
  const paymentMethod = order.paymentRef ? 'Prepaid' : 'COD';

  // Build order items array
  const shiprocketItems: ShiprocketOrderItem[] = orderItems.map(item => ({
    name: item.product?.title || item.variant?.sku || 'Product',
    sku: item.variant?.sku || item.variantId,
    units: item.quantity,
    selling_price: Number(item.price),
    discount: 0,
    tax: 0,
    hsn: '5007', // HSN code for silk/sarees - adjust as needed
  }));

  // Calculate sub total
  const subTotal = orderItems.reduce(
    (sum, item) => sum + (Number(item.price) * item.quantity),
    0
  );

  return {
    order_id: order.orderNumber,
    order_date: formatShiprocketDate(new Date(order.createdAt)),
    pickup_location: pickupLocation,
    channel_id: '', // Use default channel
    comment: order.notes || '',
    
    // Billing address
    billing_customer_name: billingAddress.name.split(' ')[0] || billingAddress.name,
    billing_last_name: billingAddress.name.split(' ').slice(1).join(' ') || '',
    billing_address: billingAddress.street,
    billing_address_2: '',
    billing_city: billingAddress.city,
    billing_pincode: billingAddress.zipCode,
    billing_state: billingAddress.state,
    billing_country: billingAddress.country || 'India',
    billing_email: order.user?.email || '',
    billing_phone: billingAddress.phone || order.user?.phone || '',
    
    // Shipping address
    shipping_is_billing: shippingAddress.id === billingAddress.id,
    shipping_customer_name: shippingAddress.name.split(' ')[0] || shippingAddress.name,
    shipping_last_name: shippingAddress.name.split(' ').slice(1).join(' ') || '',
    shipping_address: shippingAddress.street,
    shipping_address_2: '',
    shipping_city: shippingAddress.city,
    shipping_pincode: shippingAddress.zipCode,
    shipping_state: shippingAddress.state,
    shipping_country: shippingAddress.country || 'India',
    shipping_email: order.user?.email || '',
    shipping_phone: shippingAddress.phone || order.user?.phone || '',
    
    // Order items
    order_items: shiprocketItems,
    
    // Payment
    payment_method: paymentMethod,
    shipping_charges: Number(order.shipping) || 0,
    transaction_charges: 0,
    total_discount: Number(order.discount) || 0,
    sub_total: subTotal,
    
    // Package dimensions
    length: dimensions.length,
    breadth: dimensions.breadth,
    height: dimensions.height,
    weight: dimensions.weight,
  };
}

// ============================================================================
// MAIN HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse and validate request body
    const body = await request.json();
    
    let requestData: CreateShipmentRequest;
    try {
      requestData = createShipmentSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    const { orderId, warehouseId: overrideWarehouseId, weight, length, breadth, height } = requestData;

    // ========================================================================
    // 1. Fetch order with all required relations
    // ========================================================================
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { email: true, phone: true, name: true } },
        shippingAddress: true,
        orderItems: {
          include: {
            product: { select: { title: true } },
            variant: { select: { sku: true, color: true, size: true } },
          },
        },
        fulfillments: {
          where: {
            status: { notIn: ['CANCELLED', 'FAILED'] },
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

    // Check if order is in correct status for fulfillment
    if (!['CONFIRMED', 'PROCESSING'].includes(order.status)) {
      return NextResponse.json(
        { success: false, error: `Cannot create shipment for order in ${order.status} status` },
        { status: 400 }
      );
    }

    // Check if order already has an active fulfillment
    if (order.fulfillments.length > 0) {
      const existingFulfillment = order.fulfillments[0];
      return NextResponse.json(
        { 
          success: false, 
          error: 'Order already has an active shipment',
          fulfillmentId: existingFulfillment.id,
          awbCode: existingFulfillment.awbCode,
        },
        { status: 409 }
      );
    }

    // Validate shipping address
    if (!order.shippingAddress) {
      return NextResponse.json(
        { success: false, error: 'Order has no shipping address' },
        { status: 400 }
      );
    }

    // ========================================================================
    // 2. Select warehouse
    // ========================================================================
    let selectedWarehouse: { warehouseId: string; pickupLocationCode: string } | null = null;

    if (overrideWarehouseId) {
      // Use specified warehouse
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: overrideWarehouseId },
      });

      if (!warehouse || !warehouse.pickupLocationCode) {
        return NextResponse.json(
          { success: false, error: 'Specified warehouse not found or not configured for Shiprocket' },
          { status: 400 }
        );
      }

      selectedWarehouse = {
        warehouseId: warehouse.id,
        pickupLocationCode: warehouse.pickupLocationCode,
      };
    } else {
      // Auto-select warehouse
      selectedWarehouse = await selectWarehouse(
        order.orderItems.map(item => ({
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        order.shippingAddress.zipCode
      );
    }

    if (!selectedWarehouse) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'No serviceable warehouse found for this order',
          details: 'Pincode may not be serviceable or stock unavailable',
        },
        { status: 400 }
      );
    }

    // ========================================================================
    // 3. Calculate package dimensions
    // ========================================================================
    const totalItems = order.orderItems.reduce((sum, item) => sum + item.quantity, 0);
    const defaultDimensions = getDefaultPackageDimensions(totalItems);

    const packageDimensions = {
      length: length || defaultDimensions.length,
      breadth: breadth || defaultDimensions.breadth,
      height: height || defaultDimensions.height,
      weight: weight || defaultDimensions.weight,
    };

    // ========================================================================
    // 4. Create fulfillment record (PENDING status)
    // ========================================================================
    const fulfillment = await prisma.fulfillment.create({
      data: {
        orderId: order.id,
        warehouseId: selectedWarehouse.warehouseId,
        status: 'PENDING',
        weight: packageDimensions.weight,
        length: packageDimensions.length,
        breadth: packageDimensions.breadth,
        height: packageDimensions.height,
      },
    });

    try {
      // ======================================================================
      // 5. Build and create Shiprocket order
      // ======================================================================
      const shiprocketPayload = buildShiprocketPayload(
        order,
        order.shippingAddress,
        order.shippingAddress, // Use shipping as billing for now
        order.orderItems,
        selectedWarehouse.pickupLocationCode,
        packageDimensions
      );

      console.log('[Shiprocket] Creating order:', order.orderNumber);
      const shiprocketOrder = await createShiprocketOrder(shiprocketPayload);

      // ======================================================================
      // 6. Generate AWB (auto-select courier)
      // ======================================================================
      console.log('[Shiprocket] Generating AWB for shipment:', shiprocketOrder.shipment_id);
      const awbResult = await generateAWB(shiprocketOrder.shipment_id);

      // ======================================================================
      // 7. Request pickup
      // ======================================================================
      console.log('[Shiprocket] Requesting pickup');
      await requestPickup(shiprocketOrder.shipment_id);

      // ======================================================================
      // 8. Generate label
      // ======================================================================
      console.log('[Shiprocket] Generating label');
      const labelResult = await generateLabel(shiprocketOrder.shipment_id);

      // ======================================================================
      // 9. Update fulfillment with Shiprocket data
      // ======================================================================
      const updatedFulfillment = await prisma.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          shiprocketOrderId: shiprocketOrder.order_id,
          shipmentId: shiprocketOrder.shipment_id,
          awbCode: awbResult.awb_code,
          courierName: awbResult.courier_name,
          courierId: awbResult.courier_company_id,
          labelUrl: labelResult.label_url,
          trackingUrl: `https://shiprocket.co/tracking/${awbResult.awb_code}`,
          status: 'PICKUP_SCHEDULED',
          shiprocketStatus: 'PICKUP SCHEDULED',
          statusUpdatedAt: new Date(),
        },
      });

      // Update order status to PROCESSING
      await prisma.order.update({
        where: { id: order.id },
        data: { status: 'PROCESSING' },
      });

      console.log(`[Shiprocket] Shipment created successfully. AWB: ${awbResult.awb_code}`);

      return NextResponse.json({
        success: true,
        message: 'Shipment created successfully',
        data: {
          fulfillmentId: updatedFulfillment.id,
          shiprocketOrderId: shiprocketOrder.order_id,
          shipmentId: shiprocketOrder.shipment_id,
          awbCode: awbResult.awb_code,
          courierName: awbResult.courier_name,
          labelUrl: labelResult.label_url,
          trackingUrl: `https://shiprocket.co/tracking/${awbResult.awb_code}`,
        },
      });

    } catch (error) {
      // Handle Shiprocket API errors
      const shiprocketError = error as ShiprocketError;
      
      console.error('[Shiprocket] API Error:', shiprocketError);

      // Update fulfillment with error details
      await prisma.fulfillment.update({
        where: { id: fulfillment.id },
        data: {
          status: 'FAILED',
          lastError: shiprocketError.message || 'Unknown error',
          retryCount: { increment: 1 },
        },
      });

      // Check for non-serviceable pincode
      if (shiprocketError.message?.toLowerCase().includes('pincode') || 
          shiprocketError.message?.toLowerCase().includes('serviceable')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Delivery pincode is not serviceable',
            details: shiprocketError.message,
          },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create shipment in Shiprocket',
          details: shiprocketError.message,
          errors: shiprocketError.errors,
        },
        { status: 500 }
      );
    }

  } catch (error) {
    console.error('[Shiprocket] Unexpected error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// ============================================================================
// GET - Fetch shipment status
// ============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const orderId = searchParams.get('orderId');
  const fulfillmentId = searchParams.get('fulfillmentId');

  if (!orderId && !fulfillmentId) {
    return NextResponse.json(
      { success: false, error: 'orderId or fulfillmentId is required' },
      { status: 400 }
    );
  }

  try {
    const fulfillment = await prisma.fulfillment.findFirst({
      where: {
        ...(orderId && { orderId }),
        ...(fulfillmentId && { id: fulfillmentId }),
      },
      include: {
        warehouse: { select: { name: true, city: true } },
        trackingEvents: {
          orderBy: { timestamp: 'desc' },
          take: 10,
        },
      },
    });

    if (!fulfillment) {
      return NextResponse.json(
        { success: false, error: 'Fulfillment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: fulfillment,
    });

  } catch (error) {
    console.error('[Shiprocket] Error fetching fulfillment:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
