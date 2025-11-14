/**
 * Supabase Configuration for Admin App
 * Server-side configuration with service role access
 */

import { createClient } from '@supabase/supabase-js';
import { adminFrom } from '@radhagsareees/db';
import type { Database } from '@radhagsareees/db';

// Environment validation
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || (!supabaseServiceKey && !supabaseAnonKey)) {
  throw new Error(
    'Missing Supabase environment variables. Please check SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.'
  );
}

// Admin client with service role (full access)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceKey || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

// Regular client for user authentication
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey || '',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
    },
  }
);

// Admin database operations (bypasses RLS)
export const adminDb = {
  from: (table: keyof Database['public']['Tables']) => supabaseAdmin.from(table),
  
  // User management
  users: {
    async list() {
      return await adminFrom('users').select('*');
    },
    
    async get(id: string) {
      return await adminFrom('users').select('*').eq('id', id).single();
    },
    
    async update(id: string, data: any) {
      return await adminFrom('users').update(data).eq('id', id);
    },
    
    async delete(id: string) {
      return await adminFrom('users').delete().eq('id', id);
    },
  },
  
  // Product management
  products: {
    async list() {
      return await adminFrom('products').select('*');
    },
    
    async create(product: any) {
      return await adminFrom('products').insert(product);
    },
    
    async update(id: string, data: any) {
      return await adminFrom('products').update(data).eq('id', id);
    },
    
    async delete(id: string) {
      return await adminFrom('products').delete().eq('id', id);
    },
  },
  
  // Review moderation
  reviews: {
    async getPending() {
      return await adminFrom('reviews')
        .select('*')
        .eq('status', 'PENDING');
    },
    
    async moderate(id: string, status: 'APPROVED' | 'REJECTED', moderatorId: string) {
      return await adminFrom('reviews')
        .update({
          status,
          moderatorId,
          moderatedAt: new Date().toISOString(),
        })
        .eq('id', id);
    },
  },
  
  // Analytics queries
  analytics: {
    async getOrderStats() {
      return await adminFrom('orders')
        .select('status, amount, createdAt');
    },
    
    async getProductStats() {
      return await adminFrom('products')
        .select('categoryId, createdAt');
    },
  },
};

// Authentication for admin users
export const adminAuth = {
  async signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) return { data: null, error };
    
    // Check if user is admin
    const { data: user, error: userError } = await adminFrom('users')
      .select('role')
      .eq('id', data.user.id)
      .single();
    
    if (userError || !user || !['ADMIN', 'STAFF', 'MANAGER'].includes(user.role)) {
      await supabase.auth.signOut();
      return { 
        data: null, 
        error: { message: 'Unauthorized: Admin access required' } 
      };
    }
    
    return { data, error: null };
  },
  
  async getCurrentUser() {
    return await supabase.auth.getUser();
  },
  
  async signOut() {
    return await supabase.auth.signOut();
  },
};

export default supabaseAdmin;