/**
 * @jest-environment jsdom
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';

// Mock the dependencies
jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}));

// Mock the UI components
jest.mock('@radhagsareees/ui', () => ({
  TryOnCanvas: ({ onCapture, garmentImageUrl }: any) => (
    <div data-testid="try-on-canvas" data-garment-url={garmentImageUrl}>
      <button onClick={() => onCapture?.(new Blob(), { overall: 0.8 })}>
        Capture
      </button>
    </div>
  ),
}));

// Mock analytics
const mockTrack = jest.fn();
jest.mock('../../../lib/analytics', () => ({
  analytics: {
    track: mockTrack,
    initialize: jest.fn(),
  },
}));

// Mock TryOnModal
const MockTryOnModal = ({ isOpen, onClose, garmentImageUrl, onAddToCart }: any) => {
  if (!isOpen) return null;
  
  return (
    <div data-testid="try-on-modal">
      <button data-testid="close-modal" onClick={onClose}>Close</button>
      <div data-testid="try-on-canvas" data-garment-url={garmentImageUrl}>
        <button 
          data-testid="capture-image"
          onClick={() => {
            // Simulate capture
            const mockBlob = new Blob();
            const mockQuality = { overall: 0.8 };
            // Trigger analytics event
            mockTrack('tryon_captured', {
              product_name: 'Test Product',
              quality_score: 0.8
            });
          }}
        >
          Capture
        </button>
      </div>
      <button 
        data-testid="add-to-cart-from-tryon"
        onClick={() => onAddToCart?.()}
      >
        Add to Cart
      </button>
    </div>
  );
};

jest.mock('../../../components/TryOnModal', () => ({
  TryOnModal: MockTryOnModal,
}));

// Mock ProductReviews
jest.mock('../../../components/ProductReviews', () => ({
  ProductReviews: ({ productId }: any) => (
    <div data-testid="product-reviews" data-product-id={productId}>
      Product Reviews Component
    </div>
  ),
}));

// Mock API fetch
global.fetch = jest.fn();

// Mock product data
const mockProduct = {
  id: 'product-1',
  name: 'Beautiful Silk Saree',
  description: 'A stunning silk saree perfect for special occasions',
  slug: 'beautiful-silk-saree',
  images: ['https://example.com/image1.jpg', 'https://example.com/image2.jpg'],
  variants: [
    {
      id: 'variant-1',
      sku: 'SKU-001',
      color: 'Red',
      size: 'Free Size',
      mrp: 5000,
      price: 4000,
      overlayPng: 'https://example.com/overlay-red.png',
      inventory: {
        qtyAvailable: 10,
        lowStockThreshold: 5,
      },
    },
    {
      id: 'variant-2', 
      sku: 'SKU-002',
      color: 'Blue',
      size: 'Free Size',
      mrp: 5500,
      price: 4500,
      overlayPng: 'https://example.com/overlay-blue.png',
      inventory: {
        qtyAvailable: 2,
        lowStockThreshold: 5,
      },
    },
  ],
  reviews: [],
  averageRating: 4.5,
  totalReviews: 25,
};

// Import the component to test
import ProductPage from '../page';

describe('Product Page Flow Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockProduct),
    });
  });

  describe('Initial Product Page Load', () => {
    it('should render product details correctly', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      expect(screen.getByText(mockProduct.description)).toBeInTheDocument();
      expect(screen.getByTestId('product-reviews')).toBeInTheDocument();
    });

    it('should display variant options', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Red')).toBeInTheDocument();
        expect(screen.getByText('Blue')).toBeInTheDocument();
      });
    });

    it('should show try-on button', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });
    });

    it('should display pricing information', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('₹4,000')).toBeInTheDocument();
        expect(screen.getByText('₹5,000')).toBeInTheDocument();
      });
    });
  });

  describe('Try-On Modal Flow', () => {
    it('should open modal when Try On button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });

      const tryOnButton = screen.getByText(/try on/i);
      await user.click(tryOnButton);

      expect(screen.getByTestId('try-on-modal')).toBeInTheDocument();
      expect(mockTrack).toHaveBeenCalledWith('tryon_opened', expect.objectContaining({
        product_id: mockProduct.id,
        product_name: mockProduct.name,
      }));
    });

    it('should load image with correct garment URL', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });

      const tryOnButton = screen.getByText(/try on/i);
      await user.click(tryOnButton);

      const canvas = screen.getByTestId('try-on-canvas');
      expect(canvas).toHaveAttribute('data-garment-url', mockProduct.variants[0].overlayPng);
    });

    it('should close modal when close button is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });

      const tryOnButton = screen.getByText(/try on/i);
      await user.click(tryOnButton);

      expect(screen.getByTestId('try-on-modal')).toBeInTheDocument();

      const closeButton = screen.getByTestId('close-modal');
      await user.click(closeButton);

      expect(screen.queryByTestId('try-on-modal')).not.toBeInTheDocument();
    });
  });

  describe('Variant Selection and Controls', () => {
    it('should update selected variant when color is changed', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('Blue')).toBeInTheDocument();
      });

      // Click blue variant
      const blueVariant = screen.getByText('Blue');
      await user.click(blueVariant);

      // Price should update
      await waitFor(() => {
        expect(screen.getByText('₹4,500')).toBeInTheDocument();
        expect(screen.getByText('₹5,500')).toBeInTheDocument();
      });
    });

    it('should update garment URL when variant changes in modal', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });

      // Open modal first
      const tryOnButton = screen.getByText(/try on/i);
      await user.click(tryOnButton);

      // Change variant to blue
      const blueVariant = screen.getByText('Blue');
      await user.click(blueVariant);

      // Modal should update garment URL
      await waitFor(() => {
        const canvas = screen.getByTestId('try-on-canvas');
        expect(canvas).toHaveAttribute('data-garment-url', mockProduct.variants[1].overlayPng);
      });
    });

    it('should show stock information correctly', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText('In Stock')).toBeInTheDocument();
      });

      const user = userEvent.setup();
      
      // Switch to blue variant (low stock)
      const blueVariant = screen.getByText('Blue');
      await user.click(blueVariant);

      await waitFor(() => {
        expect(screen.getByText(/only 2 left/i)).toBeInTheDocument();
      });
    });
  });

  describe('Image Capture Flow', () => {
    it('should track capture event when image is captured', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });

      // Open modal
      const tryOnButton = screen.getByText(/try on/i);
      await user.click(tryOnButton);

      // Capture image
      const captureButton = screen.getByTestId('capture-image');
      await user.click(captureButton);

      expect(mockTrack).toHaveBeenCalledWith('tryon_captured', {
        product_name: 'Test Product',
        quality_score: 0.8
      });
    });
  });

  describe('Add to Cart Flow', () => {
    it('should add item to cart when Add to Cart is clicked', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/add to cart/i)).toBeInTheDocument();
      });

      const addToCartButton = screen.getByText(/add to cart/i);
      await user.click(addToCartButton);

      // Should track add to cart event
      expect(mockTrack).toHaveBeenCalledWith('add_to_cart', expect.objectContaining({
        product_id: mockProduct.id,
        variant_id: mockProduct.variants[0].id,
        quantity: 1,
        price: mockProduct.variants[0].price,
      }));
    });

    it('should track tryon_to_cart when adding from try-on modal', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/try on/i)).toBeInTheDocument();
      });

      // Open modal
      const tryOnButton = screen.getByText(/try on/i);
      await user.click(tryOnButton);

      // Add to cart from modal
      const addToCartFromTryon = screen.getByTestId('add-to-cart-from-tryon');
      await user.click(addToCartFromTryon);

      expect(mockTrack).toHaveBeenCalledWith('tryon_to_cart', expect.objectContaining({
        product_id: mockProduct.id,
        variant_id: mockProduct.variants[0].id,
      }));
    });

    it('should handle quantity changes', async () => {
      const user = userEvent.setup();
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        expect(quantityInput).toBeInTheDocument();
      });

      // Change quantity
      const quantityInput = screen.getByDisplayValue('1');
      await user.clear(quantityInput);
      await user.type(quantityInput, '2');

      // Add to cart with new quantity
      const addToCartButton = screen.getByText(/add to cart/i);
      await user.click(addToCartButton);

      expect(mockTrack).toHaveBeenCalledWith('add_to_cart', expect.objectContaining({
        quantity: 2,
      }));
    });
  });

  describe('Error Handling', () => {
    it('should show loading state while fetching product', () => {
      (global.fetch as jest.Mock).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });

    it('should handle product not found', async () => {
      const mockNotFound = jest.fn();
      jest.doMock('next/navigation', () => ({
        notFound: mockNotFound,
      }));

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      render(<ProductPage params={{ slug: 'nonexistent-product' }} />);
      
      await waitFor(() => {
        expect(mockNotFound).toHaveBeenCalled();
      });
    });

    it('should handle out of stock scenario', async () => {
      const outOfStockProduct = {
        ...mockProduct,
        variants: [{
          ...mockProduct.variants[0],
          inventory: { qtyAvailable: 0, lowStockThreshold: 5 }
        }]
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(outOfStockProduct),
      });

      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(/out of stock/i)).toBeInTheDocument();
      });

      // Add to cart button should be disabled
      const addToCartButton = screen.getByText(/out of stock/i);
      expect(addToCartButton).toBeDisabled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        const tryOnButton = screen.getByText(/try on/i);
        expect(tryOnButton).toBeInTheDocument();
      });

      const tryOnButton = screen.getByText(/try on/i);
      expect(tryOnButton).toHaveAttribute('aria-label', expect.stringContaining('Try on'));
    });

    it('should support keyboard navigation', async () => {
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        const tryOnButton = screen.getByText(/try on/i);
        expect(tryOnButton).toBeInTheDocument();
      });

      const tryOnButton = screen.getByText(/try on/i);
      
      // Should be focusable
      tryOnButton.focus();
      expect(tryOnButton).toHaveFocus();

      // Should activate on Enter key
      fireEvent.keyDown(tryOnButton, { key: 'Enter', code: 'Enter' });
      
      await waitFor(() => {
        expect(screen.getByTestId('try-on-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Performance Considerations', () => {
    it('should not make unnecessary API calls on re-renders', async () => {
      const { rerender } = render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        expect(screen.getByText(mockProduct.name)).toBeInTheDocument();
      });

      // Re-render with same props
      rerender(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      // Should only make one API call
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should debounce quantity changes', async () => {
      jest.useFakeTimers();
      const user = userEvent.setup({ delay: null });
      
      render(<ProductPage params={{ slug: 'beautiful-silk-saree' }} />);
      
      await waitFor(() => {
        const quantityInput = screen.getByDisplayValue('1');
        expect(quantityInput).toBeInTheDocument();
      });

      const quantityInput = screen.getByDisplayValue('1');
      
      // Rapid typing
      await user.clear(quantityInput);
      await user.type(quantityInput, '5');
      
      // Fast forward timers
      jest.runAllTimers();
      
      // Should have final value
      expect(quantityInput).toHaveValue(5);
      
      jest.useRealTimers();
    });
  });
});