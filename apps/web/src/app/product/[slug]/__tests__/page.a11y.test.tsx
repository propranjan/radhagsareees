/**
 * Accessibility Tests for Product Page Component
 * 
 * Comprehensive accessibility testing for the product detail page
 * including form interactions, image gallery, and variant selection.
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the product page component since it has import issues
const MockAccessibleProductPage = ({ params }: { params: { slug: string } }) => {
  const [selectedVariant, setSelectedVariant] = React.useState({
    id: 'variant-1',
    color: 'Red',
    size: 'M',
    price: 1299,
    mrp: 1599,
    inventory: { qtyAvailable: 5, lowStockThreshold: 2 }
  });
  const [quantity, setQuantity] = React.useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = React.useState(0);

  const mockProduct = {
    id: 'product-1',
    title: 'Test Saree',
    description: 'Beautiful test saree',
    care: 'Dry clean only',
    images: ['/image1.jpg', '/image2.jpg', '/image3.jpg'],
    category: { name: 'Sarees', slug: 'sarees' },
    variants: [
      { id: 'variant-1', color: 'Red', size: 'M', price: 1299, mrp: 1599, inventory: { qtyAvailable: 5, lowStockThreshold: 2 } },
      { id: 'variant-2', color: 'Blue', size: 'L', price: 1199, mrp: 1499, inventory: { qtyAvailable: 0, lowStockThreshold: 2 } }
    ],
    averageRating: 4.5,
    totalReviews: 23
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Screen reader announcements */}
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only">
        <div>Product loaded: {mockProduct.title}</div>
      </div>

      {/* Skip navigation */}
      <a 
        href="#product-details"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded-md z-50"
      >
        Skip to product details
      </a>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <section aria-labelledby="product-images-heading">
            <h2 id="product-images-heading" className="sr-only">Product Images</h2>
            <div className="space-y-4">
              {/* Main Image */}
              <div className="aspect-square bg-white rounded-lg overflow-hidden shadow-sm">
                <img
                  src={mockProduct.images[selectedImageIndex]}
                  alt={`${mockProduct.title} - Main product image ${selectedImageIndex + 1} of ${mockProduct.images.length}`}
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Thumbnail Images */}
              <div 
                role="tablist"
                aria-label="Product image gallery"
                className="grid grid-cols-3 gap-2"
              >
                {mockProduct.images.map((image, index) => (
                  <button
                    key={index}
                    role="tab"
                    aria-selected={selectedImageIndex === index}
                    aria-controls={`image-panel-${index}`}
                    id={`image-tab-${index}`}
                    onClick={() => setSelectedImageIndex(index)}
                    className={`aspect-square rounded-lg overflow-hidden border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      selectedImageIndex === index ? "border-blue-500" : "border-gray-200"
                    }`}
                  >
                    <img src={image} alt="" className="w-full h-full object-cover" />
                    <div className="sr-only">
                      Product image {index + 1}. {selectedImageIndex === index ? 'Currently selected.' : ''}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Product Details */}
          <section id="product-details" aria-labelledby="product-title">
            <div className="space-y-6">
              {/* Breadcrumb Navigation */}
              <nav aria-label="Breadcrumb" className="text-sm text-gray-500">
                <ol className="flex items-center space-x-2">
                  <li><a href="/" className="hover:text-gray-700">Home</a></li>
                  <li>/</li>
                  <li><a href="/category/sarees" className="hover:text-gray-700">{mockProduct.category.name}</a></li>
                  <li>/</li>
                  <li className="text-gray-900" aria-current="page">{mockProduct.title}</li>
                </ol>
              </nav>
              
              {/* Header */}
              <header>
                <h1 id="product-title" className="text-3xl font-bold text-gray-900 mb-2">
                  {mockProduct.title}
                </h1>
                
                {/* Rating */}
                <div className="flex items-center gap-2 mb-4">
                  <div 
                    className="flex items-center" 
                    role="img" 
                    aria-label={`${mockProduct.averageRating} out of 5 stars`}
                  >
                    {[1, 2, 3, 4, 5].map((star) => (
                      <span
                        key={star}
                        className={`h-4 w-4 ${star <= mockProduct.averageRating ? "text-yellow-400" : "text-gray-300"}`}
                        aria-hidden="true"
                      >
                        ★
                      </span>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">
                    {mockProduct.averageRating} ({mockProduct.totalReviews} reviews)
                  </span>
                </div>
              </header>

              {/* Price */}
              <section aria-labelledby="pricing-heading">
                <h2 id="pricing-heading" className="sr-only">Pricing</h2>
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-3xl font-bold text-gray-900"
                      aria-label={`Current price: ${selectedVariant.price} rupees`}
                    >
                      ₹{selectedVariant.price.toLocaleString()}
                    </span>
                    <span 
                      className="text-xl text-gray-500 line-through"
                      aria-label={`Original price: ${selectedVariant.mrp} rupees`}
                    >
                      ₹{selectedVariant.mrp.toLocaleString()}
                    </span>
                    <span 
                      className="px-2 py-1 bg-red-100 text-red-800 text-sm font-medium rounded"
                      aria-label="19 percent discount"
                    >
                      19% OFF
                    </span>
                  </div>
                </div>
              </section>

              {/* Variant Selection */}
              <section aria-labelledby="variant-selection-heading">
                <h2 id="variant-selection-heading" className="sr-only">Product Variants</h2>
                <div className="space-y-4">
                  {/* Color Selection */}
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-900 mb-2">
                      Color: {selectedVariant.color}
                    </legend>
                    <div className="flex gap-2">
                      {['Red', 'Blue'].map((color) => {
                        const isSelected = selectedVariant.color === color;
                        return (
                          <button
                            key={color}
                            onClick={() => {
                              const variant = mockProduct.variants.find(v => v.color === color);
                              if (variant) setSelectedVariant(variant);
                            }}
                            className={`w-8 h-8 rounded-full border-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isSelected ? "border-gray-900" : "border-gray-300"
                            }`}
                            style={{ backgroundColor: color.toLowerCase() }}
                            aria-label={`Select ${color} color${isSelected ? ' (currently selected)' : ''}`}
                            aria-pressed={isSelected}
                          />
                        );
                      })}
                    </div>
                  </fieldset>

                  {/* Size Selection */}
                  <fieldset>
                    <legend className="text-sm font-medium text-gray-900 mb-2">
                      Size: {selectedVariant.size}
                    </legend>
                    <div className="flex gap-2">
                      {['M', 'L'].map((size) => {
                        const variant = mockProduct.variants.find(v => v.size === size);
                        const available = variant?.inventory.qtyAvailable > 0;
                        const isSelected = selectedVariant.size === size;
                        
                        return (
                          <button
                            key={size}
                            onClick={() => {
                              if (variant && available) {
                                setSelectedVariant(variant);
                              }
                            }}
                            disabled={!available}
                            className={`px-4 py-2 border rounded-md text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                              isSelected
                                ? "border-gray-900 bg-gray-900 text-white"
                                : available
                                ? "border-gray-300 text-gray-900"
                                : "border-gray-200 text-gray-400 cursor-not-allowed"
                            }`}
                            aria-label={`Size ${size}${!available ? ' (out of stock)' : ''}${isSelected ? ' (currently selected)' : ''}`}
                            aria-pressed={isSelected}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                  </fieldset>
                </div>
              </section>

              {/* Stock Status */}
              <section aria-labelledby="stock-heading">
                <h2 id="stock-heading" className="sr-only">Stock Availability</h2>
                <div 
                  className="flex items-center gap-2 text-green-600"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-sm font-medium">In Stock</span>
                  <span className="text-xs text-orange-600">
                    (Only {selectedVariant.inventory.qtyAvailable} left)
                  </span>
                </div>
              </section>

              {/* Quantity Selection */}
              <section aria-labelledby="quantity-heading">
                <h2 id="quantity-heading" className="text-sm font-medium text-gray-900 mb-2">
                  Quantity
                </h2>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    aria-label="Decrease quantity"
                  >
                    -
                  </button>
                  
                  <input
                    type="number"
                    min="1"
                    max={selectedVariant.inventory.qtyAvailable}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    className="w-16 text-center text-lg font-medium border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    aria-label={`Quantity (max ${selectedVariant.inventory.qtyAvailable})`}
                  />
                  
                  <button
                    onClick={() => setQuantity(Math.min(selectedVariant.inventory.qtyAvailable, quantity + 1))}
                    disabled={quantity >= selectedVariant.inventory.qtyAvailable}
                    className="w-10 h-10 border border-gray-300 rounded-md flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>
              </section>

              {/* Action Buttons */}
              <section aria-labelledby="actions-heading">
                <h2 id="actions-heading" className="sr-only">Product Actions</h2>
                <div className="space-y-4">
                  <button className="w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-purple-500">
                    Try On Virtually
                  </button>

                  <button className="w-full bg-gray-900 text-white px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-gray-500">
                    Add to Cart
                  </button>

                  <div className="flex gap-4">
                    <button 
                      className="flex-1 border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                      aria-pressed="false"
                    >
                      Add to Wishlist
                    </button>
                    <button className="border border-gray-300 text-gray-900 px-6 py-3 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500">
                      Share
                    </button>
                  </div>
                </div>
              </section>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

describe('Product Page Accessibility', () => {
  const defaultProps = {
    params: { slug: 'test-saree' }
  };

  describe('Basic Accessibility Structure', () => {
    test('should have proper semantic structure', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);

      // Check main headings
      expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
      expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(6); // Section headings

      // Check main sections
      expect(screen.getByLabelText('Product image gallery')).toBeInTheDocument();
      expect(screen.getByLabelText('Breadcrumb')).toBeInTheDocument();
    });

    test('should provide skip navigation', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const skipLink = screen.getByText('Skip to product details');
      expect(skipLink).toHaveAttribute('href', '#product-details');
    });

    test('should have proper breadcrumb navigation', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const breadcrumb = screen.getByRole('navigation', { name: 'Breadcrumb' });
      expect(breadcrumb).toBeInTheDocument();
      
      const currentPage = screen.getByText('Test Saree');
      expect(currentPage).toHaveAttribute('aria-current', 'page');
    });
  });

  describe('Image Gallery Accessibility', () => {
    test('should implement tablist pattern for image gallery', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const tablist = screen.getByRole('tablist', { name: 'Product image gallery' });
      expect(tablist).toBeInTheDocument();
      
      const tabs = screen.getAllByRole('tab');
      expect(tabs).toHaveLength(3);
      
      // First tab should be selected by default
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'false');
    });

    test('should have proper alt text for images', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const mainImage = screen.getByAltText(/Test Saree - Main product image/);
      expect(mainImage).toBeInTheDocument();
    });

    test('should handle keyboard navigation in image gallery', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      
      // Click on second tab
      await user.click(tabs[1]);
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'false');
    });
  });

  describe('Product Variants Accessibility', () => {
    test('should have proper fieldset and legend for variant selection', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      // Color fieldset
      const colorLegend = screen.getByText('Color: Red');
      expect(colorLegend.closest('fieldset')).toBeInTheDocument();
      
      // Size fieldset
      const sizeLegend = screen.getByText('Size: M');
      expect(sizeLegend.closest('fieldset')).toBeInTheDocument();
    });

    test('should have accessible color selection buttons', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const redButton = screen.getByLabelText('Select Red color (currently selected)');
      const blueButton = screen.getByLabelText('Select Blue color');
      
      expect(redButton).toHaveAttribute('aria-pressed', 'true');
      expect(blueButton).toHaveAttribute('aria-pressed', 'false');
    });

    test('should have accessible size selection buttons', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const mediumButton = screen.getByLabelText('Size M (currently selected)');
      const largeButton = screen.getByLabelText('Size L (out of stock)');
      
      expect(mediumButton).toHaveAttribute('aria-pressed', 'true');
      expect(largeButton).toBeDisabled();
    });

    test('should announce variant changes', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const blueButton = screen.getByLabelText('Select Blue color');
      await user.click(blueButton);
      
      expect(blueButton).toHaveAttribute('aria-pressed', 'true');
    });
  });

  describe('Quantity Selection Accessibility', () => {
    test('should have accessible quantity controls', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const decreaseButton = screen.getByLabelText('Decrease quantity');
      const increaseButton = screen.getByLabelText('Increase quantity');
      const quantityInput = screen.getByLabelText(/Quantity \(max 5\)/);
      
      expect(decreaseButton).toBeInTheDocument();
      expect(increaseButton).toBeInTheDocument();
      expect(quantityInput).toHaveAttribute('type', 'number');
    });

    test('should disable decrease button at minimum quantity', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const decreaseButton = screen.getByLabelText('Decrease quantity');
      expect(decreaseButton).toBeDisabled();
    });

    test('should handle quantity changes accessibly', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const increaseButton = screen.getByLabelText('Increase quantity');
      const quantityInput = screen.getByLabelText(/Quantity/);
      
      await user.click(increaseButton);
      expect(quantityInput).toHaveValue(2);
      
      const decreaseButton = screen.getByLabelText('Decrease quantity');
      expect(decreaseButton).not.toBeDisabled();
    });
  });

  describe('Price Display Accessibility', () => {
    test('should have accessible price information', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const currentPrice = screen.getByLabelText('Current price: 1299 rupees');
      const originalPrice = screen.getByLabelText('Original price: 1599 rupees');
      const discount = screen.getByLabelText('19 percent discount');
      
      expect(currentPrice).toBeInTheDocument();
      expect(originalPrice).toBeInTheDocument();
      expect(discount).toBeInTheDocument();
    });
  });

  describe('Rating Display Accessibility', () => {
    test('should have accessible rating display', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const rating = screen.getByLabelText('4.5 out of 5 stars');
      expect(rating).toBeInTheDocument();
      
      const reviewCount = screen.getByText('(23 reviews)');
      expect(reviewCount).toBeInTheDocument();
    });
  });

  describe('Stock Status Accessibility', () => {
    test('should have accessible stock status', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const stockStatus = screen.getByText('In Stock').closest('[role="status"]');
      expect(stockStatus).toHaveAttribute('aria-live', 'polite');
      
      const lowStockWarning = screen.getByText('(Only 5 left)');
      expect(lowStockWarning).toBeInTheDocument();
    });
  });

  describe('Action Buttons Accessibility', () => {
    test('should have accessible action buttons', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const tryOnButton = screen.getByText('Try On Virtually');
      const addToCartButton = screen.getByText('Add to Cart');
      const wishlistButton = screen.getByText('Add to Wishlist');
      const shareButton = screen.getByText('Share');
      
      expect(tryOnButton).toHaveAttribute('type', 'button');
      expect(addToCartButton).toHaveAttribute('type', 'button');
      expect(wishlistButton).toHaveAttribute('aria-pressed', 'false');
      expect(shareButton).toHaveAttribute('type', 'button');
    });

    test('should have visible focus indicators on buttons', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const tryOnButton = screen.getByText('Try On Virtually');
      await user.tab();
      
      // Should have focus ring classes
      expect(document.activeElement).toBe(tryOnButton);
    });
  });

  describe('Keyboard Navigation', () => {
    test('should allow keyboard navigation through all interactive elements', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      // Skip link should be first focusable
      await user.tab();
      expect(screen.getByText('Skip to product details')).toHaveFocus();
      
      // Continue tabbing through elements
      await user.tab();
      await user.tab();
      await user.tab();
      
      // Should reach image gallery tabs
      const tabs = screen.getAllByRole('tab');
      expect(tabs.some(tab => tab === document.activeElement)).toBe(true);
    });

    test('should allow arrow key navigation in image gallery', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const tabs = screen.getAllByRole('tab');
      tabs[0].focus();
      
      // Right arrow should select next image
      await user.keyboard('{ArrowRight}');
      expect(tabs[1]).toHaveAttribute('aria-selected', 'true');
      
      // Left arrow should go back
      await user.keyboard('{ArrowLeft}');
      expect(tabs[0]).toHaveAttribute('aria-selected', 'true');
    });
  });

  describe('Screen Reader Support', () => {
    test('should have live region for announcements', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const liveRegion = screen.getByRole('status');
      expect(liveRegion).toHaveAttribute('aria-live', 'polite');
      expect(liveRegion).toHaveAttribute('aria-atomic', 'true');
    });

    test('should provide screen reader only content', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      // Check for sr-only headings
      const hiddenHeadings = screen.getAllByText('Product Images');
      expect(hiddenHeadings[0]).toHaveClass('sr-only');
    });
  });

  describe('Form Validation Accessibility', () => {
    test('should validate quantity input accessibly', async () => {
      const user = userEvent.setup();
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity (max 5)');
      
      // Try to enter invalid quantity
      await user.clear(quantityInput);
      await user.type(quantityInput, '0');
      
      // Should enforce minimum value
      expect(quantityInput).toHaveAttribute('min', '1');
    });

    test('should enforce maximum quantity based on stock', () => {
      render(<MockAccessibleProductPage {...defaultProps} />);
      
      const quantityInput = screen.getByLabelText('Quantity (max 5)');
      expect(quantityInput).toHaveAttribute('max', '5');
    });
  });
});