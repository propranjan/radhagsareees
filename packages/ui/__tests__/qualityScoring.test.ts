/**
 * @jest-environment jsdom
 */

import {
  isSkinTone,
  calculateFaceVisibility,
  getQualityScore,
  QualityScore
} from '../src/lib/qualityScoring';

describe('TryOnCanvas Helper Functions - Math & Geometry Tests', () => {
  
  describe('isSkinTone', () => {
    it('should detect light skin tones correctly', () => {
      // Light skin tone samples
      expect(isSkinTone(220, 180, 120)).toBe(true); // Light beige
      expect(isSkinTone(255, 200, 150)).toBe(true); // Very light
      expect(isSkinTone(200, 160, 100)).toBe(true); // Light tan
      expect(isSkinTone(180, 120, 90)).toBe(true); // Border case minimum
      expect(isSkinTone(255, 200, 150)).toBe(true); // Border case maximum
    });

    it('should detect medium skin tones correctly', () => {
      // Medium skin tone samples  
      expect(isSkinTone(150, 100, 80)).toBe(true); // Medium brown
      expect(isSkinTone(140, 110, 90)).toBe(true); // Medium olive
      expect(isSkinTone(120, 80, 60)).toBe(true); // Border case minimum
      expect(isSkinTone(180, 130, 100)).toBe(true); // Border case maximum
    });

    it('should detect darker skin tones correctly', () => {
      // Darker skin tone samples
      expect(isSkinTone(120, 85, 65)).toBe(true); // Dark brown
      expect(isSkinTone(100, 70, 50)).toBe(true); // Deep brown
      expect(isSkinTone(80, 60, 40)).toBe(true); // Border case minimum  
      expect(isSkinTone(140, 100, 80)).toBe(true); // Border case maximum
    });

    it('should reject non-skin tones', () => {
      // Pure colors
      expect(isSkinTone(255, 0, 0)).toBe(false); // Red
      expect(isSkinTone(0, 255, 0)).toBe(false); // Green
      expect(isSkinTone(0, 0, 255)).toBe(false); // Blue
      expect(isSkinTone(255, 255, 255)).toBe(false); // White
      expect(isSkinTone(0, 0, 0)).toBe(false); // Black
      
      // Gray tones
      expect(isSkinTone(128, 128, 128)).toBe(false); // Gray
      
      // Colors that are close but not skin tones
      expect(isSkinTone(50, 50, 50)).toBe(false); // Too dark
      expect(isSkinTone(70, 50, 30)).toBe(false); // Below minimum range
      expect(isSkinTone(200, 200, 200)).toBe(false); // Too much blue
      expect(isSkinTone(255, 100, 200)).toBe(false); // Too much red/blue
    });

    it('should handle edge cases and boundary values', () => {
      // Test boundary values - use values that are actually outside ranges
      // Light skin range: r >= 180 && r <= 255 && g >= 120 && g <= 200 && b >= 90 && b <= 150
      expect(isSkinTone(179, 119, 89)).toBe(true); // Medium skin tone (overlaps)
      expect(isSkinTone(180, 120, 90)).toBe(true); // Light skin tone boundary
      
      // Values outside all ranges
      expect(isSkinTone(79, 59, 39)).toBe(false); // Below all ranges  
      expect(isSkinTone(50, 30, 20)).toBe(false); // Well below ranges
      
      // Edge of dark range: r >= 80 && r <= 140 && g >= 60 && g <= 100 && b >= 40 && b <= 80
      expect(isSkinTone(80, 60, 40)).toBe(true); // Dark skin boundary
      expect(isSkinTone(200, 200, 200)).toBe(false); // Gray, outside all ranges
    });
  });

  // Helper function to create mock ImageData
  const createMockImageData = (
    width: number, 
    height: number, 
    pixelGenerator: (x: number, y: number) => [number, number, number, number]
  ): ImageData => {
    const data = new Uint8ClampedArray(width * height * 4);
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const index = (y * width + x) * 4;
        const [r, g, b, a] = pixelGenerator(x, y);
        data[index] = r;     // Red
        data[index + 1] = g; // Green  
        data[index + 2] = b; // Blue
        data[index + 3] = a; // Alpha
      }
    }
    
    return new ImageData(data, width, height);
  };

  describe('calculateFaceVisibility', () => {

    it('should return 0 for invalid or empty ImageData', () => {
      expect(calculateFaceVisibility(null as any, 100, 100)).toBe(0);
      expect(calculateFaceVisibility(undefined as any, 100, 100)).toBe(0);
      
      const emptyImageData = new ImageData(new Uint8ClampedArray(0), 0, 0);
      expect(calculateFaceVisibility(emptyImageData, 0, 0)).toBe(0);
    });

    it('should calculate face visibility with skin tones in upper region', () => {
      const width = 100;
      const height = 100;
      
      // Create image with skin tones in upper 30% (face region)
      const imageDataWithFace = createMockImageData(width, height, (x, y) => {
        const isInFaceRegion = y < height * 0.3;
        if (isInFaceRegion) {
          return [200, 160, 120, 255]; // Light skin tone
        }
        return [100, 100, 100, 255]; // Non-skin background
      });

      const faceVisibility = calculateFaceVisibility(imageDataWithFace, width, height);
      expect(faceVisibility).toBeGreaterThan(0);
      expect(faceVisibility).toBeLessThanOrEqual(1);
    });

    it('should return low visibility when no skin tones present', () => {
      const width = 100; 
      const height = 100;
      
      // Create image with no skin tones
      const imageDataNoSkin = createMockImageData(width, height, () => {
        return [100, 100, 100, 255]; // Gray background
      });

      const faceVisibility = calculateFaceVisibility(imageDataNoSkin, width, height);
      expect(faceVisibility).toBe(0);
    });

    it('should ignore transparent pixels', () => {
      const width = 50;
      const height = 50;
      
      // Create image with some transparent pixels mixed with skin tones
      // Use a pattern that ensures some opaque pixels remain after step=4 sampling
      const imageDataWithTransparency = createMockImageData(width, height, (x, y) => {
        const isTransparent = x % 8 === 0 && y % 8 === 0; // Only make some pixels transparent
        if (isTransparent) {
          return [200, 160, 120, 0]; // Skin color but transparent
        }
        return [200, 160, 120, 255]; // Skin color, opaque
      });

      const faceVisibility = calculateFaceVisibility(imageDataWithTransparency, width, height);
      expect(faceVisibility).toBeGreaterThan(0);
      expect(faceVisibility).toBeLessThanOrEqual(1);
    });

    it('should handle different image dimensions correctly', () => {
      // Small image
      const smallImageData = createMockImageData(10, 10, (x, y) => {
        return y < 3 ? [200, 160, 120, 255] : [100, 100, 100, 255];
      });
      
      const smallVisibility = calculateFaceVisibility(smallImageData, 10, 10);
      expect(smallVisibility).toBeGreaterThan(0);

      // Large image  
      const largeImageData = createMockImageData(500, 500, (x, y) => {
        return y < 150 ? [200, 160, 120, 255] : [100, 100, 100, 255];
      });
      
      const largeVisibility = calculateFaceVisibility(largeImageData, 500, 500);
      expect(largeVisibility).toBeGreaterThan(0);
    });

    it('should properly sample pixels with step size', () => {
      const width = 20;
      const height = 20;
      
      // Create checkerboard pattern of skin tones
      const checkerboardImageData = createMockImageData(width, height, (x, y) => {
        const isSkinPixel = (Math.floor(x / 4) + Math.floor(y / 4)) % 2 === 0;
        if (y < height * 0.3 && isSkinPixel) {
          return [200, 160, 120, 255]; // Skin tone
        }
        return [100, 100, 100, 255]; // Background
      });

      const faceVisibility = calculateFaceVisibility(checkerboardImageData, width, height);
      expect(typeof faceVisibility).toBe('number');
      expect(faceVisibility).toBeGreaterThanOrEqual(0);
      expect(faceVisibility).toBeLessThanOrEqual(1);
    });
  });

  describe('getQualityScore', () => {
    
    // Helper to create mock segmentation data
    const createMockSegmentation = (width: number, height: number, personRatio: number) => {
      const totalPixels = width * height;
      const personPixels = Math.floor(totalPixels * personRatio);
      const data = new Uint8Array(totalPixels);
      
      // Fill first portion with person pixels (value > 128)
      for (let i = 0; i < personPixels; i++) {
        data[i] = 200; // Person pixel
      }
      
      // Fill rest with background pixels (value <= 128)
      for (let i = personPixels; i < totalPixels; i++) {
        data[i] = 50; // Background pixel
      }
      
      return { data };
    };

    it('should calculate segmentation coverage correctly', () => {
      const width = 100;
      const height = 100;
      
      // 50% person coverage
      const segmentation50 = createMockSegmentation(width, height, 0.5);
      const imageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
      
      const score = getQualityScore(segmentation50, imageData, width, height);
      expect(score.segmentationCoverage).toBeCloseTo(0.5, 2);
    });

    it('should determine proper positioning based on segmentation coverage', () => {
      const width = 100;
      const height = 100;
      
      // Create imageData with face (skin tones in upper region)
      const imageDataWithFace = createMockImageData(width, height, (x, y) => {
        if (y < height * 0.3) { // Upper 30% for face region
          return [200, 160, 120, 255]; // Skin tone
        }
        return [100, 100, 100, 255]; // Non-skin
      });

      // Too close (> 0.7 coverage)
      const segmentationTooClose = createMockSegmentation(width, height, 0.8);
      const scoreTooClose = getQualityScore(segmentationTooClose, imageDataWithFace, width, height);
      expect(scoreTooClose.properlyPositioned).toBe(false);
      expect(scoreTooClose.feedback).toBe('Step back from the camera');

      // Too far (< 0.2 coverage)  
      const segmentationTooFar = createMockSegmentation(width, height, 0.1);
      const scoreTooFar = getQualityScore(segmentationTooFar, imageDataWithFace, width, height);
      expect(scoreTooFar.properlyPositioned).toBe(false);
      expect(scoreTooFar.feedback).toBe('Move closer to the camera');

      // Just right (0.2-0.7 coverage)
      const segmentationGood = createMockSegmentation(width, height, 0.4);
      const scoreGood = getQualityScore(segmentationGood, imageDataWithFace, width, height);
      expect(scoreGood.properlyPositioned).toBe(true);
      expect(scoreGood.feedback).toBe('Perfect positioning!');
    });

    it('should generate appropriate feedback messages', () => {
      const width = 100;
      const height = 100;
      
      // Create image data with skin tones for face visibility
      const imageDataWithFace = new Uint8ClampedArray(width * height * 4);
      for (let i = 0; i < width * height * 0.3 * 4; i += 4) {
        imageDataWithFace[i] = 200;     // R - skin tone
        imageDataWithFace[i + 1] = 160; // G
        imageDataWithFace[i + 2] = 120; // B  
        imageDataWithFace[i + 3] = 255; // A
      }
      const goodImageData = new ImageData(imageDataWithFace, width, height);
      
      // Test different feedback scenarios
      const segmentationPerfect = createMockSegmentation(width, height, 0.4);
      const scorePerfect = getQualityScore(segmentationPerfect, goodImageData, width, height);
      expect(scorePerfect.feedback).toBe('Perfect positioning!');

      // No face visibility
      const emptyImageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
      const scoreNoFace = getQualityScore(segmentationPerfect, emptyImageData, width, height);
      expect(scoreNoFace.feedback).toBe('Please face the camera');
    });

    it('should calculate weighted overall score correctly', () => {
      const width = 100;
      const height = 100;
      
      // Create mock data with known values
      const segmentation = createMockSegmentation(width, height, 0.5); // 50% coverage
      const imageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
      
      const score = getQualityScore(segmentation, imageData, width, height);
      
      // Overall = (segmentationCoverage * 0.6) + (faceVisibility * 0.4)
      // With no face visibility: overall = 0.5 * 0.6 + 0 * 0.4 = 0.3
      expect(score.overall).toBeCloseTo(0.3, 2);
    });

    it('should handle edge cases and boundary conditions', () => {
      const width = 1;
      const height = 1;
      
      // Minimal image
      const minimalSegmentation = createMockSegmentation(width, height, 1);
      const minimalImageData = new ImageData(new Uint8ClampedArray(4), width, height);
      
      const score = getQualityScore(minimalSegmentation, minimalImageData, width, height);
      expect(score.segmentationCoverage).toBe(1);
      expect(score.faceVisibility).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
    });

    it('should return valid QualityScore structure', () => {
      const width = 50;
      const height = 50;
      const segmentation = createMockSegmentation(width, height, 0.3);
      const imageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
      
      const score = getQualityScore(segmentation, imageData, width, height);
      
      // Verify structure
      expect(score).toHaveProperty('overall');
      expect(score).toHaveProperty('segmentationCoverage');
      expect(score).toHaveProperty('faceVisibility');
      expect(score).toHaveProperty('properlyPositioned');
      expect(score).toHaveProperty('feedback');
      
      // Verify types and ranges
      expect(typeof score.overall).toBe('number');
      expect(typeof score.segmentationCoverage).toBe('number');
      expect(typeof score.faceVisibility).toBe('number');
      expect(typeof score.properlyPositioned).toBe('boolean');
      expect(typeof score.feedback).toBe('string');
      
      expect(score.overall).toBeGreaterThanOrEqual(0);
      expect(score.overall).toBeLessThanOrEqual(1);
      expect(score.segmentationCoverage).toBeGreaterThanOrEqual(0);
      expect(score.segmentationCoverage).toBeLessThanOrEqual(1);
      expect(score.faceVisibility).toBeGreaterThanOrEqual(0);
      expect(score.faceVisibility).toBeLessThanOrEqual(1);
    });
  });

  describe('Integration Tests', () => {
    // Helper to create mock segmentation data
    const createMockSegmentation = (width: number, height: number, personRatio: number) => {
      const totalPixels = width * height;
      const personPixels = Math.floor(totalPixels * personRatio);
      const data = new Uint8Array(totalPixels);
      
      // Fill first portion with person pixels (value > 128)
      for (let i = 0; i < personPixels; i++) {
        data[i] = 200; // Person pixel
      }
      
      // Fill rest with background pixels (value <= 128)
      for (let i = personPixels; i < totalPixels; i++) {
        data[i] = 50; // Background pixel
      }
      
      return { data };
    };

    it('should provide consistent results across multiple calls', () => {
      const width = 200;
      const height = 200;
      const segmentation = createMockSegmentation(width, height, 0.4);
      const imageData = new ImageData(new Uint8ClampedArray(width * height * 4), width, height);
      
      const score1 = getQualityScore(segmentation, imageData, width, height);
      const score2 = getQualityScore(segmentation, imageData, width, height);
      
      expect(score1.overall).toBe(score2.overall);
      expect(score1.segmentationCoverage).toBe(score2.segmentationCoverage);
      expect(score1.faceVisibility).toBe(score2.faceVisibility);
      expect(score1.properlyPositioned).toBe(score2.properlyPositioned);
      expect(score1.feedback).toBe(score2.feedback);
    });

    it('should handle realistic scenario with mixed skin tones', () => {
      const width = 320;
      const height = 240;
      
      // Create realistic segmentation (person takes ~40% of frame)
      const segmentation = createMockSegmentation(width, height, 0.4);
      
      // Create realistic image with face region containing skin tones
      const imageDataArray = new Uint8ClampedArray(width * height * 4);
      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          const index = (y * width + x) * 4;
          
          // Face region (upper 30%) with some skin tones
          if (y < height * 0.3 && x > width * 0.3 && x < width * 0.7) {
            imageDataArray[index] = 180;     // Light skin tone
            imageDataArray[index + 1] = 140;
            imageDataArray[index + 2] = 110;
            imageDataArray[index + 3] = 255;
          } else {
            imageDataArray[index] = 80;      // Background
            imageDataArray[index + 1] = 80;
            imageDataArray[index + 2] = 80;
            imageDataArray[index + 3] = 255;
          }
        }
      }
      
      const imageData = new ImageData(imageDataArray, width, height);
      const score = getQualityScore(segmentation, imageData, width, height);
      
      expect(score.segmentationCoverage).toBeCloseTo(0.4, 1);
      expect(score.faceVisibility).toBeGreaterThan(0);
      expect(score.overall).toBeGreaterThan(0);
      expect(typeof score.feedback).toBe('string');
      expect(score.feedback.length).toBeGreaterThan(0);
    });
  });
});