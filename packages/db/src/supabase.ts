/**
 * Supabase Client Configuration
 * Provides typed Supabase client with authentication
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

// Environment validation
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_ANON_KEY.');
}

// Client-side Supabase client (browser-safe)
export const supabase = createClient<Database>(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Server-side Supabase client (with service role key)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Types for better TypeScript experience
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

// Helper function to check if running on server
export const isServer = typeof window === 'undefined';

// Get appropriate client based on environment
export const getSupabaseClient = (admin = false) => {
  if (admin && isServer) {
    return supabaseAdmin;
  }
  return supabase;
};

// Auth helpers
export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  return { user, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

// Database helpers with proper typing
export const from = (table: keyof Database['public']['Tables']): any => {
  return supabase.from(table as any);
};

export const adminFrom = (table: keyof Database['public']['Tables']): any => {
  return supabaseAdmin.from(table as any);
};