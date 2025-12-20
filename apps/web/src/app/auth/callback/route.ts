import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * Auth Callback Handler
 * Handles OAuth callbacks from providers (Google, GitHub, etc.)
 * and Supabase authentication redirects
 */
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');

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
    return NextResponse.redirect(new URL('/auth/error?error=missing_code', request.url));
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
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error('Error exchanging code for session:', exchangeError);
    const errorUrl = new URL('/auth/error', request.url);
    errorUrl.searchParams.set('error', exchangeError.message);
    return NextResponse.redirect(errorUrl);
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
