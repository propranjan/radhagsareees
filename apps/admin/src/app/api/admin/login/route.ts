import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@radhagsareees/db';
import { createAdminToken } from '@/lib/auth';
import { createHash } from 'crypto';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/login
 * 
 * Admin login endpoint
 * Validates credentials and returns a session token
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    // Validate input
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: 'Email and password are required' },
        { status: 400 }
      );
    }

    // Check for development admin credentials first
    const devAdminEmail = process.env.ADMIN_EMAIL?.toLowerCase();
    const devAdminPassword = process.env.ADMIN_PASSWORD;

    if (email.toLowerCase() === devAdminEmail && password === devAdminPassword) {
      // Dev admin login - create or use existing user
      let user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
      });

      if (!user) {
        // Create admin user if doesn't exist (no password field in schema - uses Supabase Auth)
        user = await prisma.user.create({
          data: {
            email: email.toLowerCase(),
            name: 'Admin',
            role: 'ADMIN',
          },
        });
      } else if (user.role !== 'ADMIN') {
        // Update role to ADMIN if using dev credentials
        user = await prisma.user.update({
          where: { id: user.id },
          data: { role: 'ADMIN' },
        });
      }

      // Create session token
      const token = createAdminToken({
        id: user.id,
        email: user.email,
        name: user.name || 'Admin',
        role: 'ADMIN',
      });

      const response = NextResponse.json({
        success: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      });

      response.cookies.set('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 24 * 60 * 60,
        path: '/',
      });

      return response;
    }

    // For non-env credentials, check if user exists and is admin
    // Note: User model doesn't have password field (Supabase Auth is used for customer auth)
    // Admin login only works with env credentials
    return NextResponse.json(
      { success: false, error: 'Invalid credentials' },
      { status: 401 }
    );
  } catch (error) {
    console.error('[Admin Login] Error:', error);
    return NextResponse.json(
      { success: false, error: 'Login failed. Please try again.' },
      { status: 500 }
    );
  }
}
