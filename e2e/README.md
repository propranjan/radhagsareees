# E2E Testing Suite with Playwright

This directory contains comprehensive end-to-end tests for the Radha G Sarees e-commerce platform, covering the full user journey from browsing to checkout.

## 🧪 Test Suites

### 1. Shopping Flow (`shopping-flow.spec.ts`)
**Complete E2E user journey testing:**
- **Catalog browsing**: Product grid, filtering, search functionality
- **Product interaction**: Detailed view, variant selection, image gallery
- **Try-on experience**: Modal interaction, image upload, quality scoring
- **Cart management**: Add items, quantity updates, price calculations
- **Checkout process**: Shipping forms, payment integration, order completion
- **Razorpay integration**: Mocked payment gateway testing
- **Performance monitoring**: Load times, network requests
- **Responsive testing**: Mobile and desktop viewports

**Key Test Cases:**
```typescript
// Main shopping flow
test('Browse → Filter → Product → Try-On → Cart → Checkout')

// Alternative flows
test('Direct add to cart without try-on')
test('Out of stock error handling')
test('Mobile responsive shopping flow')
test('Search: valid and invalid queries')
test('Cart persistence across sessions')
```

### 2. Review Workflow (`review-workflow.spec.ts`)
**Complete review lifecycle testing:**
- **Customer submission**: Rating, title, body, photo uploads
- **Admin moderation**: Approval/rejection workflow
- **Public display**: Verified reviews appear on product pages
- **Photo handling**: Upload validation, lightbox display
- **Bulk operations**: Mass approve/reject reviews
- **Analytics**: Review reporting and insights

**Key Test Cases:**
```typescript
// Complete review lifecycle
test('Submit → Admin Review → Public Display')

// Review moderation
test('Review rejection workflow')
test('Form validation and error handling')
test('Bulk review moderation')
test('Review analytics and reporting')
test('Review helpfulness voting')
```

### 3. Inventory Concurrency (`inventory-concurrency.spec.ts`)
**Advanced concurrency and race condition testing:**
- **Parallel checkouts**: Multiple users competing for limited stock
- **Oversell prevention**: Database-level inventory protection
- **Cart reservations**: Temporary stock holds with timeout
- **High concurrency**: Stress testing with multiple simultaneous users
- **Partial fulfillment**: Order adjustments when stock changes

**Key Test Cases:**
```typescript
// Race condition testing
test('Two users competing for last items')
test('High concurrency: 5 users, 3 items available')

// Advanced inventory scenarios  
test('Cart reservation timeout: items released')
test('Partial fulfillment: order adjusted for insufficient stock')
```

## 🛠 Test Architecture

### Page Object Model
**Modular, maintainable test structure:**
```typescript
// Page objects for different sections
CatalogPage    // Product browsing and filtering
ProductPage    // Product details and interactions  
TryOnModal     // Virtual try-on experience
CartPage       // Shopping cart management
CheckoutPage   // Purchase completion
```

### Test Utilities
**Comprehensive helper functions:**
```typescript
AuthHelper     // Login/logout functionality
ApiHelper      // Direct API interactions for setup
MockHelper     // External service mocking (Razorpay, camera)
TestUtils      // Common test operations
DatabaseHelper // Test data management
```

### Fixtures and Test Data
**Realistic test scenarios:**
```typescript
testData = {
  customer: { name, email, phone, address, ... },
  products: { saree: {...}, blouse: {...} },
  reviews: { positive: {...}, negative: {...} },
  search: { validQueries: [...], invalidQueries: [...] }
}
```

## 🚀 Running Tests

### Basic Commands
```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Debug mode (step through tests)
npm run test:e2e:debug
```

### Specific Test Suites
```bash
# Run only shopping flow tests
npx playwright test shopping-flow

# Run only review workflow tests  
npx playwright test review-workflow

# Run only concurrency tests
npx playwright test inventory-concurrency
```

### Browser-Specific Testing
```bash
# Test on specific browser
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project=webkit

# Mobile testing
npx playwright test --project="Mobile Chrome"
npx playwright test --project="Mobile Safari"
```

### Advanced Options
```bash
# Generate test report
npx playwright show-report

# Update test screenshots
npx playwright test --update-snapshots

# Run tests in parallel
npx playwright test --workers=4

# Run with specific timeout
npx playwright test --timeout=60000
```

## 🧩 Configuration

### Environment Setup
Tests require both applications running:
```bash
# Terminal 1: Main app (port 3000)
npm run dev

# Terminal 2: Admin app (port 3001)
npm run dev --workspace=apps/admin

# Terminal 3: Run tests
npm run test:e2e
```

### Browser Configuration
`playwright.config.ts` includes:
- **Multiple browsers**: Chrome, Firefox, Safari, Mobile
- **Auto-start servers**: Automatically launches dev servers
- **Retry logic**: Handles flaky tests
- **Screenshots/videos**: Capture on failure
- **Parallel execution**: Faster test runs

## 📊 Test Coverage

### Business Logic Coverage
✅ **Complete user journeys**: End-to-end shopping experience  
✅ **Payment processing**: Razorpay integration with mocking  
✅ **Content moderation**: Review approval workflow  
✅ **Inventory management**: Stock tracking and concurrency  
✅ **Error handling**: Graceful failure scenarios  
✅ **Performance**: Load times and responsiveness  

### Technical Coverage
✅ **Multi-browser**: Chrome, Firefox, Safari testing  
✅ **Responsive design**: Mobile and desktop viewports  
✅ **Network conditions**: Slow connections, timeouts  
✅ **Race conditions**: Concurrent user scenarios  
✅ **Database consistency**: Transaction integrity  
✅ **External services**: API mocking and fallbacks  

## 🔧 Mock Services

### Payment Gateway (Razorpay)
```typescript
// Simulates successful payment flow
mockHelper.mockRazorpay();

// Handles payment success/failure scenarios
razorpay.mockSuccess() / razorpay.mockFailure()
```

### Camera/Media APIs
```typescript
// Mock camera for try-on feature
mockHelper.mockCamera();

// Provides test video stream
mockHelper.mockGeolocation(lat, lng);
```

### Database Operations
```typescript
// Setup/cleanup test data
apiHelper.createTestProduct(data);
apiHelper.updateInventory(variantId, quantity);
apiHelper.approveReview(reviewId);
```

## 📈 Performance Testing

### Load Time Monitoring
```typescript
// Automatic performance tracking
test('Performance: Page load times', async ({ page }) => {
  const startTime = Date.now();
  await catalogPage.goto();
  const loadTime = Date.now() - startTime;
  expect(loadTime).toBeLessThan(5000);
});
```

### Network Request Analysis
```typescript
// Monitor slow API calls
await page.route('**/*', route => {
  // Track request duration
  // Log slow requests
  // Identify bottlenecks
});
```

## 🛡 Error Scenarios

### Network Failures
- API timeouts and retries
- Partial response handling
- Connection interruptions

### Data Integrity
- Inventory oversell prevention
- Order processing failures
- Payment gateway errors

### User Experience
- Form validation errors
- Loading state management
- Graceful degradation

## 📝 Best Practices

### Test Organization
1. **Descriptive test names**: Clear intent and expected behavior
2. **Step-by-step testing**: Readable test flow with `test.step()`
3. **Independent tests**: No dependencies between test cases
4. **Proper cleanup**: Reset state after each test

### Assertions
1. **Wait for elements**: Use `waitForSelector()` instead of timeouts
2. **Specific selectors**: `data-testid` attributes for reliable selection  
3. **Multiple assertions**: Verify different aspects of functionality
4. **Error messages**: Clear failure descriptions

### Maintenance
1. **Page object pattern**: Centralized element selectors
2. **Shared utilities**: Reusable helper functions
3. **Test data management**: Centralized test fixtures
4. **Regular updates**: Keep tests in sync with application changes

## 🎯 Success Criteria

### Test Reliability
- ✅ **99%+ pass rate**: Consistent, reliable test execution
- ✅ **Fast execution**: Complete suite under 10 minutes
- ✅ **Clear failures**: Actionable error messages and screenshots

### Coverage Goals  
- ✅ **Critical paths**: All major user journeys covered
- ✅ **Edge cases**: Error conditions and boundary scenarios
- ✅ **Cross-browser**: Consistent behavior across browsers
- ✅ **Business rules**: Inventory, pricing, moderation logic

This E2E testing suite provides comprehensive coverage of the Radha G Sarees platform, ensuring reliable functionality across all user journeys and business scenarios.