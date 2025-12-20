import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

/**
 * OAuth Consent Handler
 * This endpoint handles OAuth authorization requests from Supabase
 * Used when Supabase is configured as an OAuth provider
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const client_id = searchParams.get('client_id');
  const redirect_uri = searchParams.get('redirect_uri');
  const response_type = searchParams.get('response_type');
  const scope = searchParams.get('scope');
  const state = searchParams.get('state');

  // Validate required OAuth parameters
  if (!client_id || !redirect_uri || !response_type) {
    return NextResponse.json(
      { error: 'invalid_request', error_description: 'Missing required OAuth parameters' },
      { status: 400 }
    );
  }

  // Get Supabase client
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: 'server_error', error_description: 'Supabase not configured' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Check if user is authenticated
  try {
    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      // User not authenticated - redirect to login with return URL
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('redirect_uri', redirect_uri);
      loginUrl.searchParams.set('client_id', client_id);
      if (state) loginUrl.searchParams.set('state', state);
      if (scope) loginUrl.searchParams.set('scope', scope);

      return NextResponse.redirect(loginUrl);
    }
  } catch (err) {
    console.error('Error checking user auth:', err);
    return NextResponse.json(
      { error: 'server_error', error_description: 'Authentication check failed' },
      { status: 500 }
    );
  }

  // User is authenticated - show consent page or auto-approve
  // For now, we'll auto-approve and redirect back with authorization code
  
  // In production, you'd:
  // 1. Validate the client_id against registered OAuth clients
  // 2. Show a consent screen asking user to approve scopes
  // 3. Generate an authorization code after user approval

  // For this implementation, we'll redirect back to the redirect_uri
  const callbackUrl = new URL(redirect_uri);
  
  // Add authorization code or token based on response_type
  if (response_type === 'code') {
    // Generate authorization code (in production, store this securely)
    const authCode = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    callbackUrl.searchParams.set('code', authCode);
  } else if (response_type === 'token') {
    // Implicit flow - return access token directly
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      callbackUrl.hash = `access_token=${session.access_token}&token_type=bearer`;
    }
  }

  if (state) {
    callbackUrl.searchParams.set('state', state);
  }

  return NextResponse.redirect(callbackUrl);
}

/**
 * POST handler for consent form submission
 */
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { client_id, redirect_uri, scope, approved, state } = body;

  if (!approved) {
    // User denied consent
    const callbackUrl = new URL(redirect_uri);
    callbackUrl.searchParams.set('error', 'access_denied');
    callbackUrl.searchParams.set('error_description', 'User denied authorization');
    if (state) callbackUrl.searchParams.set('state', state);

    return NextResponse.json({ redirect: callbackUrl.toString() });
  }

  // User approved - generate authorization code
  const authCode = `auth_${Date.now()}_${Math.random().toString(36).substring(7)}`;
  
  const callbackUrl = new URL(redirect_uri);
  callbackUrl.searchParams.set('code', authCode);
  if (state) callbackUrl.searchParams.set('state', state);

  return NextResponse.json({ redirect: callbackUrl.toString() });
}
