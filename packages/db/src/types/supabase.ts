/**
 * Supabase Database Types
 * Generated from Prisma schema for type safety
 */

export interface Database {
  public: {
    Tables: {
      User: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'USER' | 'ADMIN' | 'MODERATOR';
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          email: string;
          name: string;
          role?: 'USER' | 'ADMIN' | 'MODERATOR';
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'USER' | 'ADMIN' | 'MODERATOR';
          createdAt?: string;
          updatedAt?: string;
        };
      };
      Product: {
        Row: {
          id: string;
          name: string;
          description: string;
          price: number;
          category: string;
          subcategory: string | null;
          fabric: string | null;
          color: string;
          pattern: string | null;
          occasion: string | null;
          brand: string | null;
          sku: string;
          slug: string;
          images: string[];
          overlayPng: string | null;
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          name: string;
          description: string;
          price: number;
          category: string;
          subcategory?: string | null;
          fabric?: string | null;
          color: string;
          pattern?: string | null;
          occasion?: string | null;
          brand?: string | null;
          sku: string;
          slug: string;
          images: string[];
          overlayPng?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string;
          price?: number;
          category?: string;
          subcategory?: string | null;
          fabric?: string | null;
          color?: string;
          pattern?: string | null;
          occasion?: string | null;
          brand?: string | null;
          sku?: string;
          slug?: string;
          images?: string[];
          overlayPng?: string | null;
          isActive?: boolean;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      Review: {
        Row: {
          id: string;
          userId: string;
          productId: string;
          rating: number;
          title: string | null;
          content: string;
          images: string[];
          isVerified: boolean;
          helpfulCount: number;
          moderationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
          moderatedBy: string | null;
          moderatedAt: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          productId: string;
          rating: number;
          title?: string | null;
          content: string;
          images?: string[];
          isVerified?: boolean;
          helpfulCount?: number;
          moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
          moderatedBy?: string | null;
          moderatedAt?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          productId?: string;
          rating?: number;
          title?: string | null;
          content?: string;
          images?: string[];
          isVerified?: boolean;
          helpfulCount?: number;
          moderationStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
          moderatedBy?: string | null;
          moderatedAt?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      Order: {
        Row: {
          id: string;
          userId: string;
          status: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
          total: number;
          currency: string;
          paymentIntentId: string | null;
          shippingAddress: any;
          billingAddress: any;
          trackingNumber: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          userId: string;
          status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
          total: number;
          currency?: string;
          paymentIntentId?: string | null;
          shippingAddress: any;
          billingAddress: any;
          trackingNumber?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          userId?: string;
          status?: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
          total?: number;
          currency?: string;
          paymentIntentId?: string | null;
          shippingAddress?: any;
          billingAddress?: any;
          trackingNumber?: string | null;
          createdAt?: string;
          updatedAt?: string;
        };
      };
      Inventory: {
        Row: {
          id: string;
          productId: string;
          size: string;
          qtyAvailable: number;
          qtyReserved: number;
          restockDate: string | null;
          lowStockThreshold: number;
          createdAt: string;
          updatedAt: string;
        };
        Insert: {
          id?: string;
          productId: string;
          size: string;
          qtyAvailable: number;
          qtyReserved?: number;
          restockDate?: string | null;
          lowStockThreshold?: number;
          createdAt?: string;
          updatedAt?: string;
        };
        Update: {
          id?: string;
          productId?: string;
          size?: string;
          qtyAvailable?: number;
          qtyReserved?: number;
          restockDate?: string | null;
          lowStockThreshold?: number;
          createdAt?: string;
          updatedAt?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      UserRole: 'USER' | 'ADMIN' | 'MODERATOR';
      OrderStatus: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      ModerationStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    };
  };
}