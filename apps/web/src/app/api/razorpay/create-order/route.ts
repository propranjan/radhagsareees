import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { z } from 'zod';
import { createRazorpayOrder, generateReceiptId, formatAmountToPaise } from '../../../../lib/razorpay-utils';

// Request validation schema
const createOrderSchema = z.object({
  userId: z.string().min(1, 'User ID is required'),
  shippingAddressId: z.string().min(1, 'Shipping address is required'),
  items: z.array(z.object({
    variantId: z.string(),
    productId: z.string(),
    quantity: z.number().min(1),
    price: z.number(),
  })).min(1, 'At least one item required'),
});

type CreateOrderRequest = z.infer<typeof createOrderSchema>;

/**
 * POST /api/razorpay/create-order
 * 
 * Creates a Razorpay order for payment:
 * 1. Validates user and shipping address
 * 2. Validates stock availability
 * 3. Creates a draft order in the database
 * 4. Creates a Razorpay order
 * 5. Returns order details for frontend checkout
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body
    let orderData: CreateOrderRequest;
    try {
      orderData = createOrderSchema.parse(body);
    } catch (error) {
      return NextResponse.json(
        { success: false, error: 'Invalid request data', details: error },
        { status: 400 }
      );
    }

    const { userId, shippingAddressId, items } = orderData;

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Validate shipping address
    const address = await prisma.address.findFirst({
      where: { id: shippingAddressId, userId },
    });

    if (!address) {
      return NextResponse.json(
        { success: false, error: 'Invalid shipping address' },
        { status: 400 }
      );
    }

    // Validate stock and calculate totals
    const stockErrors: string[] = [];
    const validatedItems: Array<{
      variantId: string;
      productId: string;
      quantity: number;
      price: number;
      inventoryId: string;
    }> = [];

    for (const item of items) {
      const variant = await prisma.variant.findUnique({
        where: { id: item.variantId },
        include: {
          inventory: true,
          product: {
            select: { id: true, title: true, isActive: true },
          },
        },
      });

      if (!variant) {
        stockErrors.push(`Product variant not found: ${item.variantId}`);
        continue;
      }

      if (!variant.product.isActive) {
        stockErrors.push(`Product "${variant.product.title}" is no longer available`);
        continue;
      }

      const availableStock = variant.inventory?.qtyAvailable || 0;
      if (item.quantity > availableStock) {
        stockErrors.push(
          `Insufficient stock for "${variant.product.title}". Available: ${availableStock}, Requested: ${item.quantity}`
        );
        continue;
      }

      if (!variant.inventory) {
        stockErrors.push(`No inventory record for variant: ${item.variantId}`);
        continue;
      }

      validatedItems.push({
        variantId: item.variantId,
        productId: item.productId,
        quantity: item.quantity,
        price: Number(variant.price),
        inventoryId: variant.inventory.id,
      });
    }

    if (stockErrors.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Stock validation failed', details: stockErrors },
        { status: 400 }
      );
    }

    // Calculate totals
    const subtotal = validatedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const shipping = subtotal > 2999 ? 0 : 99;
    const tax = Math.round(subtotal * 0.18); // 18% GST
    const total = subtotal + shipping + tax;

    // Generate receipt ID
    const receiptId = generateReceiptId();

    // Create Razorpay order
    const razorpayResult = await createRazorpayOrder({
      amount: formatAmountToPaise(total), // Convert to paise
      currency: 'INR',
      receipt: receiptId,
      notes: {
        userId,
        shippingAddressId,
        itemCount: validatedItems.length.toString(),
      },
    });

    if (!razorpayResult.success || !razorpayResult.order) {
      return NextResponse.json(
        { success: false, error: 'Failed to create payment order', details: razorpayResult.error },
        { status: 500 }
      );
    }

    // Create draft order in database with Razorpay order reference
    const draftOrder = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: receiptId,
          items: validatedItems.map((item) => ({
            variantId: item.variantId,
            qty: item.quantity,
            price: item.price,
          })),
          amount: subtotal,
          tax,
          shipping,
          status: 'PENDING',
          shippingAddressId,
          paymentRef: razorpayResult.order.id, // Store Razorpay order ID
        },
      });

      // Create order items
      await tx.orderItem.createMany({
        data: validatedItems.map((item) => ({
          orderId: order.id,
          variantId: item.variantId,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
          total: item.price * item.quantity,
        })),
      });

      return order;
    });

    // Return order details for frontend
    return NextResponse.json({
      success: true,
      order: {
        id: draftOrder.id,
        orderNumber: draftOrder.orderNumber,
        amount: total,
        currency: 'INR',
      },
      razorpay: {
        orderId: razorpayResult.order.id,
        amount: razorpayResult.order.amount,
        currency: razorpayResult.order.currency,
        keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      },
      customer: {
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || address.phone || '',
      },
      prefill: {
        name: address.name,
        contact: address.phone || user.phone || '',
      },
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
