import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

/**
 * User Sync API
 * Syncs authenticated user data to the database
 * Called after successful authentication
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, email, name, avatar, phone } = body;

    if (!id || !email) {
      return NextResponse.json(
        { error: 'Missing required fields: id and email' },
        { status: 400 }
      );
    }

    // Upsert user in database
    const user = await prisma.user.upsert({
      where: { id },
      update: {
        email,
        name: name || email.split('@')[0],
        avatar: avatar || null,
        phone: phone || null,
        updatedAt: new Date(),
      },
      create: {
        id,
        email,
        name: name || email.split('@')[0],
        avatar: avatar || null,
        phone: phone || null,
        role: 'CUSTOMER',
        isActive: true,
      },
    });

    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      }
    });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { error: 'Failed to sync user to database' },
      { status: 500 }
    );
  }
}
