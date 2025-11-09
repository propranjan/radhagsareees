import { Page, Locator, expect } from '@playwright/test';

/**
 * Page Object Model for the product catalog page
 */
export class CatalogPage {
  readonly page: Page;
  readonly searchInput: Locator;
  readonly categoryFilter: Locator;
  readonly priceFilter: Locator;
  readonly colorFilter: Locator;
  readonly productCards: Locator;
  readonly sortDropdown: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.categoryFilter = page.locator('select[name="category"]');
    this.priceFilter = page.locator('select[name="price"]');
    this.colorFilter = page.locator('select[name="color"]');
    this.productCards = page.locator('[data-testid="product-card"]');
    this.sortDropdown = page.locator('select[name="sort"]');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  async goto() {
    await this.page.goto('/catalog');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 10000 });
  }

  async searchProducts(query: string) {
    await this.searchInput.fill(query);
    await this.searchInput.press('Enter');
    await this.waitForLoad();
  }

  async filterByCategory(category: string) {
    await this.categoryFilter.selectOption(category);
    await this.waitForLoad();
  }

  async filterByPrice(priceRange: string) {
    await this.priceFilter.selectOption(priceRange);
    await this.waitForLoad();
  }

  async filterByColor(color: string) {
    await this.colorFilter.selectOption(color);
    await this.waitForLoad();
  }

  async sortBy(sortOption: string) {
    await this.sortDropdown.selectOption(sortOption);
    await this.waitForLoad();
  }

  async getProductCount(): Promise<number> {
    return await this.productCards.count();
  }

  async clickProduct(index: number) {
    await this.productCards.nth(index).click();
  }

  async clickFirstProduct() {
    await this.productCards.first().click();
  }

  async getProductNames(): Promise<string[]> {
    return await this.productCards.locator('[data-testid="product-name"]').allTextContents();
  }

  async verifyProductsContain(searchTerm: string) {
    const productNames = await this.getProductNames();
    expect(productNames.length).toBeGreaterThan(0);
    productNames.forEach(name => {
      expect(name.toLowerCase()).toContain(searchTerm.toLowerCase());
    });
  }
}

/**
 * Page Object Model for the product detail page
 */
export class ProductPage {
  readonly page: Page;
  readonly productTitle: Locator;
  readonly productPrice: Locator;
  readonly productDescription: Locator;
  readonly productImages: Locator;
  readonly variantOptions: Locator;
  readonly quantityInput: Locator;
  readonly addToCartButton: Locator;
  readonly tryOnButton: Locator;
  readonly shareButton: Locator;
  readonly reviewsSection: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.productTitle = page.locator('[data-testid="product-title"]');
    this.productPrice = page.locator('[data-testid="product-price"]');
    this.productDescription = page.locator('[data-testid="product-description"]');
    this.productImages = page.locator('[data-testid="product-image"]');
    this.variantOptions = page.locator('[data-testid="variant-option"]');
    this.quantityInput = page.locator('input[name="quantity"]');
    this.addToCartButton = page.locator('[data-testid="add-to-cart"]');
    this.tryOnButton = page.locator('[data-testid="try-on-button"]');
    this.shareButton = page.locator('[data-testid="share-button"]');
    this.reviewsSection = page.locator('[data-testid="reviews-section"]');
    this.loadingSpinner = page.locator('[data-testid="loading"]');
  }

  async waitForLoad() {
    await expect(this.productTitle).toBeVisible();
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 10000 });
  }

  async selectVariant(variantName: string) {
    await this.page.locator(`[data-testid="variant-option"][data-variant="${variantName}"]`).click();
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async addToCart() {
    await this.addToCartButton.click();
    // Wait for success indication
    await expect(this.page.locator('[data-testid="cart-success"]')).toBeVisible();
  }

  async openTryOn() {
    await this.tryOnButton.click();
    await expect(this.page.locator('[data-testid="tryon-modal"]')).toBeVisible();
  }

  async getProductInfo() {
    return {
      title: await this.productTitle.textContent(),
      price: await this.productPrice.textContent(),
      description: await this.productDescription.textContent(),
    };
  }
}

/**
 * Page Object Model for the Try-On Modal
 */
export class TryOnModal {
  readonly page: Page;
  readonly modal: Locator;
  readonly canvas: Locator;
  readonly cameraButton: Locator;
  readonly uploadButton: Locator;
  readonly captureButton: Locator;
  readonly addToCartButton: Locator;
  readonly closeButton: Locator;
  readonly qualityIndicator: Locator;
  readonly feedbackText: Locator;
  readonly loadingSpinner: Locator;

  constructor(page: Page) {
    this.page = page;
    this.modal = page.locator('[data-testid="tryon-modal"]');
    this.canvas = page.locator('[data-testid="tryon-canvas"]');
    this.cameraButton = page.locator('[data-testid="camera-button"]');
    this.uploadButton = page.locator('[data-testid="upload-button"]');
    this.captureButton = page.locator('[data-testid="capture-button"]');
    this.addToCartButton = page.locator('[data-testid="modal-add-to-cart"]');
    this.closeButton = page.locator('[data-testid="close-modal"]');
    this.qualityIndicator = page.locator('[data-testid="quality-indicator"]');
    this.feedbackText = page.locator('[data-testid="quality-feedback"]');
    this.loadingSpinner = page.locator('[data-testid="tryon-loading"]');
  }

  async waitForLoad() {
    await expect(this.modal).toBeVisible();
    await expect(this.canvas).toBeVisible();
  }

  async uploadImage(filePath: string) {
    const fileChooserPromise = this.page.waitForEvent('filechooser');
    await this.uploadButton.click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(filePath);
    await expect(this.loadingSpinner).not.toBeVisible({ timeout: 15000 });
  }

  async startCamera() {
    await this.cameraButton.click();
    // Mock camera permission
    await this.page.evaluate(() => {
      navigator.mediaDevices.getUserMedia = () => Promise.resolve(new MediaStream());
    });
  }

  async captureImage() {
    await this.captureButton.click();
    await expect(this.qualityIndicator).toBeVisible();
  }

  async addToCartFromModal() {
    await this.addToCartButton.click();
    await expect(this.page.locator('[data-testid="cart-success"]')).toBeVisible();
  }

  async close() {
    await this.closeButton.click();
    await expect(this.modal).not.toBeVisible();
  }

  async getQualityScore(): Promise<string | null> {
    return await this.qualityIndicator.getAttribute('data-score');
  }

  async getFeedback(): Promise<string | null> {
    return await this.feedbackText.textContent();
  }
}

/**
 * Page Object Model for the shopping cart
 */
export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly subtotal: Locator;
  readonly tax: Locator;
  readonly total: Locator;
  readonly checkoutButton: Locator;
  readonly emptyCartMessage: Locator;
  readonly quantityInputs: Locator;
  readonly removeButtons: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('[data-testid="cart-item"]');
    this.subtotal = page.locator('[data-testid="subtotal"]');
    this.tax = page.locator('[data-testid="tax"]');
    this.total = page.locator('[data-testid="total"]');
    this.checkoutButton = page.locator('[data-testid="checkout-button"]');
    this.emptyCartMessage = page.locator('[data-testid="empty-cart"]');
    this.quantityInputs = page.locator('[data-testid="item-quantity"]');
    this.removeButtons = page.locator('[data-testid="remove-item"]');
  }

  async goto() {
    await this.page.goto('/cart');
  }

  async getItemCount(): Promise<number> {
    return await this.cartItems.count();
  }

  async updateQuantity(itemIndex: number, quantity: number) {
    await this.quantityInputs.nth(itemIndex).fill(quantity.toString());
    await this.quantityInputs.nth(itemIndex).press('Enter');
  }

  async removeItem(itemIndex: number) {
    await this.removeButtons.nth(itemIndex).click();
  }

  async proceedToCheckout() {
    await this.checkoutButton.click();
  }

  async getTotalAmount(): Promise<string | null> {
    return await this.total.textContent();
  }
}

/**
 * Page Object Model for the checkout process
 */
export class CheckoutPage {
  readonly page: Page;
  readonly shippingForm: Locator;
  readonly paymentForm: Locator;
  readonly orderSummary: Locator;
  readonly placeOrderButton: Locator;
  readonly paymentMethodRadio: Locator;
  readonly loadingSpinner: Locator;
  readonly errorMessage: Locator;
  readonly successMessage: Locator;

  constructor(page: Page) {
    this.page = page;
    this.shippingForm = page.locator('[data-testid="shipping-form"]');
    this.paymentForm = page.locator('[data-testid="payment-form"]');
    this.orderSummary = page.locator('[data-testid="order-summary"]');
    this.placeOrderButton = page.locator('[data-testid="place-order"]');
    this.paymentMethodRadio = page.locator('[name="paymentMethod"]');
    this.loadingSpinner = page.locator('[data-testid="checkout-loading"]');
    this.errorMessage = page.locator('[data-testid="checkout-error"]');
    this.successMessage = page.locator('[data-testid="checkout-success"]');
  }

  async fillShippingInfo(shippingInfo: {
    name: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    pincode: string;
  }) {
    await this.page.locator('input[name="name"]').fill(shippingInfo.name);
    await this.page.locator('input[name="email"]').fill(shippingInfo.email);
    await this.page.locator('input[name="phone"]').fill(shippingInfo.phone);
    await this.page.locator('textarea[name="address"]').fill(shippingInfo.address);
    await this.page.locator('input[name="city"]').fill(shippingInfo.city);
    await this.page.locator('input[name="pincode"]').fill(shippingInfo.pincode);
  }

  async selectPaymentMethod(method: 'razorpay' | 'cod') {
    await this.page.locator(`input[name="paymentMethod"][value="${method}"]`).check();
  }

  async placeOrder() {
    await this.placeOrderButton.click();
  }

  async waitForPaymentRedirect() {
    await expect(this.page).toHaveURL(/.*razorpay.*/);
  }

  async mockRazorpaySuccess() {
    // Mock Razorpay payment success
    await this.page.evaluate(() => {
      window.postMessage({
        type: 'razorpay_payment_success',
        data: {
          razorpay_payment_id: 'pay_test123',
          razorpay_order_id: 'order_test123',
          razorpay_signature: 'test_signature'
        }
      }, '*');
    });
  }

  async verifyOrderSuccess(): Promise<string | null> {
    await expect(this.successMessage).toBeVisible();
    return await this.page.locator('[data-testid="order-id"]').textContent();
  }

  async verifyOrderFailure() {
    await expect(this.errorMessage).toBeVisible();
  }
}