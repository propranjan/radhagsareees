/**
 * Unit tests for TryOnCanvas helper functions
 * Tests quality scoring and pose detection logic without DOM dependencies
 */

import { 
  getQualityScore, 
  calculateFaceVisibility, 
  isSkinTone,
  QualityScore 
} from './qualityScoring';

// Mock interfaces to match TryOnCanvas types
interface MockSemanticSegmentation {
  data: Uint8Array;
  width: number;
  height: number;
}

interface MockImageData {
  data: Uint8ClampedArray;
  width: number;
  height: number;
}

describe('TryOnCanvas Helper Functions', () => {
  describe('isSkinTone', () => {
    test('should detect light skin tones', () => {
      expect(isSkinTone(220, 170, 120)).toBe(true);
      expect(isSkinTone(255, 200, 150)).toBe(true);
    });

    test('should detect medium skin tones', () => {
      expect(isSkinTone(160, 120, 90)).toBe(true);
      expect(isSkinTone(180, 130, 100)).toBe(true);
    });

    test('should detect dark skin tones', () => {
      expect(isSkinTone(120, 80, 60)).toBe(true);
      expect(isSkinTone(100, 70, 50)).toBe(true);
    });

    test('should reject non-skin colors', () => {
      expect(isSkinTone(0, 0, 0)).toBe(false); // Black
      expect(isSkinTone(255, 255, 255)).toBe(false); // White
      expect(isSkinTone(255, 0, 0)).toBe(false); // Red
      expect(isSkinTone(0, 255, 0)).toBe(false); // Green
      expect(isSkinTone(0, 0, 255)).toBe(false); // Blue
      expect(isSkinTone(50, 50, 50)).toBe(false); // Dark gray
    });

    test('should handle edge cases', () => {
      expect(isSkinTone(179, 119, 89)).toBe(false); // Just outside medium range
      expect(isSkinTone(180, 120, 90)).toBe(true); // Just inside medium range
    });
  });

  describe('calculateFaceVisibility', () => {
    test('should return 0 for empty image data', () => {
      const imageData: MockImageData = {
        data: new Uint8ClampedArray(0),
        width: 100,
        height: 100
      };
      expect(calculateFaceVisibility(imageData as ImageData, 100, 100)).toBe(0);
    });

    test('should return 0 for transparent image', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill with transparent pixels
      for (let i = 0; i < data.length; i += 4) {
        data[i] = 0;     // R
        data[i + 1] = 0; // G  
        data[i + 2] = 0; // B
        data[i + 3] = 0; // A (transparent)
      }

      const imageData: MockImageData = { data, width, height };
      expect(calculateFaceVisibility(imageData as ImageData, width, height)).toBe(0);
    });

    test('should detect skin tones in upper region', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill upper 30% with skin tone pixels
      const faceRegionHeight = Math.floor(height * 0.3);
      for (let y = 0; y < faceRegionHeight; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          data[pixelIndex] = 200;     // R (skin tone)
          data[pixelIndex + 1] = 150; // G
          data[pixelIndex + 2] = 120; // B
          data[pixelIndex + 3] = 255; // A (opaque)
        }
      }

      const imageData: MockImageData = { data, width, height };
      const score = calculateFaceVisibility(imageData as ImageData, width, height);
      expect(score).toBeGreaterThan(0.5);
    });

    test('should ignore non-skin colors', () => {
      const width = 100;
      const height = 100;
      const data = new Uint8ClampedArray(width * height * 4);
      
      // Fill upper region with blue pixels (not skin)
      const faceRegionHeight = Math.floor(height * 0.3);
      for (let y = 0; y < faceRegionHeight; y++) {
        for (let x = 0; x < width; x++) {
          const pixelIndex = (y * width + x) * 4;
          data[pixelIndex] = 0;       // R
          data[pixelIndex + 1] = 0;   // G
          data[pixelIndex + 2] = 255; // B (blue)
          data[pixelIndex + 3] = 255; // A
        }
      }

      const imageData: MockImageData = { data, width, height };
      const score = calculateFaceVisibility(imageData as ImageData, width, height);
      expect(score).toBe(0);
    });
  });

  describe('getQualityScore', () => {
    const createMockSegmentation = (personPixelRatio: number, totalPixels: number): MockSemanticSegmentation => {
      const data = new Uint8Array(totalPixels);
      const personPixels = Math.floor(totalPixels * personPixelRatio);
      
      // Fill first personPixels with 255 (person), rest with 0 (background)
      for (let i = 0; i < personPixels; i++) {
        data[i] = 255;
      }
      
      return {
        data,
        width: Math.sqrt(totalPixels),
        height: Math.sqrt(totalPixels)
      };
    };

    const createMockImageData = (width: number, height: number, hasSkinTone: boolean): MockImageData => {
      const data = new Uint8ClampedArray(width * height * 4);
      
      if (hasSkinTone) {
        // Fill upper region with skin tone
        const faceRegionHeight = Math.floor(height * 0.3);
        for (let y = 0; y < faceRegionHeight; y++) {
          for (let x = 0; x < width; x++) {
            const pixelIndex = (y * width + x) * 4;
            data[pixelIndex] = 200;     // Skin tone R
            data[pixelIndex + 1] = 150; // G
            data[pixelIndex + 2] = 120; // B
            data[pixelIndex + 3] = 255; // A
          }
        }
      }

      return { data, width, height };
    };

    test('should return high score for good positioning and face visibility', () => {
      const segmentation = createMockSegmentation(0.4, 10000); // Good coverage
      const imageData = createMockImageData(100, 100, true); // Has skin tone
      
      const score = getQualityScore(
        segmentation as any, 
        imageData as ImageData, 
        100, 
        100
      );

      expect(score.overall).toBeGreaterThan(0.7);
      expect(score.segmentationCoverage).toBeCloseTo(0.4);
      expect(score.faceVisibility).toBeGreaterThan(0);
      expect(score.properlyPositioned).toBe(true);
      expect(score.feedback).toBe('Perfect positioning!');
    });

    test('should return low score for too close positioning', () => {
      const segmentation = createMockSegmentation(0.8, 10000); // Too close
      const imageData = createMockImageData(100, 100, true);
      
      const score = getQualityScore(
        segmentation as any,
        imageData as ImageData,
        100,
        100
      );

      expect(score.segmentationCoverage).toBeCloseTo(0.8);
      expect(score.properlyPositioned).toBe(false);
      expect(score.feedback).toBe('Step back from the camera');
    });

    test('should return low score for too far positioning', () => {
      const segmentation = createMockSegmentation(0.1, 10000); // Too far
      const imageData = createMockImageData(100, 100, true);
      
      const score = getQualityScore(
        segmentation as any,
        imageData as ImageData,
        100,
        100
      );

      expect(score.segmentationCoverage).toBeCloseTo(0.1);
      expect(score.properlyPositioned).toBe(false);
      expect(score.feedback).toBe('Move closer to the camera');
    });

    test('should detect poor face visibility', () => {
      const segmentation = createMockSegmentation(0.4, 10000); // Good coverage
      const imageData = createMockImageData(100, 100, false); // No skin tone
      
      const score = getQualityScore(
        segmentation as any,
        imageData as ImageData,
        100,
        100
      );

      expect(score.faceVisibility).toBe(0);
      expect(score.feedback).toBe('Please face the camera');
    });

    test('should calculate weighted overall score correctly', () => {
      const segmentation = createMockSegmentation(0.3, 10000); // 30% coverage
      const imageData = createMockImageData(100, 100, false); // No face visibility
      
      const score = getQualityScore(
        segmentation as any,
        imageData as ImageData,
        100,
        100
      );

      // Expected: (0.3 * 0.6) + (0 * 0.4) = 0.18
      expect(score.overall).toBeCloseTo(0.18);
      expect(score.segmentationCoverage).toBeCloseTo(0.3);
      expect(score.faceVisibility).toBe(0);
    });

    test('should handle edge cases', () => {
      const segmentation = createMockSegmentation(0, 10000); // No person
      const imageData = createMockImageData(100, 100, false);
      
      const score = getQualityScore(
        segmentation as any,
        imageData as ImageData,
        100,
        100
      );

      expect(score.overall).toBe(0);
      expect(score.segmentationCoverage).toBe(0);
      expect(score.properlyPositioned).toBe(false);
    });

    test('should return correct feedback messages', () => {
      const testCases = [
        { coverage: 0.1, hasFace: true, expected: 'Move closer to the camera' },
        { coverage: 0.8, hasFace: true, expected: 'Step back from the camera' },
        { coverage: 0.4, hasFace: false, expected: 'Please face the camera' },
        { coverage: 0.4, hasFace: true, expected: 'Perfect positioning!' },
        { coverage: 0.5, hasFace: false, expected: 'Please face the camera' }
      ];

      testCases.forEach(({ coverage, hasFace, expected }) => {
        const segmentation = createMockSegmentation(coverage, 10000);
        const imageData = createMockImageData(100, 100, hasFace);
        
        const score = getQualityScore(
          segmentation as any,
          imageData as ImageData,
          100,
          100
        );

        expect(score.feedback).toBe(expected);
      });
    });
  });

  describe('Performance considerations', () => {
    test('should handle large image data efficiently', () => {
      const start = performance.now();
      
      const segmentation = createMockSegmentation(0.4, 1000000); // 1M pixels
      const imageData = createMockImageData(1000, 1000, true);
      
      getQualityScore(
        segmentation as any,
        imageData as ImageData,
        1000,
        1000
      );

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(100); // Should complete in <100ms
    });

    test('should sample pixels efficiently for face detection', () => {
      const start = performance.now();
      
      const imageData = createMockImageData(2000, 2000, true); // Large image
      
      calculateFaceVisibility(imageData as ImageData, 2000, 2000);

      const duration = performance.now() - start;
      expect(duration).toBeLessThan(50); // Should be fast due to sampling
    });
  });

  describe('Quality Score Properties', () => {
    test('should always return values in valid ranges', () => {
      const segmentation = createMockSegmentation(0.4, 10000);
      const imageData = createMockImageData(100, 100, true);
      
      const score = getQualityScore(
        segmentation as any,
        imageData as ImageData,
        100,
        100
      );

      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
      expect(score.segmentationCoverage).toBeGreaterThanOrEqual(0);
      expect(score.segmentationCoverage).toBeLessThanOrEqual(1);
      expect(score.faceVisibility).toBeGreaterThanOrEqual(0);
      expect(score.faceVisibility).toBeLessThanOrEqual(1);
      expect(typeof score.properlyPositioned).toBe('boolean');
      expect(typeof score.feedback).toBe('string');
      expect(score.feedback.length).toBeGreaterThan(0);
    });
  });
});

// Helper function to create mock segmentation data
function createMockSegmentation(personPixelRatio: number, totalPixels: number): MockSemanticSegmentation {
  const data = new Uint8Array(totalPixels);
  const personPixels = Math.floor(totalPixels * personPixelRatio);
  
  for (let i = 0; i < personPixels; i++) {
    data[i] = 255;
  }
  
  return {
    data,
    width: Math.sqrt(totalPixels),
    height: Math.sqrt(totalPixels)
  };
}

// Helper function to create mock image data
function createMockImageData(width: number, height: number, hasSkinTone: boolean): MockImageData {
  const data = new Uint8ClampedArray(width * height * 4);
  
  if (hasSkinTone) {
    const faceRegionHeight = Math.floor(height * 0.3);
    for (let y = 0; y < faceRegionHeight; y++) {
      for (let x = 0; x < width; x++) {
        const pixelIndex = (y * width + x) * 4;
        data[pixelIndex] = 200;     // R
        data[pixelIndex + 1] = 150; // G  
        data[pixelIndex + 2] = 120; // B
        data[pixelIndex + 3] = 255; // A
      }
    }
  }

  return { data, width, height };
}