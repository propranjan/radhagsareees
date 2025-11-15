import { NextResponse } from 'next/server';
import { PrismaClient } from '@radhagsareees/db';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const categories = await prisma.category.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return NextResponse.json({
      categories: categories.map((cat) => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        productCount: cat._count.products,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
