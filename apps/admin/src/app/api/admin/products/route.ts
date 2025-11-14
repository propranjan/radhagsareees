import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@radhagsareees/db';
import { productCreationSchema } from '../../../../lib/validations';

const prisma = new PrismaClient();

/**
 * GET /api/admin/products
 * List all products with variants and inventory
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const status = searchParams.get('status') || '';

    // Build where clause
    const where: any = {};
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { slug: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    } else if (status === 'new') {
      where.isNew = true;
    } else if (status === 'featured') {
      where.isFeatured = true;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: {
            include: {
              inventory: { select: { qtyAvailable: true, lowStockThreshold: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    return NextResponse.json({
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * POST /api/admin/products
 * Create a new product with variants and inventory
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request data
    const validatedData = productCreationSchema.parse(body);

    // Create product with variants and inventory in a transaction
    const product = await prisma.$transaction(async (tx) => {
      // Create the product
      const newProduct = await tx.product.create({
        data: {
          title: validatedData.product.title,
          slug: validatedData.product.slug,
          description: validatedData.product.description,
          care: validatedData.product.care,
          images: validatedData.product.images,
          categoryId: validatedData.product.categoryId,
          isActive: validatedData.product.isActive,
          isNew: validatedData.product.isNew,
          isFeatured: validatedData.product.isFeatured,
        },
      });

      // Create variants with inventory
      for (const variantData of validatedData.variants) {
        await tx.variant.create({
          data: {
            productId: newProduct.id,
            sku: variantData.sku,
            color: variantData.color,
            size: variantData.size,
            mrp: variantData.mrp,
            price: variantData.price,
            inventory: {
              create: {
                qtyAvailable: variantData.inventory.qtyAvailable,
                lowStockThreshold: variantData.inventory.lowStockThreshold,
              },
            },
          },
        });
      }

      // Return the complete product with variants
      return tx.product.findUnique({
        where: { id: newProduct.id },
        include: {
          category: { select: { id: true, name: true, slug: true } },
          variants: {
            include: {
              inventory: true,
            },
          },
        },
      });
    });

    return NextResponse.json(product, { status: 201 });

  } catch (error) {
    console.error('Failed to create product:', error);
    const anyError = error as any;
    if (anyError && anyError.code === 'P2002') {
      return NextResponse.json(
        { error: 'Product with this slug already exists' },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to create product' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}