import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

interface OrderItem {
  variantId: string;
  productId: string;
  quantity: number;
  price: number;
}

interface PlaceOrderRequest {
  userId: string;
  shippingAddressId: string;
  paymentMethod: 'cod' | 'prepaid';
  items: OrderItem[];
}

/**
 * Generate a unique order number
 */
function generateOrderNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RGS-${timestamp}-${random}`;
}

/**
 * POST /api/checkout/place-order
 * 
 * Places an order without payment gateway integration:
 * 1. Validates stock availability
 * 2. Creates order record
 * 3. Creates order items
 * 4. Updates inventory (reduces stock)
 * 5. Creates payment record
 * 6. Clears cart items
 */
export async function POST(request: NextRequest) {
  try {
    const body: PlaceOrderRequest = await request.json();
    const { userId, shippingAddressId, paymentMethod, items } = body;

    // Validate required fields
    if (!userId || !shippingAddressId || !items || items.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    // Validate stock and get variant details
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
    const tax = subtotal * 0.18; // 18% GST
    const total = subtotal + shipping + tax;

    // Execute transaction: create order, update inventory, clear cart
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create the order
      const order = await tx.order.create({
        data: {
          userId,
          orderNumber: generateOrderNumber(),
          items: validatedItems.map((item) => ({
            variantId: item.variantId,
            qty: item.quantity,
            price: item.price,
          })),
          amount: subtotal,
          tax,
          shipping,
          status: paymentMethod === 'cod' ? 'CONFIRMED' : 'PENDING',
          shippingAddressId,
        },
      });

      // 2. Create order items
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

      // 3. Update inventory - reduce available quantity
      for (const item of validatedItems) {
        await tx.inventory.update({
          where: { id: item.inventoryId },
          data: {
            qtyAvailable: {
              decrement: item.quantity,
            },
          },
        });
      }

      // 4. Create payment record
      await tx.payment.create({
        data: {
          orderId: order.id,
          amount: total,
          currency: 'INR',
          method: paymentMethod,
          status: paymentMethod === 'cod' ? 'PENDING' : 'COMPLETED',
          gatewayId: paymentMethod === 'prepaid' ? `DEMO-${Date.now()}` : null,
          gatewayData: paymentMethod === 'prepaid' 
            ? { type: 'demo', timestamp: new Date().toISOString() }
            : undefined,
        },
      });

      // 5. Clear user's cart
      await tx.cartItem.deleteMany({
        where: { userId },
      });

      return order;
    });

    return NextResponse.json({
      success: true,
      orderId: result.id,
      orderNumber: result.orderNumber,
      message: 'Order placed successfully',
    });

  } catch (error) {
    console.error('Place order error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to place order' },
      { status: 500 }
    );
  }
}
