import { test, expect, testData, AuthHelper, ApiHelper, TestUtils } from './utils/test-helpers';

test.describe('Review Workflow', () => {
  let authHelper: AuthHelper;
  let apiHelper: ApiHelper;

  test.beforeEach(async ({ page }) => {
    authHelper = new AuthHelper(page);
    apiHelper = new ApiHelper();
  });

  test('Complete review lifecycle: Submit → Admin Review → Public Display', async ({ 
    page,
    catalogPage,
    productPage,
    adminPage
  }) => {
    // Step 1: Navigate to product and submit review as customer
    await test.step('Customer submits product review', async () => {
      await catalogPage.goto();
      await catalogPage.clickFirstProduct();
      await productPage.waitForLoad();
      
      // Scroll to reviews section
      await productPage.reviewsSection.scrollIntoViewIfNeeded();
      
      // Click "Write Review" button
      await page.locator('[data-testid="write-review-button"]').click();
      await expect(page.locator('[data-testid="review-modal"]')).toBeVisible();
      
      // Fill review form
      await page.locator('[data-testid="review-rating"]').nth(4).click(); // 5 stars
      await page.locator('input[name="reviewTitle"]').fill(testData.reviews.positive.title);
      await page.locator('textarea[name="reviewBody"]').fill(testData.reviews.positive.body);
      
      // Upload review photos
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('[data-testid="photo-upload"]').click();
      const fileChooser = await fileChooserPromise;
      await fileChooser.setFiles(['e2e/fixtures/review-photo1.jpg', 'e2e/fixtures/review-photo2.jpg']);
      
      // Wait for photos to upload
      await expect(page.locator('[data-testid="uploaded-photo"]')).toHaveCount(2);
      
      // Submit review
      await page.locator('[data-testid="submit-review"]').click();
      
      // Verify submission success
      await expect(page.locator('[data-testid="review-success"]')).toBeVisible();
      await expect(page.locator('[data-testid="review-success"]')).toContainText('review has been submitted');
      
      // Close modal
      await page.locator('[data-testid="close-review-modal"]').click();
      await expect(page.locator('[data-testid="review-modal"]')).not.toBeVisible();
      
      // Verify review appears in pending state (not visible publicly)
      const visibleReviews = await page.locator('[data-testid="review-item"]').count();
      const pendingMessage = page.locator('[data-testid="pending-review-message"]');
      
      // Should show either no reviews or a pending message
      if (visibleReviews === 0) {
        await expect(page.locator('[data-testid="no-reviews"]')).toBeVisible();
      } else {
        await expect(pendingMessage).toBeVisible();
      }
    });

    // Step 2: Admin reviews and moderates the submission
    await test.step('Admin reviews and approves the review', async () => {
      // Switch to admin context
      const adminAuthHelper = new AuthHelper(adminPage);
      await adminAuthHelper.loginAsAdmin();
      
      // Navigate to moderation dashboard
      await adminPage.goto('http://localhost:3001/moderation');
      await TestUtils.waitForNetworkIdle(adminPage);
      
      // Verify review appears in pending list
      await expect(adminPage.locator('[data-testid="pending-reviews"]')).toBeVisible();
      const pendingReviews = adminPage.locator('[data-testid="pending-review-item"]');
      const pendingCount = await pendingReviews.count();
      expect(pendingCount).toBeGreaterThan(0);
      
      // Find our review by title
      const ourReview = pendingReviews.filter({ 
        has: adminPage.locator(`text="${testData.reviews.positive.title}"`) 
      }).first();
      await expect(ourReview).toBeVisible();
      
      // Verify review content in admin view
      await expect(ourReview.locator('[data-testid="review-rating"]')).toContainText('5');
      await expect(ourReview.locator('[data-testid="review-body"]')).toContainText(testData.reviews.positive.body);
      await expect(ourReview.locator('[data-testid="review-photos"]')).toBeVisible();
      
      // Check photo count
      const photoCount = await ourReview.locator('[data-testid="review-photo"]').count();
      expect(photoCount).toBe(2);
      
      // Approve the review
      await ourReview.locator('[data-testid="approve-review"]').click();
      
      // Verify approval confirmation
      await expect(adminPage.locator('[data-testid="approval-success"]')).toBeVisible();
      
      // Review should move from pending to approved
      await adminPage.reload();
      await TestUtils.waitForNetworkIdle(adminPage);
      
      const remainingPendingCount = await adminPage.locator('[data-testid="pending-review-item"]').count();
      // Should be one less pending review now
      
      // Check approved reviews section
      await adminPage.locator('[data-testid="approved-reviews-tab"]').click();
      const approvedReviews = adminPage.locator('[data-testid="approved-review-item"]');
      
      const ourApprovedReview = approvedReviews.filter({ 
        has: adminPage.locator(`text="${testData.reviews.positive.title}"`) 
      }).first();
      await expect(ourApprovedReview).toBeVisible();
    });

    // Step 3: Verify review appears publicly on product page
    await test.step('Review appears publicly after approval', async () => {
      // Go back to main site
      await page.reload();
      await TestUtils.waitForNetworkIdle(page);
      
      // Scroll to reviews section
      await productPage.reviewsSection.scrollIntoViewIfNeeded();
      
      // Verify our review is now visible
      const publicReviews = page.locator('[data-testid="review-item"]');
      const publicCount = await publicReviews.count();
      expect(publicCount).toBeGreaterThan(0);
      
      const ourPublicReview = publicReviews.filter({ 
        has: page.locator(`text="${testData.reviews.positive.title}"`) 
      }).first();
      await expect(ourPublicReview).toBeVisible();
      
      // Verify all review elements are displayed correctly
      await expect(ourPublicReview.locator('[data-testid="review-rating"]')).toBeVisible();
      await expect(ourPublicReview.locator('[data-testid="review-title"]')).toContainText(testData.reviews.positive.title);
      await expect(ourPublicReview.locator('[data-testid="review-body"]')).toContainText(testData.reviews.positive.body);
      await expect(ourPublicReview.locator('[data-testid="review-photos"]')).toBeVisible();
      
      // Verify photos are clickable and open in lightbox
      await ourPublicReview.locator('[data-testid="review-photo"]').first().click();
      await expect(page.locator('[data-testid="photo-lightbox"]')).toBeVisible();
      
      // Close lightbox
      await page.locator('[data-testid="close-lightbox"]').click();
      await expect(page.locator('[data-testid="photo-lightbox"]')).not.toBeVisible();
      
      // Verify review metadata
      await expect(ourPublicReview.locator('[data-testid="review-date"]')).toBeVisible();
      await expect(ourPublicReview.locator('[data-testid="reviewer-name"]')).toBeVisible();
    });
  });

  test('Review rejection workflow', async ({ 
    page,
    catalogPage,
    productPage,
    adminPage
  }) => {
    // Submit a negative/inappropriate review
    await test.step('Submit review with inappropriate content', async () => {
      await catalogPage.goto();
      await catalogPage.clickFirstProduct();
      await productPage.waitForLoad();
      
      await productPage.reviewsSection.scrollIntoViewIfNeeded();
      await page.locator('[data-testid="write-review-button"]').click();
      
      // Submit inappropriate review
      await page.locator('[data-testid="review-rating"]').first().click(); // 1 star
      await page.locator('input[name="reviewTitle"]').fill('Inappropriate content test');
      await page.locator('textarea[name="reviewBody"]').fill('This contains inappropriate language and spam content');
      
      await page.locator('[data-testid="submit-review"]').click();
      await expect(page.locator('[data-testid="review-success"]')).toBeVisible();
    });
    
    // Admin rejects the review
    await test.step('Admin rejects inappropriate review', async () => {
      const adminAuthHelper = new AuthHelper(adminPage);
      await adminAuthHelper.loginAsAdmin();
      
      await adminPage.goto('http://localhost:3001/moderation');
      
      const pendingReviews = adminPage.locator('[data-testid="pending-review-item"]');
      const inappropriateReview = pendingReviews.filter({ 
        has: adminPage.locator('text="Inappropriate content test"') 
      }).first();
      
      await inappropriateReview.locator('[data-testid="reject-review"]').click();
      
      // Provide rejection reason
      await adminPage.locator('textarea[name="rejectionReason"]').fill('Contains inappropriate content');
      await adminPage.locator('[data-testid="confirm-rejection"]').click();
      
      await expect(adminPage.locator('[data-testid="rejection-success"]')).toBeVisible();
    });
    
    // Verify rejected review doesn't appear publicly
    await test.step('Rejected review does not appear publicly', async () => {
      await page.reload();
      await productPage.reviewsSection.scrollIntoViewIfNeeded();
      
      const reviewTitles = await page.locator('[data-testid="review-title"]').allTextContents();
      expect(reviewTitles).not.toContain('Inappropriate content test');
    });
  });

  test('Review validation and error handling', async ({ 
    page,
    catalogPage,
    productPage
  }) => {
    await catalogPage.goto();
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    
    await productPage.reviewsSection.scrollIntoViewIfNeeded();
    await page.locator('[data-testid="write-review-button"]').click();
    
    // Test form validation
    await test.step('Form validation for empty fields', async () => {
      await page.locator('[data-testid="submit-review"]').click();
      
      await expect(page.locator('[data-testid="rating-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="title-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="body-error"]')).toBeVisible();
    });
    
    // Test character limits
    await test.step('Character limit validation', async () => {
      const longTitle = 'A'.repeat(101); // Assuming 100 char limit
      const longBody = 'B'.repeat(1001); // Assuming 1000 char limit
      
      await page.locator('input[name="reviewTitle"]').fill(longTitle);
      await page.locator('textarea[name="reviewBody"]').fill(longBody);
      
      await expect(page.locator('[data-testid="title-length-error"]')).toBeVisible();
      await expect(page.locator('[data-testid="body-length-error"]')).toBeVisible();
    });
    
    // Test file upload validation
    await test.step('Photo upload validation', async () => {
      const fileChooserPromise = page.waitForEvent('filechooser');
      await page.locator('[data-testid="photo-upload"]').click();
      const fileChooser = await fileChooserPromise;
      
      // Try uploading invalid file type
      await fileChooser.setFiles(['e2e/fixtures/invalid-file.txt']);
      await expect(page.locator('[data-testid="file-type-error"]')).toBeVisible();
      
      // Try uploading oversized file (would need large file)
      // await fileChooser.setFiles(['e2e/fixtures/large-file.jpg']);
      // await expect(page.locator('[data-testid="file-size-error"]')).toBeVisible();
    });
  });

  test('Bulk review moderation', async ({ adminPage }) => {
    const adminAuthHelper = new AuthHelper(adminPage);
    await adminAuthHelper.loginAsAdmin();
    
    await adminPage.goto('http://localhost:3001/moderation');
    
    // Test bulk approval
    await test.step('Bulk approve multiple reviews', async () => {
      // Select multiple reviews
      const checkboxes = adminPage.locator('[data-testid="review-checkbox"]');
      const count = Math.min(await checkboxes.count(), 3); // Approve up to 3
      
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
      
      await adminPage.locator('[data-testid="bulk-approve"]').click();
      await expect(adminPage.locator('[data-testid="bulk-success"]')).toBeVisible();
    });
    
    // Test bulk rejection
    await test.step('Bulk reject multiple reviews', async () => {
      const checkboxes = adminPage.locator('[data-testid="review-checkbox"]');
      const count = Math.min(await checkboxes.count(), 2); // Reject up to 2
      
      for (let i = 0; i < count; i++) {
        await checkboxes.nth(i).check();
      }
      
      await adminPage.locator('[data-testid="bulk-reject"]').click();
      
      // Provide bulk rejection reason
      await adminPage.locator('textarea[name="bulkRejectionReason"]').fill('Bulk rejection for testing');
      await adminPage.locator('[data-testid="confirm-bulk-rejection"]').click();
      
      await expect(adminPage.locator('[data-testid="bulk-success"]')).toBeVisible();
    });
  });

  test('Review analytics and reporting', async ({ adminPage }) => {
    const adminAuthHelper = new AuthHelper(adminPage);
    await adminAuthHelper.loginAsAdmin();
    
    await adminPage.goto('http://localhost:3001/analytics/reviews');
    
    // Verify analytics dashboard loads
    await expect(adminPage.locator('[data-testid="review-analytics"]')).toBeVisible();
    
    // Check key metrics
    await expect(adminPage.locator('[data-testid="total-reviews"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="pending-count"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="approved-count"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="rejected-count"]')).toBeVisible();
    
    // Verify charts/graphs
    await expect(adminPage.locator('[data-testid="reviews-chart"]')).toBeVisible();
    await expect(adminPage.locator('[data-testid="rating-distribution"]')).toBeVisible();
    
    // Test date filtering
    await adminPage.locator('[data-testid="date-filter"]').selectOption('last-30-days');
    await TestUtils.waitForNetworkIdle(adminPage);
    
    // Verify data updates
    await expect(adminPage.locator('[data-testid="analytics-loading"]')).not.toBeVisible();
  });

  test('Review helpfulness voting', async ({ 
    page,
    catalogPage,
    productPage
  }) => {
    await catalogPage.goto();
    await catalogPage.clickFirstProduct();
    await productPage.waitForLoad();
    
    await productPage.reviewsSection.scrollIntoViewIfNeeded();
    
    // Find a review and test voting
    const review = page.locator('[data-testid="review-item"]').first();
    await expect(review).toBeVisible();
    
    // Vote helpful
    await review.locator('[data-testid="helpful-button"]').click();
    await expect(review.locator('[data-testid="helpful-success"]')).toBeVisible();
    
    // Verify vote count increased
    const helpfulCount = await review.locator('[data-testid="helpful-count"]').textContent();
    expect(parseInt(helpfulCount || '0')).toBeGreaterThan(0);
    
    // Test voting again (should be prevented)
    await review.locator('[data-testid="helpful-button"]').click();
    await expect(page.locator('[data-testid="already-voted"]')).toBeVisible();
  });
});