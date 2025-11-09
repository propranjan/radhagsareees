import { test, expect, testData, ApiHelper, TestUtils } from './utils/test-helpers';
import { BrowserContext, Page } from '@playwright/test';

test.describe('Inventory Concurrency and Oversell Prevention', () => {
  let apiHelper: ApiHelper;
  const TEST_VARIANT_ID = 'test-variant-limited-stock';
  const LIMITED_STOCK_QUANTITY = 2;

  test.beforeAll(async () => {
    apiHelper = new ApiHelper();
    
    // Set up test product with limited inventory
    await apiHelper.updateInventory(TEST_VARIANT_ID, LIMITED_STOCK_QUANTITY);
  });

  test.afterAll(async () => {
    // Cleanup test data
    await apiHelper.updateInventory(TEST_VARIANT_ID, 10); // Reset to normal stock
  });

  test('Parallel checkout prevention: Two users competing for last items', async ({ 
    browser 
  }) => {
    // Create two independent browser contexts to simulate different users
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Step 1: Both users navigate to the same product simultaneously
      await test.step('Both users navigate to limited stock product', async () => {
        const navigationPromises = [
          page1.goto('/catalog'),
          page2.goto('/catalog'),
        ];
        
        await Promise.all(navigationPromises);
        
        // Both users click on the limited stock product
        await Promise.all([
          page1.locator(`[data-testid="product-card"][data-variant="${TEST_VARIANT_ID}"]`).click(),
          page2.locator(`[data-testid="product-card"][data-variant="${TEST_VARIANT_ID}"]`).click(),
        ]);
        
        // Wait for product pages to load
        await Promise.all([
          page1.waitForSelector('[data-testid="product-title"]'),
          page2.waitForSelector('[data-testid="product-title"]'),
        ]);
      });

      // Step 2: Both users add remaining items to cart
      await test.step('Both users attempt to add remaining stock to cart', async () => {
        // User 1 adds all remaining stock (2 items)
        await page1.locator('input[name="quantity"]').fill(LIMITED_STOCK_QUANTITY.toString());
        
        // User 2 also tries to add all remaining stock (2 items)
        await page2.locator('input[name="quantity"]').fill(LIMITED_STOCK_QUANTITY.toString());
        
        // Both users add to cart simultaneously
        const addToCartPromises = [
          page1.locator('[data-testid="add-to-cart"]').click(),
          page2.locator('[data-testid="add-to-cart"]').click(),
        ];
        
        await Promise.all(addToCartPromises);
        
        // Wait for responses
        await Promise.all([
          TestUtils.waitForNetworkIdle(page1),
          TestUtils.waitForNetworkIdle(page2),
        ]);
      });

      // Step 3: Both users proceed to checkout
      let user1CheckoutSuccess = false;
      let user2CheckoutSuccess = false;
      let user1Error = '';
      let user2Error = '';

      await test.step('Both users attempt simultaneous checkout', async () => {
        // Navigate both to cart
        await Promise.all([
          page1.goto('/cart'),
          page2.goto('/cart'),
        ]);

        // Proceed to checkout
        const checkoutPromises = [
          page1.locator('[data-testid="checkout-button"]').click(),
          page2.locator('[data-testid="checkout-button"]').click(),
        ];
        
        await Promise.all(checkoutPromises);

        // Fill shipping information for both users
        const shippingPromises = [
          fillShippingForm(page1, { ...testData.customer, email: 'user1@test.com' }),
          fillShippingForm(page2, { ...testData.customer, email: 'user2@test.com' }),
        ];
        
        await Promise.all(shippingPromises);

        // Select payment method
        await Promise.all([
          page1.locator('input[name="paymentMethod"][value="cod"]').check(),
          page2.locator('input[name="paymentMethod"][value="cod"]').check(),
        ]);

        // Attempt to place orders simultaneously
        const orderPromises = [
          placeOrderAndCapture(page1).then(result => {
            user1CheckoutSuccess = result.success;
            user1Error = result.error;
          }).catch(error => {
            user1CheckoutSuccess = false;
            user1Error = error.message;
          }),
          
          placeOrderAndCapture(page2).then(result => {
            user2CheckoutSuccess = result.success;
            user2Error = result.error;
          }).catch(error => {
            user2CheckoutSuccess = false;
            user2Error = error.message;
          }),
        ];
        
        await Promise.allSettled(orderPromises);
      });

      // Step 4: Verify only one order succeeded
      await test.step('Verify inventory protection worked correctly', async () => {
        // Exactly one user should succeed
        const successfulOrders = [user1CheckoutSuccess, user2CheckoutSuccess].filter(Boolean).length;
        expect(successfulOrders).toBe(1);
        
        // One user should get an inventory error
        const failedOrders = [user1CheckoutSuccess, user2CheckoutSuccess].filter(s => !s).length;
        expect(failedOrders).toBe(1);
        
        // Verify the failed user got an appropriate error message
        const failedError = user1CheckoutSuccess ? user2Error : user1Error;
        expect(failedError).toMatch(/insufficient.*stock|out.*of.*stock|inventory.*unavailable/i);
        
        console.log(`User 1: ${user1CheckoutSuccess ? 'Success' : 'Failed - ' + user1Error}`);
        console.log(`User 2: ${user2CheckoutSuccess ? 'Success' : 'Failed - ' + user2Error}`);
      });

      // Step 5: Verify inventory accuracy in database
      await test.step('Verify final inventory state', async () => {
        const finalInventory = await apiHelper.getInventory(TEST_VARIANT_ID);
        
        // If 2 items were successfully ordered, inventory should be 0
        // If neither order succeeded (race condition edge case), inventory should still be 2
        expect(finalInventory.qtyAvailable).toBe(0);
        
        console.log(`Final inventory: ${finalInventory.qtyAvailable}`);
      });

    } finally {
      // Cleanup contexts
      await context1.close();
      await context2.close();
    }
  });

  test('High concurrency simulation: Multiple users, limited stock', async ({ 
    browser 
  }) => {
    const CONCURRENT_USERS = 5;
    const AVAILABLE_STOCK = 3;
    const ITEMS_PER_USER = 1;
    
    // Set up limited stock scenario
    await apiHelper.updateInventory(TEST_VARIANT_ID, AVAILABLE_STOCK);
    
    const contexts: BrowserContext[] = [];
    const pages: Page[] = [];
    
    try {
      // Create multiple user contexts
      for (let i = 0; i < CONCURRENT_USERS; i++) {
        const context = await browser.newContext();
        const page = await context.newPage();
        contexts.push(context);
        pages.push(page);
      }

      // All users navigate to product
      await Promise.all(
        pages.map(page => page.goto(`/product/test-product?variant=${TEST_VARIANT_ID}`))
      );

      // All users add items to cart
      await Promise.all(
        pages.map(async (page, index) => {
          await page.locator('input[name="quantity"]').fill(ITEMS_PER_USER.toString());
          await page.locator('[data-testid="add-to-cart"]').click();
          await TestUtils.waitForNetworkIdle(page);
        })
      );

      // All users proceed to checkout simultaneously
      const checkoutResults = await Promise.allSettled(
        pages.map(async (page, index) => {
          await page.goto('/cart');
          await page.locator('[data-testid="checkout-button"]').click();
          
          await fillShippingForm(page, { 
            ...testData.customer, 
            email: `user${index + 1}@test.com` 
          });
          
          await page.locator('input[name="paymentMethod"][value="cod"]').check();
          
          return await placeOrderAndCapture(page);
        })
      );

      // Analyze results
      const successful = checkoutResults.filter(result => 
        result.status === 'fulfilled' && result.value.success
      ).length;
      
      const failed = checkoutResults.filter(result => 
        result.status === 'fulfilled' && !result.value.success
      ).length;

      // Should only allow as many orders as available stock
      expect(successful).toBe(AVAILABLE_STOCK);
      expect(failed).toBe(CONCURRENT_USERS - AVAILABLE_STOCK);

      console.log(`${successful}/${CONCURRENT_USERS} orders succeeded (expected: ${AVAILABLE_STOCK})`);

      // Verify final inventory is 0
      const finalInventory = await apiHelper.getInventory(TEST_VARIANT_ID);
      expect(finalInventory.qtyAvailable).toBe(0);

    } finally {
      // Cleanup all contexts
      await Promise.all(contexts.map(context => context.close()));
    }
  });

  test('Cart reservation timeout: Items released after timeout', async ({ 
    browser 
  }) => {
    const RESERVATION_TIMEOUT = 15 * 60 * 1000; // 15 minutes
    const SHORT_TIMEOUT = 2000; // 2 seconds for testing
    
    await apiHelper.updateInventory(TEST_VARIANT_ID, 1); // Only 1 item available
    
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // User 1 adds item to cart (should reserve it)
      await page1.goto(`/product/test-product?variant=${TEST_VARIANT_ID}`);
      await page1.locator('[data-testid="add-to-cart"]').click();
      await TestUtils.waitForNetworkIdle(page1);

      // User 2 tries to add same item (should fail due to reservation)
      await page2.goto(`/product/test-product?variant=${TEST_VARIANT_ID}`);
      await page2.locator('[data-testid="add-to-cart"]').click();
      
      // Should show out of stock or reserved message
      await expect(page2.locator('[data-testid="stock-error"]')).toBeVisible();

      // Wait for reservation to expire (in a real test, this would be longer)
      // For testing purposes, we might trigger the cleanup manually
      await page1.evaluate(() => {
        // Simulate cart abandonment or timeout
        localStorage.clear();
        sessionStorage.clear();
      });

      // Simulate timeout cleanup (normally done by backend job)
      // In real implementation, a cron job would clean up expired reservations
      await new Promise(resolve => setTimeout(resolve, SHORT_TIMEOUT));

      // User 2 should now be able to add the item
      await page2.reload();
      await page2.locator('[data-testid="add-to-cart"]').click();
      
      await expect(page2.locator('[data-testid="cart-success"]')).toBeVisible();

    } finally {
      await context1.close();
      await context2.close();
    }
  });

  test('Partial fulfillment: Order adjusted when stock becomes insufficient', async ({ 
    browser 
  }) => {
    await apiHelper.updateInventory(TEST_VARIANT_ID, 5); // 5 items available
    
    const context = await browser.newContext();
    const page = await context.newPage();

    try {
      // User adds 3 items to cart
      await page.goto(`/product/test-product?variant=${TEST_VARIANT_ID}`);
      await page.locator('input[name="quantity"]').fill('3');
      await page.locator('[data-testid="add-to-cart"]').click();

      // Simulate another order reducing stock while user is in checkout
      await apiHelper.updateInventory(TEST_VARIANT_ID, 2); // Stock reduced to 2

      // User proceeds to checkout
      await page.goto('/cart');
      
      // Should show updated availability
      await expect(page.locator('[data-testid="stock-warning"]')).toBeVisible();
      await expect(page.locator('[data-testid="available-quantity"]')).toContainText('2');
      
      // Quantity should be automatically adjusted
      const quantityInput = page.locator('[data-testid="item-quantity"]');
      await expect(quantityInput).toHaveValue('2');

      await page.locator('[data-testid="checkout-button"]').click();
      
      // Complete checkout with adjusted quantity
      await fillShippingForm(page, testData.customer);
      await page.locator('input[name="paymentMethod"][value="cod"]').check();
      
      const result = await placeOrderAndCapture(page);
      expect(result.success).toBe(true);

      // Verify order was placed with correct quantity
      await expect(page.locator('[data-testid="order-summary"]')).toContainText('Quantity: 2');

    } finally {
      await context.close();
    }
  });

  // Helper function to fill shipping form
  async function fillShippingForm(page: Page, customerData: any) {
    await page.locator('input[name="name"]').fill(customerData.name);
    await page.locator('input[name="email"]').fill(customerData.email);
    await page.locator('input[name="phone"]').fill(customerData.phone);
    await page.locator('textarea[name="address"]').fill(customerData.address);
    await page.locator('input[name="city"]').fill(customerData.city);
    await page.locator('input[name="pincode"]').fill(customerData.pincode);
  }

  // Helper function to place order and capture result
  async function placeOrderAndCapture(page: Page): Promise<{ success: boolean; error: string }> {
    try {
      await page.locator('[data-testid="place-order"]').click();
      
      // Wait for either success or error
      await Promise.race([
        page.waitForSelector('[data-testid="checkout-success"]', { timeout: 10000 }),
        page.waitForSelector('[data-testid="checkout-error"]', { timeout: 10000 }),
      ]);

      const successElement = await page.locator('[data-testid="checkout-success"]').count();
      const errorElement = await page.locator('[data-testid="checkout-error"]');
      
      if (successElement > 0) {
        return { success: true, error: '' };
      } else {
        const errorText = await errorElement.textContent() || 'Unknown error';
        return { success: false, error: errorText };
      }
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  }
});