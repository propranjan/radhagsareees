/**
 * Supabase Client Configuration
 * Provides typed Supabase client with authentication
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types/supabase';

type Client = ReturnType<typeof createClient<Database>>;

const getSupabaseUrl = () => process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const getSupabaseAnonKey = () => process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const getSupabaseServiceRoleKey = () => process.env.SUPABASE_SERVICE_ROLE_KEY;

let cachedClient: Client | null = null;
let cachedAdminClient: Client | null = null;

function requirePublicSupabaseEnv() {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();

  if (!url || !anonKey) {
    throw new Error(
      'Missing Supabase environment variables. Please set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY).'
    );
  }

  return { url, anonKey };
}

function requireAdminSupabaseEnv() {
  const url = getSupabaseUrl();
  const serviceRoleKey = getSupabaseServiceRoleKey();

  if (!url || !serviceRoleKey) {
    throw new Error(
      'Missing Supabase admin environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
    );
  }

  return { url, serviceRoleKey };
}

function getOrCreateSupabaseClient(): Client {
  if (cachedClient) return cachedClient;
  const { url, anonKey } = requirePublicSupabaseEnv();
  cachedClient = createClient<Database>(url, anonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  });
  return cachedClient;
}

function getOrCreateSupabaseAdminClient(): Client {
  if (cachedAdminClient) return cachedAdminClient;
  const { url, serviceRoleKey } = requireAdminSupabaseEnv();
  cachedAdminClient = createClient<Database>(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return cachedAdminClient;
}

// Proxies preserve the existing exported API shape while avoiding throwing at module import time.
export const supabase: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getOrCreateSupabaseClient();
    return (client as any)[prop];
  },
});

export const supabaseAdmin: Client = new Proxy({} as Client, {
  get(_target, prop) {
    const client = getOrCreateSupabaseAdminClient();
    return (client as any)[prop];
  },
});

// Types for better TypeScript experience
export type SupabaseClient = typeof supabase;
export type SupabaseAdminClient = typeof supabaseAdmin;

// Helper function to check if running on server (avoid DOM types)
export const isServer = typeof (globalThis as any).window === 'undefined';

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