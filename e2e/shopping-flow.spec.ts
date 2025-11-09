import { test, expect, testData, MockHelper, TestUtils } from './utils/test-helpers';

test.describe('E2E Shopping Flow', () => {
  let mockHelper: MockHelper;

  test.beforeEach(async ({ page }) => {
    mockHelper = new MockHelper(page);
    
    // Set up all necessary mocks
    await mockHelper.mockRazorpay();
    await mockHelper.mockCamera();
    
    // Navigate to homepage
    await page.goto('/');
    await TestUtils.waitForNetworkIdle(page);
  });

  test('Complete shopping journey: Browse → Filter → Product → Try-On → Cart → Checkout', async ({ 
    page,
    catalogPage,
    productPage,
    tryOnModal,
    cartPage,
    checkoutPage
  }) => {
    // Step 1: Browse catalog and verify products load
    await catalogPage.goto();
    const initialProductCount = await catalogPage.getProductCount();
    expect(initialProductCount).toBeGreaterThan(0);

    // Step 2: Test filtering functionality
    await test.step('Filter products by category', async () => {
      await catalogPage.filterByCategory(testData.products.saree.category);
      await catalogPage.verifyProductsContain('saree');
    });

    await test.step('Apply additional filters', async () => {
      await catalogPage.filterByColor(testData.products.saree.color);
      await catalogPage.filterByPrice(testData.products.saree.priceRange);
      
      const filteredCount = await catalogPage.getProductCount();
      expect(filteredCount).toBeGreaterThan(0);
      expect(filteredCount).toBeLessThanOrEqual(initialProductCount);
    });

    // Step 3: Search functionality
    await test.step('Search for products', async () => {
      await catalogPage.searchProducts(testData.search.validQueries[0]);
      await catalogPage.verifyProductsContain(testData.search.validQueries[0]);
    });

    // Step 4: Navigate to product page
    await test.step('View product details', async () => {
      await catalogPage.clickFirstProduct();
      await productPage.waitForLoad();
      
      const productInfo = await productPage.getProductInfo();
      expect(productInfo.title).toBeTruthy();
      expect(productInfo.price).toBeTruthy();
      expect(productInfo.description).toBeTruthy();
    });

    // Step 5: Try-On experience
    await test.step('Open and use Try-On modal', async () => {
      await productPage.openTryOn();
      await tryOnModal.waitForLoad();
      
      // Test image upload functionality
      await tryOnModal.uploadImage('e2e/fixtures/test-user-image.jpg');
      
      // Verify quality scoring system
      const qualityScore = await tryOnModal.getQualityScore();
      expect(qualityScore).toBeTruthy();
      
      const feedback = await tryOnModal.getFeedback();
      expect(feedback).toBeTruthy();
      
      // Add to cart from try-on modal
      await tryOnModal.addToCartFromModal();
      await tryOnModal.close();
    });

    // Step 6: Verify cart and modify if needed
    await test.step('Manage shopping cart', async () => {
      await cartPage.goto();
      
      const itemCount = await cartPage.getItemCount();
      expect(itemCount).toBe(1);
      
      // Test quantity update
      await cartPage.updateQuantity(0, 2);
      
      const totalAmount = await cartPage.getTotalAmount();
      expect(totalAmount).toMatch(/₹\d+/);
    });

    // Step 7: Complete checkout process
    await test.step('Complete checkout with Razorpay', async () => {
      await cartPage.proceedToCheckout();
      
      // Fill shipping information
      await checkoutPage.fillShippingInfo(testData.customer);
      
      // Select Razorpay payment method
      await checkoutPage.selectPaymentMethod('razorpay');
      
      // Place order
      await checkoutPage.placeOrder();
      
      // Mock successful Razorpay payment
      await checkoutPage.mockRazorpaySuccess();
      
      // Verify order success
      const orderId = await checkoutPage.verifyOrderSuccess();
      expect(orderId).toBeTruthy();
      expect(orderId).toMatch(/^order_/);
    });

    // Step 8: Verify post-purchase state
    await test.step('Verify post-purchase experience', async () => {
      // Cart should be empty after successful checkout
      await cartPage.goto();
      await expect(cartPage.emptyCartMessage).toBeVisible();
      
      // Could also verify order confirmation email, order tracking, etc.
    });
  });

  test('Alternative flow: Direct add to cart without try-on', async ({
    catalogPage,
    productPage,
    cartPage,
    checkoutPage
  }) => {
    // Navigate directly to a product
    await catalogPage.goto();
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    
    // Select variant and add to cart
    await productPage.selectVariant(testData.products.saree.variants[0]);
    await productPage.setQuantity(1);
    await productPage.addToCart();
    
    // Proceed to checkout
    await cartPage.goto();
    await cartPage.proceedToCheckout();
    
    // Complete with COD payment
    await checkoutPage.fillShippingInfo(testData.customer);
    await checkoutPage.selectPaymentMethod('cod');
    await checkoutPage.placeOrder();
    
    const orderId = await checkoutPage.verifyOrderSuccess();
    expect(orderId).toBeTruthy();
  });

  test('Error handling: Out of stock product', async ({
    catalogPage,
    productPage,
    cartPage
  }) => {
    // This test would require setting up a product with 0 inventory
    await catalogPage.goto();
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    
    // Try to add out-of-stock item
    await productPage.selectVariant('out-of-stock-variant');
    
    // Add to cart button should be disabled or show error
    await expect(productPage.addToCartButton).toBeDisabled();
    
    // Or verify error message if button is clickable
    // await productPage.addToCart();
    // await expect(page.locator('[data-testid="stock-error"]')).toBeVisible();
  });

  test('Mobile responsive shopping flow', async ({
    catalogPage,
    productPage,
    cartPage
  }) => {
    // This test will run on mobile viewports due to our config
    await catalogPage.goto();
    
    // Verify mobile-specific UI elements
    await expect(catalogPage.page.locator('[data-testid="mobile-menu"]')).toBeVisible();
    
    // Test mobile navigation
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    
    // Mobile-specific interactions
    await productPage.addToCart();
    await cartPage.goto();
    
    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBe(1);
  });

  test('Performance: Page load times and interactions', async ({
    page,
    catalogPage,
    productPage
  }) => {
    // Monitor performance during shopping flow
    await page.route('**/*', route => {
      const startTime = Date.now();
      route.continue().then(() => {
        const duration = Date.now() - startTime;
        if (duration > 3000) {
          console.warn(`Slow request detected: ${route.request().url()} took ${duration}ms`);
        }
      });
    });
    
    const startTime = Date.now();
    await catalogPage.goto();
    const catalogLoadTime = Date.now() - startTime;
    expect(catalogLoadTime).toBeLessThan(5000);
    
    const productStartTime = Date.now();
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    const productLoadTime = Date.now() - productStartTime;
    expect(productLoadTime).toBeLessThan(3000);
  });

  test('Search functionality: Valid and invalid queries', async ({
    catalogPage
  }) => {
    await catalogPage.goto();
    
    // Test valid searches
    for (const query of testData.search.validQueries) {
      await catalogPage.searchProducts(query);
      const count = await catalogPage.getProductCount();
      expect(count).toBeGreaterThan(0);
    }
    
    // Test invalid searches
    for (const query of testData.search.invalidQueries) {
      await catalogPage.searchProducts(query);
      const count = await catalogPage.getProductCount();
      expect(count).toBe(0);
      
      await expect(catalogPage.page.locator('[data-testid="no-results"]')).toBeVisible();
    }
  });

  test('Cart persistence across sessions', async ({
    page,
    catalogPage,
    productPage,
    cartPage
  }) => {
    // Add item to cart
    await catalogPage.goto();
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    await productPage.addToCart();
    
    // Simulate page refresh
    await page.reload();
    await TestUtils.waitForNetworkIdle(page);
    
    // Verify cart persists
    await cartPage.goto();
    const itemCount = await cartPage.getItemCount();
    expect(itemCount).toBe(1);
    
    // Test across new session (would require authentication)
    // const newContext = await page.context().browser()?.newContext();
    // ... verify cart persistence with login
  });
});