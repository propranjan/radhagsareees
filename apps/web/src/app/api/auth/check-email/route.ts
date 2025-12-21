import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';

// Force dynamic rendering - this route uses searchParams
export const dynamic = 'force-dynamic';

/**
 * Check Email API
 * Checks if an email address is already registered
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Check if user exists in database
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
      select: { id: true },
    });

    return NextResponse.json({ 
      exists: !!existingUser,
      email: email.toLowerCase(),
    });
  } catch (error) {
    console.error('Error checking email:', error);
    return NextResponse.json(
      { error: 'Failed to check email' },
      { status: 500 }
    );
  }
}
