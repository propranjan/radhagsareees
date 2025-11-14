/**
 * Supabase Configuration for Web App
 * Client-side configuration with authentication
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@radhagsareees/db';

// Environment validation
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase environment variables. Please check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.'
  );
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// Authentication helpers
export const auth = {
  async signUp(email: string, password: string, options?: { data?: Record<string, any> }) {
    return await supabase.auth.signUp({
      email,
      password,
      options,
    });
  },

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signInWithProvider(provider: 'google' | 'github' | 'facebook') {
    return await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async resetPassword(email: string) {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`,
    });
  },

  async getUser() {
    return await supabase.auth.getUser();
  },

  async getSession() {
    return await supabase.auth.getSession();
  },

  onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

// Database helpers
export const db = {
  from: (table: keyof Database['public']['Tables']) => supabase.from(table),
  
  // Real-time subscriptions
  subscribe: (table: keyof Database['public']['Tables'], callback: (payload: any) => void) => {
    return supabase
      .channel(`${table}_changes`)
      .on('postgres_changes', { event: '*', schema: 'public', table }, callback)
      .subscribe();
  },
  
  // File storage
  storage: supabase.storage,
};

export default supabase;