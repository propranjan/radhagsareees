import { describe, it, expect } from '@jest/globals';
import { 
  productSchema, 
  variantSchema, 
  inventorySchema, 
  inventorySyncSchema, 
  productCreationSchema 
} from '../validations';

describe('Validation Schemas', () => {
  describe('productSchema', () => {
    const validProduct = {
      title: 'Test Saree',
      slug: 'test-saree',
      description: 'A beautiful test saree',
      care: 'Dry clean only',
      images: ['https://example.com/image1.jpg'],
      categoryId: 'cat-123',
      isActive: true,
      isNew: false,
      isFeatured: false,
    };

    it('should validate a correct product', () => {
      const result = productSchema.safeParse(validProduct);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalid = { ...validProduct, title: '' };
      const result = productSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => issue.path.includes('title'))).toBe(true);
      }
    });

    it('should validate slug format', () => {
      const invalidSlug1 = { ...validProduct, slug: 'Invalid Slug With Spaces' };
      const invalidSlug2 = { ...validProduct, slug: 'invalid_slug_with_underscores' };
      const invalidSlug3 = { ...validProduct, slug: 'invalid-slug-with-CAPITALS' };

      expect(productSchema.safeParse(invalidSlug1).success).toBe(false);
      expect(productSchema.safeParse(invalidSlug2).success).toBe(false);
      expect(productSchema.safeParse(invalidSlug3).success).toBe(false);

      const validSlug = { ...validProduct, slug: 'valid-slug-123' };
      expect(productSchema.safeParse(validSlug).success).toBe(true);
    });

    it('should require at least one image', () => {
      const noImages = { ...validProduct, images: [] };
      const result = productSchema.safeParse(noImages);
      expect(result.success).toBe(false);
    });

    it('should validate image URLs', () => {
      const invalidImages = { ...validProduct, images: ['not-a-url', 'also-invalid'] };
      const result = productSchema.safeParse(invalidImages);
      expect(result.success).toBe(false);

      const validImages = { 
        ...validProduct, 
        images: ['https://example.com/image1.jpg', 'https://example.com/image2.png'] 
      };
      expect(productSchema.safeParse(validImages).success).toBe(true);
    });

    it('should enforce string length limits', () => {
      const longTitle = 'a'.repeat(201);
      const longDescription = 'a'.repeat(2001);
      const longCare = 'a'.repeat(501);

      expect(productSchema.safeParse({ ...validProduct, title: longTitle }).success).toBe(false);
      expect(productSchema.safeParse({ ...validProduct, description: longDescription }).success).toBe(false);
      expect(productSchema.safeParse({ ...validProduct, care: longCare }).success).toBe(false);
    });

    it('should have default values for boolean fields', () => {
      const minimal = {
        title: 'Test',
        slug: 'test',
        description: 'Test description',
        care: 'Test care',
        images: ['https://example.com/test.jpg'],
        categoryId: 'cat-123',
      };

      const result = productSchema.safeParse(minimal);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.isActive).toBe(true);
        expect(result.data.isNew).toBe(false);
        expect(result.data.isFeatured).toBe(false);
      }
    });
  });

  describe('variantSchema', () => {
    const validVariant = {
      sku: 'TEST-SKU-001',
      color: 'Red',
      size: 'Free Size',
      mrp: 1000,
      price: 800,
      productId: 'prod-123',
    };

    it('should validate a correct variant', () => {
      const result = variantSchema.safeParse(validVariant);
      expect(result.success).toBe(true);
    });

    it('should require all fields', () => {
      const required = ['sku', 'color', 'size', 'mrp', 'price', 'productId'];
      
      required.forEach(field => {
        const invalid = { ...validVariant };
        delete invalid[field as keyof typeof invalid];
        const result = variantSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });

    it('should validate price constraints', () => {
      // Negative prices
      expect(variantSchema.safeParse({ ...validVariant, mrp: -100 }).success).toBe(false);
      expect(variantSchema.safeParse({ ...validVariant, price: -50 }).success).toBe(false);

      // Price higher than MRP
      const higherPrice = { ...validVariant, mrp: 800, price: 1000 };
      const result = variantSchema.safeParse(higherPrice);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('price') && issue.message.includes('higher than MRP')
        )).toBe(true);
      }
    });

    it('should allow price equal to MRP', () => {
      const equalPrice = { ...validVariant, mrp: 1000, price: 1000 };
      expect(variantSchema.safeParse(equalPrice).success).toBe(true);
    });

    it('should enforce maximum price limits', () => {
      const tooHigh = { ...validVariant, mrp: 2000000, price: 1500000 };
      expect(variantSchema.safeParse(tooHigh).success).toBe(false);
    });

    it('should validate string length limits', () => {
      const longSku = 'A'.repeat(51);
      const longColor = 'A'.repeat(51);
      const longSize = 'A'.repeat(21);

      expect(variantSchema.safeParse({ ...validVariant, sku: longSku }).success).toBe(false);
      expect(variantSchema.safeParse({ ...validVariant, color: longColor }).success).toBe(false);
      expect(variantSchema.safeParse({ ...validVariant, size: longSize }).success).toBe(false);
    });
  });

  describe('inventorySchema', () => {
    const validInventory = {
      variantId: 'variant-123',
      qtyAvailable: 50,
      lowStockThreshold: 5,
    };

    it('should validate correct inventory data', () => {
      const result = inventorySchema.safeParse(validInventory);
      expect(result.success).toBe(true);
    });

    it('should require all fields', () => {
      const required = ['variantId', 'qtyAvailable', 'lowStockThreshold'];
      
      required.forEach(field => {
        const invalid = { ...validInventory };
        delete invalid[field as keyof typeof invalid];
        const result = inventorySchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });

    it('should validate quantity constraints', () => {
      // Negative quantities should be rejected
      expect(inventorySchema.safeParse({ 
        ...validInventory, 
        qtyAvailable: -1 
      }).success).toBe(false);
      
      expect(inventorySchema.safeParse({ 
        ...validInventory, 
        lowStockThreshold: -1 
      }).success).toBe(false);

      // Very high quantities should be rejected
      expect(inventorySchema.safeParse({ 
        ...validInventory, 
        qtyAvailable: 20000 
      }).success).toBe(false);
      
      expect(inventorySchema.safeParse({ 
        ...validInventory, 
        lowStockThreshold: 200 
      }).success).toBe(false);
    });

    it('should allow zero quantities', () => {
      const zeroQty = { ...validInventory, qtyAvailable: 0, lowStockThreshold: 0 };
      expect(inventorySchema.safeParse(zeroQty).success).toBe(true);
    });

    it('should allow maximum valid quantities', () => {
      const maxQty = { ...validInventory, qtyAvailable: 10000, lowStockThreshold: 100 };
      expect(inventorySchema.safeParse(maxQty).success).toBe(true);
    });
  });

  describe('inventorySyncSchema', () => {
    const validSync = {
      updates: [
        {
          variantId: 'variant-1',
          qtyAvailable: 50,
          lowStockThreshold: 5,
        },
        {
          variantId: 'variant-2', 
          qtyAvailable: 25,
          lowStockThreshold: 3,
        },
      ],
      adminUserId: 'admin-123',
      timestamp: Date.now(),
      signature: 'valid-signature-hash',
    };

    it('should validate correct sync data', () => {
      const result = inventorySyncSchema.safeParse(validSync);
      expect(result.success).toBe(true);
    });

    it('should require at least one update', () => {
      const noUpdates = { ...validSync, updates: [] };
      const result = inventorySyncSchema.safeParse(noUpdates);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.path.includes('updates') && issue.message.includes('at least one')
        )).toBe(true);
      }
    });

    it('should validate timestamp constraints', () => {
      const now = Date.now();
      
      // Very old timestamp (more than 5 minutes)
      const oldTimestamp = { ...validSync, timestamp: now - 400000 };
      expect(inventorySyncSchema.safeParse(oldTimestamp).success).toBe(false);

      // Future timestamp (more than 1 minute)
      const futureTimestamp = { ...validSync, timestamp: now + 120000 };
      expect(inventorySyncSchema.safeParse(futureTimestamp).success).toBe(false);

      // Valid timestamp (within 5 minutes)
      const validTimestamp = { ...validSync, timestamp: now - 60000 };
      expect(inventorySyncSchema.safeParse(validTimestamp).success).toBe(true);
    });

    it('should validate individual update objects', () => {
      const invalidUpdate = {
        ...validSync,
        updates: [
          {
            variantId: '', // Invalid empty variantId
            qtyAvailable: -5, // Invalid negative quantity
            lowStockThreshold: 5,
          },
        ],
      };

      const result = inventorySyncSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should require all sync fields', () => {
      const required = ['updates', 'adminUserId', 'timestamp', 'signature'];
      
      required.forEach(field => {
        const invalid = { ...validSync };
        delete invalid[field as keyof typeof invalid];
        const result = inventorySyncSchema.safeParse(invalid);
        expect(result.success).toBe(false);
      });
    });
  });

  describe('productCreationSchema', () => {
    const validCreation = {
      product: {
        title: 'Test Saree',
        slug: 'test-saree',
        description: 'A beautiful test saree',
        care: 'Dry clean only',
        images: ['https://example.com/image1.jpg'],
        categoryId: 'cat-123',
        isActive: true,
        isNew: false,
        isFeatured: false,
      },
      variants: [
        {
          sku: 'TEST-SKU-001',
          color: 'Red',
          size: 'Free Size',
          mrp: 1000,
          price: 800,
          inventory: {
            qtyAvailable: 50,
            lowStockThreshold: 5,
          },
        },
      ],
    };

    it('should validate complete product creation data', () => {
      const result = productCreationSchema.safeParse(validCreation);
      expect(result.success).toBe(true);
    });

    it('should require at least one variant', () => {
      const noVariants = { ...validCreation, variants: [] };
      const result = productCreationSchema.safeParse(noVariants);
      expect(result.success).toBe(false);
    });

    it('should validate nested product data', () => {
      const invalidProduct = {
        ...validCreation,
        product: {
          ...validCreation.product,
          title: '', // Invalid empty title
        },
      };

      const result = productCreationSchema.safeParse(invalidProduct);
      expect(result.success).toBe(false);
    });

    it('should validate nested variant data', () => {
      const invalidVariant = {
        ...validCreation,
        variants: [
          {
            ...validCreation.variants[0],
            price: -100, // Invalid negative price
          },
        ],
      };

      const result = productCreationSchema.safeParse(invalidVariant);
      expect(result.success).toBe(false);
    });

    it('should validate nested inventory data', () => {
      const invalidInventory = {
        ...validCreation,
        variants: [
          {
            ...validCreation.variants[0],
            inventory: {
              qtyAvailable: -5, // Invalid negative quantity
              lowStockThreshold: 5,
            },
          },
        ],
      };

      const result = productCreationSchema.safeParse(invalidInventory);
      expect(result.success).toBe(false);
    });

    it('should validate multiple variants correctly', () => {
      const multipleVariants = {
        ...validCreation,
        variants: [
          validCreation.variants[0],
          {
            sku: 'TEST-SKU-002',
            color: 'Blue',
            size: 'Free Size',
            mrp: 1200,
            price: 1000,
            inventory: {
              qtyAvailable: 30,
              lowStockThreshold: 3,
            },
          },
          {
            sku: 'TEST-SKU-003',
            color: 'Green',
            size: 'Free Size',
            mrp: 900,
            price: 750,
            inventory: {
              qtyAvailable: 40,
              lowStockThreshold: 4,
            },
          },
        ],
      };

      const result = productCreationSchema.safeParse(multipleVariants);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.variants).toHaveLength(3);
      }
    });
  });

  describe('Edge Cases and Error Messages', () => {
    it('should provide clear error messages for validation failures', () => {
      const invalid = {
        title: '',
        slug: 'Invalid Slug With Spaces',
        description: '',
        care: '',
        images: [],
        categoryId: '',
      };

      const result = productSchema.safeParse(invalid);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const errorMessages = result.error.issues.map(issue => issue.message);
        expect(errorMessages).toContain('Title is required');
        expect(errorMessages.some(msg => msg.includes('slug'))).toBe(true);
        expect(errorMessages).toContain('Description is required');
        expect(errorMessages).toContain('Care instructions required');
        expect(errorMessages).toContain('At least one image required');
        expect(errorMessages).toContain('Category is required');
      }
    });

    it('should handle type coercion correctly', () => {
      const withStringNumbers = {
        sku: 'TEST-SKU',
        color: 'Red',
        size: 'Free Size',
        mrp: '1000', // String instead of number
        price: '800', // String instead of number  
        productId: 'prod-123',
      };

      // Should fail without type coercion
      const result = variantSchema.safeParse(withStringNumbers);
      expect(result.success).toBe(false);
    });

    it('should validate boundary values correctly', () => {
      // Test exact boundary values
      const boundaryProduct = {
        title: 'a'.repeat(200), // Exactly at limit
        slug: 'a'.repeat(100), // Exactly at limit
        description: 'a'.repeat(2000), // Exactly at limit
        care: 'a'.repeat(500), // Exactly at limit
        images: ['https://example.com/image.jpg'],
        categoryId: 'cat-123',
        isActive: true,
        isNew: false,
        isFeatured: false,
      };

      expect(productSchema.safeParse(boundaryProduct).success).toBe(true);

      // Test exceeding boundaries by 1
      const exceedingProduct = {
        ...boundaryProduct,
        title: 'a'.repeat(201), // One over limit
      };

      expect(productSchema.safeParse(exceedingProduct).success).toBe(false);
    });
  });
});