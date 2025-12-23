import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Re-export PrismaClient for direct use
export { PrismaClient };

// Supabase exports
export {
  supabase,
  supabaseAdmin,
  getSupabaseClient,
  getCurrentUser,
  signOut,
  from,
  adminFrom,
  type SupabaseClient,
  type SupabaseAdminClient,
} from './supabase';

// Supabase types
export type { Database } from './types/supabase';

// Types
export type {
  User,
  Product,
  Category,
  Order,
  OrderItem,
  Review,
  CartItem,
  Wishlist,
  Address,
  Payment,
} from '@prisma/client';

// Product Catalog with Cloudinary integration
export * from './catalog';