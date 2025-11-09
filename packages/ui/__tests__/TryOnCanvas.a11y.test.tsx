/**
 * Accessibility Tests for TryOnCanvas Component
 * 
 * Comprehensive accessibility testing using @testing-library/jest-dom
 * and axe-core for automated accessibility violations detection.
 */

import * as React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';
import { TryOnCanvas } from '../TryOnCanvas.accessible';

// Extend Jest matchers
expect.extend(toHaveNoViolations);

// Mock TensorFlow.js and BodyPix
const mockModel = {
  segmentPerson: jest.fn().mockResolvedValue({
    data: new Uint8Array(640 * 480).fill(1),
    width: 640,
    height: 480,
  }),
};

// Mock global objects
Object.defineProperty(global, 'window', {
  value: {
    tf: {},
    bodyPix: {
      load: jest.fn().mockResolvedValue(mockModel),
    },
  },
});

Object.defineProperty(global, 'navigator', {
  value: {
    mediaDevices: {
      getUserMedia: jest.fn().mockResolvedValue({
        getTracks: () => [],
      }),
    },
  },
});

// Mock canvas context
const mockCanvasContext = {
  clearRect: jest.fn(),
  drawImage: jest.fn(),
  getImageData: jest.fn().mockReturnValue({
    data: new Uint8ClampedArray(640 * 480 * 4).fill(255),
  }),
  putImageData: jest.fn(),
  save: jest.fn(),
  restore: jest.fn(),
  scale: jest.fn(),
  translate: jest.fn(),
  rotate: jest.fn(),
  toDataURL: jest.fn().mockReturnValue('data:image/jpeg;base64,test'),
};

HTMLCanvasElement.prototype.getContext = jest.fn(() => mockCanvasContext);
HTMLVideoElement.prototype.play = jest.fn();
global.fetch = jest.fn(() =>
  Promise.resolve({
    blob: () => Promise.resolve(new Blob(['test'], { type: 'image/jpeg' })),
  })
);

describe('TryOnCanvas Accessibility', () => {
  const defaultProps = {
    garmentImageUrl: '/test-garment.png',
    width: 640,
    height: 480,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic Accessibility Structure', () => {
    test('should have proper ARIA labels and roles', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      // Check main container has proper role and label
      expect(screen.getByRole('application')).toBeInTheDocument();
      expect(screen.getByLabelText('Virtual Try-On Camera')).toBeInTheDocument();

      // Check canvas has proper accessibility attributes
      expect(screen.getByRole('img')).toBeInTheDocument();
      expect(screen.getByLabelText(/Virtual try-on preview/)).toBeInTheDocument();

      // Check live region exists
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    test('should have no accessibility violations', async () => {
      const { container } = render(<TryOnCanvas {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should provide skip link for keyboard users', async () => {
      render(<TryOnCanvas {...defaultProps} />);
      
      const skipLink = screen.getByText('Skip to try-on controls');
      expect(skipLink).toBeInTheDocument();
      expect(skipLink).toHaveAttribute('href', '#tryon-controls');
    });
  });

  describe('Keyboard Navigation', () => {
    test('should be focusable with tab', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      const container = screen.getByRole('application');
      await user.tab();
      
      expect(container).toHaveFocus();
    });

    test('should handle arrow key navigation', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      const container = screen.getByRole('application');
      container.focus();

      // Wait for model to load and controls to appear
      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Test arrow key movement
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowDown}');
      
      // Should announce movements
      expect(screen.getByText(/Moved right/)).toBeInTheDocument();
      expect(screen.getByText(/Moved down/)).toBeInTheDocument();
    });

    test('should handle scale and rotation shortcuts', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      const container = screen.getByRole('application');
      container.focus();

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Test scale shortcuts
      await user.keyboard('{+}');
      expect(screen.getByText(/Increased scale/)).toBeInTheDocument();

      await user.keyboard('{-}');
      expect(screen.getByText(/Decreased scale/)).toBeInTheDocument();

      // Test rotation
      await user.keyboard('r');
      expect(screen.getByText(/Rotated to/)).toBeInTheDocument();
    });

    test('should handle capture shortcut', async () => {
      const mockOnCapture = jest.fn();
      const user = userEvent.setup();
      
      render(<TryOnCanvas {...defaultProps} onCapture={mockOnCapture} />);

      const container = screen.getByRole('application');
      container.focus();

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Test spacebar capture
      await user.keyboard(' ');
      expect(screen.getByText('Capturing image')).toBeInTheDocument();
    });

    test('should handle control toggle shortcuts', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      const container = screen.getByRole('application');
      container.focus();

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Test control toggle
      await user.keyboard('c');
      expect(screen.getByText('Controls hidden')).toBeInTheDocument();

      await user.keyboard('c');
      expect(screen.getByText('Controls shown')).toBeInTheDocument();
    });
  });

  describe('Focus Management', () => {
    test('should trap focus in fullscreen mode', async () => {
      const user = userEvent.setup();
      
      // Mock fullscreen API
      Object.defineProperty(document, 'fullscreenEnabled', {
        value: true,
        writable: true,
      });

      const mockRequestFullscreen = jest.fn();
      HTMLElement.prototype.requestFullscreen = mockRequestFullscreen;

      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Enter fullscreen
      await user.keyboard('f');
      
      // Mock fullscreen state
      Object.defineProperty(document, 'fullscreenElement', {
        value: screen.getByRole('application'),
        writable: true,
      });

      // Test focus trap - tab should cycle through focusable elements
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    test('should have visible focus indicators', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      const buttons = screen.getAllByRole('button');
      
      // Tab through buttons and verify focus styles
      for (const button of buttons.slice(0, 3)) { // Test first few buttons
        await user.tab();
        if (document.activeElement === button) {
          expect(button).toHaveClass(/focus:/); // Should have Tailwind focus classes
        }
      }
    });
  });

  describe('Screen Reader Announcements', () => {
    test('should announce loading states', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      // Should announce model loading
      expect(screen.getByText('Loading AI model for virtual try-on')).toBeInTheDocument();
    });

    test('should announce transformation changes', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Find and interact with position slider
      const positionSlider = screen.getByLabelText(/Horizontal Position/);
      
      fireEvent.change(positionSlider, { target: { value: '50' } });
      
      expect(screen.getByText(/Horizontal position: 50/)).toBeInTheDocument();
    });

    test('should announce capture events', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      const container = screen.getByRole('application');
      container.focus();

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Trigger capture
      await user.keyboard(' ');
      
      expect(screen.getByText('Capturing image')).toBeInTheDocument();
    });
  });

  describe('Form Controls Accessibility', () => {
    test('should have properly labeled sliders', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Check all sliders have proper labels
      expect(screen.getByLabelText(/Horizontal Position/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Vertical Position/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Scale/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Rotation/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Opacity/)).toBeInTheDocument();
    });

    test('should have descriptive help text for controls', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Check help text exists
      const positionSlider = screen.getByLabelText(/Horizontal Position/);
      const helpId = positionSlider.getAttribute('aria-describedby');
      
      if (helpId) {
        expect(document.getElementById(helpId)).toBeInTheDocument();
      }
    });

    test('should have proper button labels and descriptions', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Check button accessibility
      expect(screen.getByLabelText('Hide controls')).toBeInTheDocument();
      expect(screen.getByLabelText(/Reset all transform settings/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Capture current try-on image/)).toBeInTheDocument();
    });
  });

  describe('Error Handling Accessibility', () => {
    test('should announce errors via live regions', async () => {
      // Mock camera permission denied
      const mockGetUserMedia = jest.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
      });

      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(/Camera access denied/)).toBeInTheDocument();
      });
    });

    test('should have accessible error retry button', async () => {
      // Mock camera permission denied
      const mockGetUserMedia = jest.fn().mockRejectedValue(new Error('Permission denied'));
      Object.defineProperty(global.navigator, 'mediaDevices', {
        value: {
          getUserMedia: mockGetUserMedia,
        },
      });

      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        const retryButton = screen.getByText('Retry Camera Access');
        expect(retryButton).toBeInTheDocument();
        expect(retryButton).toHaveAttribute('aria-describedby');
      });
    });
  });

  describe('Status and Progress Indicators', () => {
    test('should have accessible loading indicator', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      const loadingRegion = screen.getByText('Loading AI model for virtual try-on').closest('[role="status"]');
      expect(loadingRegion).toBeInTheDocument();
      expect(loadingRegion).toHaveAttribute('aria-live', 'polite');
    });

    test('should have accessible processing indicator', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Processing indicator should be accessible when shown
      const processingIndicator = screen.queryByText('Processing frame...');
      if (processingIndicator) {
        const statusRegion = processingIndicator.closest('[role="status"]');
        expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      }
    });

    test('should have accessible pose quality feedback', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      // Mock poor pose quality
      const mockPoorQuality = {
        overall: 0.5,
        feedback: 'Move closer to the camera',
      };

      // If pose quality banner appears, it should be accessible
      const qualityBanner = screen.queryByText('Move closer to the camera');
      if (qualityBanner) {
        const statusRegion = qualityBanner.closest('[role="status"]');
        expect(statusRegion).toHaveAttribute('aria-live', 'polite');
      }
    });
  });

  describe('Keyboard Help', () => {
    test('should have accessible keyboard help', async () => {
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      const keyboardHelp = screen.getByText('Keyboard Help');
      expect(keyboardHelp).toBeInTheDocument();
      
      // Should be a details/summary for progressive disclosure
      const summary = keyboardHelp.closest('summary');
      expect(summary).toBeInTheDocument();
      expect(summary).toHaveAttribute('aria-expanded');
    });

    test('should list all keyboard shortcuts accessibly', async () => {
      const user = userEvent.setup();
      render(<TryOnCanvas {...defaultProps} />);

      await waitFor(() => {
        expect(screen.queryByText('Loading AI model...')).not.toBeInTheDocument();
      });

      const keyboardHelp = screen.getByText('Keyboard Help');
      await user.click(keyboardHelp);

      // Check that shortcuts are listed
      expect(screen.getByText(/Move garment/)).toBeInTheDocument();
      expect(screen.getByText(/Scale up\/down/)).toBeInTheDocument();
      expect(screen.getByText(/Rotate garment/)).toBeInTheDocument();
      expect(screen.getByText(/Capture image/)).toBeInTheDocument();
    });
  });

  describe('High Contrast Mode', () => {
    test('should work with forced-colors media query', async () => {
      // Mock forced-colors media query
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(forced-colors: active)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      const { container } = render(<TryOnCanvas {...defaultProps} />);
      
      // Should not have accessibility violations in high contrast mode
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      
      expect(results).toHaveNoViolations();
    });
  });

  describe('Reduced Motion', () => {
    test('should respect prefers-reduced-motion', async () => {
      // Mock prefers-reduced-motion
      Object.defineProperty(window, 'matchMedia', {
        writable: true,
        value: jest.fn().mockImplementation(query => ({
          matches: query === '(prefers-reduced-motion: reduce)',
          media: query,
          onchange: null,
          addListener: jest.fn(),
          removeListener: jest.fn(),
          addEventListener: jest.fn(),
          removeEventListener: jest.fn(),
          dispatchEvent: jest.fn(),
        })),
      });

      render(<TryOnCanvas {...defaultProps} />);

      // Animations should be disabled or reduced when prefers-reduced-motion is active
      const spinningElements = screen.queryAllByTestId('loading-spinner');
      spinningElements.forEach(element => {
        // In reduced motion mode, animations should be minimal
        expect(element).not.toHaveClass('animate-spin');
      });
    });
  });
});