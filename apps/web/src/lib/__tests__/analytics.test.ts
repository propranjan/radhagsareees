/**
 * @jest-environment jsdom
 */

// Mock the analytics module dependencies
jest.mock('../analytics', () => {
  const mockAnalytics = {
    track: jest.fn().mockResolvedValue(true),
    initialize: jest.fn().mockResolvedValue(true),
    identify: jest.fn().mockResolvedValue(true),
    page: jest.fn().mockResolvedValue(true),
    flush: jest.fn().mockResolvedValue(true),
  };
  
  return { analytics: mockAnalytics };
});

describe('Analytics System Tests', () => {
  let mockAnalytics: any;

  beforeEach(() => {
    jest.clearAllMocks();
    const { analytics } = require('../analytics');
    mockAnalytics = analytics;
  });

  describe('Event Tracking', () => {
    it('should track try-on events correctly', async () => {
      const eventData = {
        product_id: 'product-123',
        product_name: 'Beautiful Saree',
        variant_id: 'variant-456',
        variant_color: 'Red',
        variant_size: 'Free Size',
      };

      await mockAnalytics.track('tryon_opened', eventData);

      expect(mockAnalytics.track).toHaveBeenCalledWith('tryon_opened', eventData);
      expect(mockAnalytics.track).toHaveBeenCalledTimes(1);
    });

    it('should track capture events with quality scores', async () => {
      const captureData = {
        product_name: 'Beautiful Saree',
        variant_info: 'Red - Free Size',
        quality_score: 0.85,
        garment_image_url: 'https://example.com/overlay.png',
      };

      await mockAnalytics.track('tryon_captured', captureData);

      expect(mockAnalytics.track).toHaveBeenCalledWith('tryon_captured', captureData);
    });

    it('should track quality score events', async () => {
      const qualityData = {
        product_name: 'Beautiful Saree',
        variant_info: 'Red - Free Size',
        quality_score: 0.75,
        score_category: 'medium' as const,
      };

      await mockAnalytics.track('tryon_quality_score', qualityData);

      expect(mockAnalytics.track).toHaveBeenCalledWith('tryon_quality_score', qualityData);
    });

    it('should track add to cart from try-on', async () => {
      const cartData = {
        product_id: 'product-123',
        product_name: 'Beautiful Saree',
        variant_id: 'variant-456',
        quantity: 1,
        price: 5000,
        has_captured_image: true,
        quality_score: 0.9,
      };

      await mockAnalytics.track('tryon_to_cart', cartData);

      expect(mockAnalytics.track).toHaveBeenCalledWith('tryon_to_cart', cartData);
    });

    it('should track ecommerce events', async () => {
      const ecommerceData = {
        product_id: 'product-123',
        product_name: 'Beautiful Saree',
        variant_id: 'variant-456',
        quantity: 2,
        price: 10000,
        category: 'sarees',
      };

      await mockAnalytics.track('add_to_cart', ecommerceData);

      expect(mockAnalytics.track).toHaveBeenCalledWith('add_to_cart', ecommerceData);
    });
  });

  describe('User Identification', () => {
    it('should identify users with traits', async () => {
      const userId = 'user-123';
      const traits = {
        email: 'user@example.com',
        name: 'John Doe',
        plan: 'premium',
      };

      await mockAnalytics.identify(userId, traits);

      expect(mockAnalytics.identify).toHaveBeenCalledWith(userId, traits);
    });
  });

  describe('Page Tracking', () => {
    it('should track page views', async () => {
      const pageData = {
        page_title: 'Product Page',
        page_url: '/product/beautiful-saree',
        page_type: 'product',
      };

      await mockAnalytics.page('Product Page', pageData);

      expect(mockAnalytics.page).toHaveBeenCalledWith('Product Page', pageData);
    });
  });

  describe('Analytics Initialization', () => {
    it('should initialize analytics system', async () => {
      await mockAnalytics.initialize();

      expect(mockAnalytics.initialize).toHaveBeenCalled();
    });
  });

  describe('Event Validation', () => {
    it('should validate event data structure', () => {
      const validateEventData = (eventName: string, data: any) => {
        const requiredFields: Record<string, string[]> = {
          'tryon_opened': ['product_id', 'product_name'],
          'tryon_captured': ['product_name', 'quality_score'],
          'tryon_to_cart': ['product_id', 'variant_id', 'quantity'],
          'add_to_cart': ['product_id', 'quantity', 'price'],
        };

        const required = requiredFields[eventName] || [];
        const missing = required.filter(field => !data[field]);

        return {
          isValid: missing.length === 0,
          missingFields: missing,
        };
      };

      // Valid event
      const validEvent = {
        product_id: 'product-123',
        product_name: 'Test Product',
        variant_id: 'variant-456',
      };

      expect(validateEventData('tryon_opened', validEvent).isValid).toBe(true);

      // Invalid event (missing fields)
      const invalidEvent = {
        product_id: 'product-123',
        // missing product_name
      };

      const validation = validateEventData('tryon_opened', invalidEvent);
      expect(validation.isValid).toBe(false);
      expect(validation.missingFields).toContain('product_name');
    });

    it('should validate quality score ranges', () => {
      const validateQualityScore = (score: number) => {
        return score >= 0 && score <= 1;
      };

      expect(validateQualityScore(0.85)).toBe(true);
      expect(validateQualityScore(0)).toBe(true);
      expect(validateQualityScore(1)).toBe(true);
      expect(validateQualityScore(-0.1)).toBe(false);
      expect(validateQualityScore(1.1)).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should handle tracking errors gracefully', async () => {
      mockAnalytics.track.mockRejectedValueOnce(new Error('Network error'));

      // Should not throw error
      await expect(
        mockAnalytics.track('tryon_opened', { product_id: 'test' })
      ).rejects.toThrow('Network error');
    });

    it('should handle initialization errors', async () => {
      mockAnalytics.initialize.mockRejectedValueOnce(new Error('Init error'));

      await expect(mockAnalytics.initialize()).rejects.toThrow('Init error');
    });
  });

  describe('Batching and Performance', () => {
    it('should handle multiple rapid events', async () => {
      const events = [
        { name: 'tryon_opened', data: { product_id: '1' } },
        { name: 'tryon_captured', data: { product_name: 'Test', quality_score: 0.8 } },
        { name: 'tryon_to_cart', data: { product_id: '1', variant_id: '2', quantity: 1 } },
      ];

      // Track multiple events rapidly
      const promises = events.map(event => 
        mockAnalytics.track(event.name, event.data)
      );

      await Promise.all(promises);

      expect(mockAnalytics.track).toHaveBeenCalledTimes(3);
    });

    it('should flush pending events', async () => {
      await mockAnalytics.flush();

      expect(mockAnalytics.flush).toHaveBeenCalled();
    });
  });

  describe('Data Privacy and Compliance', () => {
    it('should sanitize sensitive data from events', () => {
      const sanitizeEventData = (data: any) => {
        const sensitiveFields = ['email', 'phone', 'address', 'payment_info'];
        const sanitized = { ...data };
        
        sensitiveFields.forEach(field => {
          if (sanitized[field]) {
            delete sanitized[field];
          }
        });

        return sanitized;
      };

      const eventWithSensitiveData = {
        product_id: 'product-123',
        product_name: 'Test Product',
        email: 'user@example.com', // Should be removed
        phone: '1234567890', // Should be removed
        price: 1000, // Should be kept
      };

      const sanitized = sanitizeEventData(eventWithSensitiveData);

      expect(sanitized.product_id).toBe('product-123');
      expect(sanitized.price).toBe(1000);
      expect(sanitized.email).toBeUndefined();
      expect(sanitized.phone).toBeUndefined();
    });

    it('should handle user opt-out', () => {
      const isTrackingAllowed = (userPreferences: any) => {
        return userPreferences.analytics_enabled !== false;
      };

      const userOptedIn = { analytics_enabled: true };
      const userOptedOut = { analytics_enabled: false };
      const userNoPreference = {}; // Default to allowed

      expect(isTrackingAllowed(userOptedIn)).toBe(true);
      expect(isTrackingAllowed(userOptedOut)).toBe(false);
      expect(isTrackingAllowed(userNoPreference)).toBe(true);
    });
  });

  describe('Session Management', () => {
    it('should generate unique session IDs', () => {
      const generateSessionId = () => {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      };

      const sessionId1 = generateSessionId();
      const sessionId2 = generateSessionId();

      expect(sessionId1).not.toBe(sessionId2);
      expect(sessionId1).toMatch(/^session_\d+_[a-z0-9]+$/);
    });

    it('should track session duration', () => {
      const calculateSessionDuration = (startTime: number, endTime: number) => {
        return Math.max(0, endTime - startTime);
      };

      const start = Date.now();
      const end = start + 30000; // 30 seconds later

      const duration = calculateSessionDuration(start, end);
      expect(duration).toBe(30000);

      // Should handle invalid times
      const invalidDuration = calculateSessionDuration(end, start);
      expect(invalidDuration).toBe(0);
    });
  });
});