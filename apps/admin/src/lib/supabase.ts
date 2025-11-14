/**
 * Supabase Configuration for Admin App
 * Server-side configuration with service role access
 */

import { createClient } from '@supabase/supabase-js';
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
      return await supabaseAdmin.from('User').select('*');
    },
    
    async get(id: string) {
      return await supabaseAdmin.from('User').select('*').eq('id', id).single();
    },
    
    async update(id: string, data: any) {
      return await supabaseAdmin.from('User').update(data).eq('id', id);
    },
    
    async delete(id: string) {
      return await supabaseAdmin.from('User').delete().eq('id', id);
    },
  },
  
  // Product management
  products: {
    async list() {
      return await supabaseAdmin.from('Product').select('*');
    },
    
    async create(product: any) {
      return await supabaseAdmin.from('Product').insert(product);
    },
    
    async update(id: string, data: any) {
      return await supabaseAdmin.from('Product').update(data).eq('id', id);
    },
    
    async delete(id: string) {
      return await supabaseAdmin.from('Product').delete().eq('id', id);
    },
  },
  
  // Review moderation
  reviews: {
    async getPending() {
      return await supabaseAdmin
        .from('Review')
        .select('*, User(name, email), Product(name)')
        .eq('moderationStatus', 'PENDING');
    },
    
    async moderate(id: string, status: 'APPROVED' | 'REJECTED', moderatorId: string) {
      return await supabaseAdmin
        .from('Review')
        .update({
          moderationStatus: status,
          moderatedBy: moderatorId,
          moderatedAt: new Date().toISOString(),
        })
        .eq('id', id);
    },
  },
  
  // Analytics queries
  analytics: {
    async getOrderStats() {
      return await supabaseAdmin
        .from('Order')
        .select('status, total, createdAt');
    },
    
    async getProductStats() {
      return await supabaseAdmin
        .from('Product')
        .select('category, price, createdAt');
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
    const { data: user, error: userError } = await supabaseAdmin
      .from('User')
      .select('role')
      .eq('id', data.user.id)
      .single();
    
    if (userError || !user || !['ADMIN', 'MODERATOR'].includes(user.role)) {
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