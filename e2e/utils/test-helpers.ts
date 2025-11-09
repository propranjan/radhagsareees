// Polyfill TransformStream for Node.js compatibility
if (typeof globalThis.TransformStream === 'undefined') {
  try {
    const { TransformStream } = require('node:stream/web');
    globalThis.TransformStream = TransformStream;
  } catch {
    // Fallback if node:stream/web is not available
    (globalThis as any).TransformStream = class {
      readable: any = null;
      writable: any = null;
      constructor() {
        // Minimal implementation
      }
    };
  }
}

import { test as base, Page, expect } from '@playwright/test';
import { CatalogPage, ProductPage, TryOnModal, CartPage, CheckoutPage } from './page-objects';

/**
 * Test data fixtures for E2E testing
 */
export const testData = {
  customer: {
    name: 'John Doe',
    email: 'john.doe@test.com',
    phone: '+91 9876543210',
    address: '123 Test Street, Test Area',
    city: 'Mumbai',
    pincode: '400001',
  },
  
  admin: {
    email: 'admin@radhagsareees.com',
    password: 'admin123',
  },

  products: {
    saree: {
      name: 'Traditional Silk Saree',
      category: 'Sarees',
      color: 'Red',
      priceRange: '5000-10000',
      variants: ['Red-Large', 'Red-Medium'],
    },
    blouse: {
      name: 'Designer Blouse',
      category: 'Blouses', 
      color: 'Gold',
      priceRange: '2000-5000',
      variants: ['Gold-Medium', 'Gold-Large'],
    },
  },

  reviews: {
    positive: {
      rating: 5,
      title: 'Amazing quality!',
      body: 'The fabric is excellent and the stitching is perfect. Highly recommended!',
    },
    negative: {
      rating: 2,
      title: 'Not as expected',
      body: 'The color was different from the website photos.',
    },
  },

  search: {
    validQueries: ['saree', 'blouse', 'traditional', 'silk'],
    invalidQueries: ['xyz123', 'nonexistent'],
  },
};

/**
 * Extended test fixture with page objects
 */
type TestFixtures = {
  catalogPage: CatalogPage;
  productPage: ProductPage;
  tryOnModal: TryOnModal;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
  adminPage: Page;
};

export const test = base.extend<TestFixtures>({
  catalogPage: async ({ page }, use) => {
    await use(new CatalogPage(page));
  },
  
  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },
  
  tryOnModal: async ({ page }, use) => {
    await use(new TryOnModal(page));
  },
  
  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
  
  checkoutPage: async ({ page }, use) => {
    await use(new CheckoutPage(page));
  },
  
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await page.goto('http://localhost:3001'); // Admin app
    await use(page);
    await context.close();
  },
});

/**
 * Authentication helper functions
 */
export class AuthHelper {
  constructor(private page: Page) {}

  async loginAsAdmin(credentials = testData.admin) {
    await this.page.goto('http://localhost:3001/login');
    await this.page.locator('input[name="email"]').fill(credentials.email);
    await this.page.locator('input[name="password"]').fill(credentials.password);
    await this.page.locator('button[type="submit"]').click();
    
    // Wait for redirect to admin dashboard
    await expect(this.page).toHaveURL(/.*dashboard.*/);
  }

  async loginAsCustomer(credentials: { email: string; password: string }) {
    await this.page.goto('/login');
    await this.page.locator('input[name="email"]').fill(credentials.email);
    await this.page.locator('input[name="password"]').fill(credentials.password);
    await this.page.locator('button[type="submit"]').click();
    
    // Wait for successful login
    await expect(this.page.locator('[data-testid="user-menu"]')).toBeVisible();
  }

  async logout() {
    await this.page.locator('[data-testid="user-menu"]').click();
    await this.page.locator('[data-testid="logout"]').click();
    await expect(this.page.locator('[data-testid="login-button"]')).toBeVisible();
  }
}

/**
 * API helper functions for test setup and cleanup
 */
export class ApiHelper {
  constructor(private baseURL: string = 'http://localhost:3000') {}

  async createTestProduct(productData: any) {
    const response = await fetch(`${this.baseURL}/api/admin/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
    return await response.json();
  }

  async deleteTestProduct(productId: string) {
    await fetch(`${this.baseURL}/api/admin/products/${productId}`, {
      method: 'DELETE',
    });
  }

  async createTestReview(productId: string, reviewData: any) {
    const response = await fetch(`${this.baseURL}/api/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, ...reviewData }),
    });
    return await response.json();
  }

  async approveReview(reviewId: string) {
    const response = await fetch(`${this.baseURL}/api/admin/moderation/reviews/action`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reviewId, action: 'approve' }),
    });
    return await response.json();
  }

  async updateInventory(variantId: string, quantity: number) {
    const response = await fetch(`${this.baseURL}/api/inventory/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ variantId, quantity }),
    });
    return await response.json();
  }

  async getInventory(variantId: string) {
    const response = await fetch(`${this.baseURL}/api/inventory/${variantId}`);
    return await response.json();
  }
}

/**
 * Mock helpers for external services
 */
export class MockHelper {
  constructor(private page: Page) {}

  async mockRazorpay() {
    await this.page.addInitScript(() => {
      // Mock Razorpay SDK
      (window as any).Razorpay = class {
        private options: any;
        
        constructor(options: any) {
          this.options = options;
        }

        open() {
          // Simulate successful payment after short delay
          setTimeout(() => {
            this.options.handler({
              razorpay_payment_id: 'pay_test_' + Date.now(),
              razorpay_order_id: this.options.order_id,
              razorpay_signature: 'test_signature_' + Date.now(),
            });
          }, 1000);
        }
      };
    });
  }

  async mockCamera() {
    await this.page.addInitScript(() => {
      // Mock getUserMedia
      navigator.mediaDevices.getUserMedia = async () => {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#4CAF50';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#FFF';
        ctx.font = '24px Arial';
        ctx.fillText('Mock Camera Feed', 200, 240);
        
        const stream = (canvas as any).captureStream();
        return Promise.resolve(stream);
      };
    });
  }

  async mockGeolocation(latitude = 19.0760, longitude = 72.8777) {
    await this.page.addInitScript(([lat, lng]) => {
      Object.defineProperty(navigator, 'geolocation', {
        value: {
          getCurrentPosition: (success: any) => {
            success({
              coords: {
                latitude: lat,
                longitude: lng,
                accuracy: 100,
              },
            });
          },
          watchPosition: () => 1,
          clearWatch: () => {},
        },
        writable: true,
      });
    }, [latitude, longitude]);
  }
}

/**
 * Database helper functions
 */
export class DatabaseHelper {
  async cleanupTestData() {
    // Clean up any test data from database
    // This would typically connect to test database and clean up
    // For now, we'll use API endpoints
    const api = new ApiHelper();
    
    // Implementation would depend on your database setup
    console.log('Cleaning up test data...');
  }

  async seedTestData() {
    // Seed database with test data
    console.log('Seeding test data...');
  }
}

/**
 * Utility functions for common test operations
 */
export class TestUtils {
  static async waitForNetworkIdle(page: Page, timeout = 5000) {
    await page.waitForLoadState('networkidle', { timeout });
  }

  static async waitForAnimation(page: Page, selector: string) {
    await page.waitForSelector(selector);
    await page.waitForTimeout(300); // Allow for CSS animations
  }

  static async takeScreenshot(page: Page, name: string) {
    await page.screenshot({ path: `e2e/screenshots/${name}.png`, fullPage: true });
  }

  static generateRandomEmail(): string {
    return `test-${Date.now()}@example.com`;
  }

  static generateRandomPhone(): string {
    return `+91 98${Math.floor(Math.random() * 100000000).toString().padStart(8, '0')}`;
  }

  static async retry<T>(
    fn: () => Promise<T>,
    retries = 3,
    delay = 1000
  ): Promise<T> {
    try {
      return await fn();
    } catch (error) {
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.retry(fn, retries - 1, delay);
      }
      throw error;
    }
  }
}

export { expect };