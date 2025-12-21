import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { createAdminToken } from '@/lib/auth';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/signup
 * 
 * Register a new admin user
 * Note: Admin authentication is handled via environment variables (ADMIN_EMAIL, ADMIN_PASSWORD)
 * This route creates the user record in the database for admin management
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, adminCode } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Verify admin code (prevents unauthorized signups)
    const validAdminCode = process.env.ADMIN_SIGNUP_CODE || 'RADHA_ADMIN_2024';
    if (adminCode !== validAdminCode) {
      return NextResponse.json(
        { error: 'Invalid admin registration code' },
        { status: 403 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'An account with this email already exists' },
        { status: 409 }
      );
    }

    // Create admin user (no password stored - admin auth via env vars)
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        role: 'ADMIN',
      },
    });

    // Create admin token
    const token = createAdminToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: 'ADMIN',
    });

    // Set cookie
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });

    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('[Admin Signup] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create account' },
      { status: 500 }
    );
  }
}
