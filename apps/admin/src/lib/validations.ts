import { z } from 'zod';

// Product validation schema
export const productSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  slug: z.string().min(1, 'Slug is required').max(100, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens'),
  description: z.string().min(1, 'Description is required').max(2000, 'Description too long'),
  care: z.string().min(1, 'Care instructions required').max(500, 'Care instructions too long'),
  images: z.array(z.string().url('Invalid image URL')).min(1, 'At least one image required'),
  categoryId: z.string().min(1, 'Category is required'),
  isActive: z.boolean().default(true),
  isNew: z.boolean().default(false),
  isFeatured: z.boolean().default(false),
});

export type ProductFormData = z.infer<typeof productSchema>;

// Variant validation schema
export const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
  color: z.string().min(1, 'Color is required').max(50, 'Color too long'),
  size: z.string().min(1, 'Size is required').max(20, 'Size too long'),
  mrp: z.number().min(0, 'MRP must be positive').max(1000000, 'MRP too high'),
  price: z.number().min(0, 'Price must be positive').max(1000000, 'Price too high'),
  productId: z.string().min(1, 'Product ID is required'),
}).refine((data) => data.price <= data.mrp, {
  message: 'Price cannot be higher than MRP',
  path: ['price'],
});

export type VariantFormData = z.infer<typeof variantSchema>;

// Inventory validation schema
export const inventorySchema = z.object({
  variantId: z.string().min(1, 'Variant ID is required'),
  qtyAvailable: z.number().min(0, 'Quantity must be non-negative').max(10000, 'Quantity too high'),
  lowStockThreshold: z.number().min(0, 'Threshold must be non-negative').max(100, 'Threshold too high'),
});

export type InventoryFormData = z.infer<typeof inventorySchema>;

// Inventory sync schema (for API endpoint)
export const inventorySyncSchema = z.object({
  updates: z.array(z.object({
    variantId: z.string().min(1),
    qtyAvailable: z.number().min(0).max(10000),
    lowStockThreshold: z.number().min(0).max(100),
  })).min(1, 'At least one update required'),
  adminUserId: z.string().min(1, 'Admin user ID required'),
  timestamp: z.number().min(0, 'Invalid timestamp'),
  signature: z.string().min(1, 'Signature required'),
});

export type InventorySyncData = z.infer<typeof inventorySyncSchema>;

// Combined product creation schema (with variants and inventory)
export const productCreationSchema = z.object({
  product: productSchema,
  variants: z.array(z.object({
    sku: z.string().min(1, 'SKU is required').max(50, 'SKU too long'),
    color: z.string().min(1, 'Color is required').max(50, 'Color too long'),
    size: z.string().min(1, 'Size is required').max(20, 'Size too long'),
    mrp: z.number().min(0, 'MRP must be positive').max(1000000, 'MRP too high'),
    price: z.number().min(0, 'Price must be positive').max(1000000, 'Price too high'),
    inventory: z.object({
      qtyAvailable: z.number().min(0, 'Quantity must be non-negative').max(10000, 'Quantity too high'),
      lowStockThreshold: z.number().min(0, 'Threshold must be non-negative').max(100, 'Threshold too high'),
    }),
  })).min(1, 'At least one variant required'),
});

export type ProductCreationData = z.infer<typeof productCreationSchema>;