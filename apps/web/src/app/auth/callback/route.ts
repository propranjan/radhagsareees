import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '@radhagsareees/db';

/**
 * Auth Callback Handler
 * Handles OAuth callbacks from providers (Google, GitHub, etc.)
 * and Supabase authentication redirects
 * Also creates/updates user records in the database
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

  // Log all parameters for debugging
  console.log('Auth callback received:', {
    code: code ? 'present' : 'missing',
    error,
    error_description,
    allParams: Object.fromEntries(requestUrl.searchParams.entries()),
    fullUrl: requestUrl.toString(),
  });

  // Handle OAuth errors
  if (error) {
    console.error('OAuth error:', error, error_description);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', error);
    if (error_description) {
      errorUrl.searchParams.set('message', error_description);
    }
    return NextResponse.redirect(errorUrl);
  }

  if (!code) {
    console.error('Missing authorization code in callback');
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'missing_code');
    errorUrl.searchParams.set('message', 'No authorization code received from OAuth provider. This may indicate the provider is not properly configured in Supabase.');
    return NextResponse.redirect(errorUrl);
  }

  // Get Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Supabase credentials not configured');
    return NextResponse.redirect(new URL('/auth/error?error=server_error', request.url));
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Exchange the code for a session
  console.log('Exchanging code for session...');
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'exchange_failed');
    errorUrl.searchParams.set('message', exchangeError.message || 'Failed to exchange authorization code for session');
    return NextResponse.redirect(errorUrl);
  }

  if (!data.session) {
    console.error('No session returned after code exchange');
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', 'no_session');
    errorUrl.searchParams.set('message', 'Authentication succeeded but no session was created. Please try again.');
    return NextResponse.redirect(errorUrl);
  }

  console.log('Session created successfully for user:', data.user?.id);

  // Sync user to database
  if (data.user) {
    try {
      await prisma.user.upsert({
        where: { id: data.user.id },
        update: {
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          phone: data.user.phone || null,
          updatedAt: new Date(),
        },
        create: {
          id: data.user.id,
          email: data.user.email || '',
          name: data.user.user_metadata?.full_name || data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'User',
          avatar: data.user.user_metadata?.avatar_url || data.user.user_metadata?.picture || null,
          phone: data.user.phone || null,
          role: 'CUSTOMER',
          isActive: true,
        },
      });
      console.log('User synced to database:', data.user.id);
    } catch (dbError) {
      console.error('Error syncing user to database:', dbError);
      // Don't fail the auth flow if DB sync fails
    }
  }

  // Get the next URL from query params or default to home
  const next = requestUrl.searchParams.get('next') || '/';
  const redirectUrl = new URL(next, request.url);

  // Create response with redirect
  const response = NextResponse.redirect(redirectUrl);

  // Set the session cookies
  if (data.session) {
    response.cookies.set('sb-access-token', data.session.access_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: data.session.expires_in,
    });

    response.cookies.set('sb-refresh-token', data.session.refresh_token, {
      path: '/',
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });
  }

  return response;
}
