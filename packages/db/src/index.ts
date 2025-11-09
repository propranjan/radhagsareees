import { PrismaClient } from '@prisma/client';

// Initialize Prisma client
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
});

// Re-export PrismaClient for direct use
export { PrismaClient };

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