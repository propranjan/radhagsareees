/**
 * Supabase Database Types
 * Generated from Prisma schema for type safety
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          avatar: string | null;
          phone: string | null;
          role: 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'MANAGER';
          isActive: boolean;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['users']['Row']> & {
          email: string;
          name: string;
        };
        Update: Partial<Database['public']['Tables']['users']['Row']>;
      };
      products: {
        Row: {
          id: string;
          slug: string;
          title: string;
          description: string;
          images: string[];
          care: string | null;
          ratingAvg: number | null;
          ratingCount: number;
          categoryId: string;
          isActive: boolean;
          isNew: boolean;
          isFeatured: boolean;
          metaTitle: string | null;
          metaDescription: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['products']['Row']> & {
          slug: string;
          title: string;
          description: string;
          images: string[];
          categoryId: string;
        };
        Update: Partial<Database['public']['Tables']['products']['Row']>;
      };
      reviews: {
        Row: {
          id: string;
          productId: string;
          userId: string;
          rating: number;
          title: string;
          comment: string;
          imageUrls: string[];
          status: 'PENDING' | 'APPROVED' | 'REJECTED';
          isVerified: boolean;
          helpfulCount: number;
          reportCount: number;
          riskScore: number | null;
          moderationFlags: string[] | null;
          moderatedAt: string | null;
          moderatorId: string | null;
          processingTimeHours: number | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['reviews']['Row']> & {
          productId: string;
          userId: string;
          rating: number;
          title: string;
          comment: string;
        };
        Update: Partial<Database['public']['Tables']['reviews']['Row']>;
      };
      orders: {
        Row: {
          id: string;
          userId: string;
          orderNumber: string;
          items: any;
          amount: number;
          status: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
          paymentRef: string | null;
          tax: number;
          shipping: number;
          discount: number;
          shippingAddressId: string | null;
          notes: string | null;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['orders']['Row']> & {
          userId: string;
          orderNumber: string;
          items: any;
          amount: number;
        };
        Update: Partial<Database['public']['Tables']['orders']['Row']>;
      };
      inventory: {
        Row: {
          id: string;
          variantId: string;
          qtyAvailable: number;
          lowStockThreshold: number;
          reservedQty: number;
          createdAt: string;
          updatedAt: string;
        };
        Insert: Partial<Database['public']['Tables']['inventory']['Row']> & {
          variantId: string;
        };
        Update: Partial<Database['public']['Tables']['inventory']['Row']>;
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      UserRole: 'CUSTOMER' | 'ADMIN' | 'STAFF' | 'MANAGER';
      OrderStatus: 'PENDING' | 'CONFIRMED' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'REFUNDED';
      ReviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
      PaymentStatus: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
    };
  };
}