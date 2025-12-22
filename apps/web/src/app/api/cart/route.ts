import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@radhagsareees/db';

// Initialize Supabase client for auth verification
const getSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseAnonKey);
};

/**
 * Get Cart Items API
 * Retrieves all cart items for the authenticated user
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }

    // Also try to get user from cookies
    if (!userId) {
      const accessToken = request.cookies.get('sb-access-token')?.value;
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (user && !error) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', needsAuth: true },
        { status: 401 }
      );
    }

    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            id: true,
            title: true,
            slug: true,
            images: true,
          },
        },
        variant: {
          select: {
            id: true,
            sku: true,
            color: true,
            size: true,
            price: true,
            mrp: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const subtotal = cartItems.reduce((sum, item) => {
      return sum + (Number(item.variant.price) * item.quantity);
    }, 0);

    const totalItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      items: cartItems,
      subtotal,
      totalItems,
      itemCount: cartItems.length,
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      { error: 'Failed to fetch cart' },
      { status: 500 }
    );
  }
}

/**
 * Add to Cart API
 * Adds an item to cart or updates quantity if already exists
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }

    // Also try to get user from cookies
    if (!userId) {
      const accessToken = request.cookies.get('sb-access-token')?.value;
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (user && !error) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Please sign in to add items to cart', needsAuth: true },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { variantId, productId, quantity = 1 } = body;

    if (!variantId) {
      return NextResponse.json(
        { error: 'Variant ID is required' },
        { status: 400 }
      );
    }

    // Get the variant to find the product ID if not provided
    let actualProductId = productId;
    if (!actualProductId) {
      const variant = await prisma.variant.findUnique({
        where: { id: variantId },
        select: { productId: true },
      });
      
      if (!variant) {
        return NextResponse.json(
          { error: 'Variant not found' },
          { status: 404 }
        );
      }
      actualProductId = variant.productId;
    }

    // Check if item already exists in cart
    const existingItem = await prisma.cartItem.findUnique({
      where: {
        userId_variantId: {
          userId,
          variantId,
        },
      },
    });

    let cartItem;

    if (existingItem) {
      // Update quantity
      cartItem = await prisma.cartItem.update({
        where: {
          id: existingItem.id,
        },
        data: {
          quantity: existingItem.quantity + quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
              color: true,
              size: true,
              price: true,
              mrp: true,
            },
          },
        },
      });
    } else {
      // Create new cart item
      cartItem = await prisma.cartItem.create({
        data: {
          userId,
          productId: actualProductId,
          variantId,
          quantity,
        },
        include: {
          product: {
            select: {
              id: true,
              title: true,
              slug: true,
              images: true,
            },
          },
          variant: {
            select: {
              id: true,
              sku: true,
              color: true,
              size: true,
              price: true,
              mrp: true,
            },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      item: cartItem,
      message: existingItem ? 'Cart updated' : 'Added to cart',
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      { error: 'Failed to add to cart' },
      { status: 500 }
    );
  }
}

/**
 * Delete from Cart API
 * Removes an item from cart
 */
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseClient();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Authentication not configured' },
        { status: 500 }
      );
    }

    // Get the authorization header
    const authHeader = request.headers.get('authorization');
    let userId: string | null = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (user && !error) {
        userId = user.id;
      }
    }

    // Also try to get user from cookies
    if (!userId) {
      const accessToken = request.cookies.get('sb-access-token')?.value;
      if (accessToken) {
        const { data: { user }, error } = await supabase.auth.getUser(accessToken);
        if (user && !error) {
          userId = user.id;
        }
      }
    }

    if (!userId) {
      return NextResponse.json(
        { error: 'Authentication required', needsAuth: true },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
        { status: 400 }
      );
    }

    // Verify the item belongs to the user
    const cartItem = await prisma.cartItem.findFirst({
      where: {
        id: itemId,
        userId,
      },
    });

    if (!cartItem) {
      return NextResponse.json(
        { error: 'Cart item not found' },
        { status: 404 }
      );
    }

    await prisma.cartItem.delete({
      where: { id: itemId },
    });

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart',
    });
  } catch (error) {
    console.error('Error removing from cart:', error);
    return NextResponse.json(
      { error: 'Failed to remove item from cart' },
      { status: 500 }
    );
  }
}
