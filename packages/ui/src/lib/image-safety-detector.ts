/**
 * Lightweight client-side image safety detector
 * Performs basic analysis without external API calls
 */

export interface ImageSafetyResult {
  isBlurred: boolean;
  blurScore: number; // 0-1, higher means more blurred
  colorAnalysis: {
    dominantColors: string[];
    skinTonePercentage: number;
    redPixelRatio: number;
  };
  dimensionAnalysis: {
    aspectRatio: number;
    resolution: number;
    isLowRes: boolean;
  };
  riskScore: number; // 0-1, higher means riskier
  flags: string[];
}

export class ImageSafetyDetector {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement('canvas');
    const context = this.canvas.getContext('2d');
    if (!context) {
      throw new Error('Canvas 2D context not supported');
    }
    this.ctx = context;
  }

  /**
   * Analyze an image file for safety indicators
   */
  async analyzeImage(imageFile: File): Promise<ImageSafetyResult> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      
      img.onload = () => {
        try {
          // Set canvas size to image size (with reasonable limits)
          const maxSize = 800;
          const scale = Math.min(maxSize / img.width, maxSize / img.height, 1);
          
          this.canvas.width = img.width * scale;
          this.canvas.height = img.height * scale;
          
          // Draw image to canvas
          this.ctx.drawImage(img, 0, 0, this.canvas.width, this.canvas.height);
          
          // Get image data for analysis
          const imageData = this.ctx.getImageData(0, 0, this.canvas.width, this.canvas.height);
          
          // Perform analysis
          const result = this.performAnalysis(imageData, img.width, img.height);
          resolve(result);
        } catch (error) {
          reject(error);
        } finally {
          // Clean up
          URL.revokeObjectURL(img.src);
        }
      };

      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };

      // Create object URL for the image
      img.src = URL.createObjectURL(imageFile);
    });
  }

  /**
   * Perform comprehensive image analysis
   */
  private performAnalysis(imageData: ImageData, originalWidth: number, originalHeight: number): ImageSafetyResult {
    const pixels = imageData.data;
    const width = imageData.width;
    const height = imageData.height;

    // 1. Blur detection using Laplacian variance
    const blurScore = this.detectBlur(pixels, width, height);
    const isBlurred = blurScore < 100; // Threshold for blur detection

    // 2. Color analysis
    const colorAnalysis = this.analyzeColors(pixels);

    // 3. Dimension analysis
    const dimensionAnalysis = this.analyzeDimensions(originalWidth, originalHeight);

    // 4. Edge detection for content analysis
    const edgeScore = this.detectEdges(pixels, width, height);

    // 5. Calculate risk score and flags
    const { riskScore, flags } = this.calculateRiskScore({
      blurScore,
      colorAnalysis,
      dimensionAnalysis,
      edgeScore,
    });

    return {
      isBlurred,
      blurScore,
      colorAnalysis,
      dimensionAnalysis,
      riskScore,
      flags,
    };
  }

  /**
   * Detect image blur using Laplacian variance
   */
  private detectBlur(pixels: Uint8ClampedArray, width: number, height: number): number {
    const gray = new Array(width * height);
    
    // Convert to grayscale
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Apply Laplacian kernel
    const laplacian = [
      [0, -1, 0],
      [-1, 4, -1],
      [0, -1, 0]
    ];

    let variance = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let sum = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (y + ky) * width + (x + kx);
            sum += gray[pixelIndex] * laplacian[ky + 1][kx + 1];
          }
        }
        
        variance += sum * sum;
        count++;
      }
    }

    return count > 0 ? variance / count : 0;
  }

  /**
   * Analyze color composition for safety indicators
   */
  private analyzeColors(pixels: Uint8ClampedArray): ImageSafetyResult['colorAnalysis'] {
    const colorBuckets: { [key: string]: number } = {};
    let skinTonePixels = 0;
    let redPixels = 0;
    const totalPixels = pixels.length / 4;

    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      // Skin tone detection (simplified heuristic)
      if (this.isSkinTone(r, g, b)) {
        skinTonePixels++;
      }

      // Red pixel detection (potential flag for certain content)
      if (r > 150 && r > g * 1.5 && r > b * 1.5) {
        redPixels++;
      }

      // Color bucketing for dominant colors
      const colorKey = `${Math.floor(r / 32)}_${Math.floor(g / 32)}_${Math.floor(b / 32)}`;
      colorBuckets[colorKey] = (colorBuckets[colorKey] || 0) + 1;
    }

    // Get dominant colors
    const dominantColors = Object.entries(colorBuckets)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([key]) => {
        const [r, g, b] = key.split('_').map(n => parseInt(n) * 32);
        return `rgb(${r},${g},${b})`;
      });

    return {
      dominantColors,
      skinTonePercentage: (skinTonePixels / totalPixels) * 100,
      redPixelRatio: (redPixels / totalPixels) * 100,
    };
  }

  /**
   * Simple skin tone detection heuristic
   */
  private isSkinTone(r: number, g: number, b: number): boolean {
    // Basic skin tone detection using RGB ratios
    const rg = r > g;
    const rb = r > b;
    const gb = g > b;
    
    // Skin tone typically has R > G > B with specific ranges
    return rg && gb && rb &&
           r >= 95 && r <= 255 &&
           g >= 40 && g <= 220 &&
           b >= 20 && b <= 170 &&
           Math.abs(r - g) > 15 &&
           r - b > 15;
  }

  /**
   * Analyze image dimensions for suspicious patterns
   */
  private analyzeDimensions(width: number, height: number): ImageSafetyResult['dimensionAnalysis'] {
    const aspectRatio = width / height;
    const resolution = width * height;
    const isLowRes = resolution < 50000; // Less than ~224x224

    return {
      aspectRatio,
      resolution,
      isLowRes,
    };
  }

  /**
   * Detect edges for content analysis
   */
  private detectEdges(pixels: Uint8ClampedArray, width: number, height: number): number {
    const gray = new Array(width * height);
    
    // Convert to grayscale
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];
      gray[i / 4] = 0.299 * r + 0.587 * g + 0.114 * b;
    }

    // Sobel edge detection
    const sobelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const sobelY = [[-1, -2, -1], [0, 0, 0], [1, 2, 1]];

    let edgeScore = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        let gx = 0, gy = 0;
        
        for (let ky = -1; ky <= 1; ky++) {
          for (let kx = -1; kx <= 1; kx++) {
            const pixelIndex = (y + ky) * width + (x + kx);
            const pixel = gray[pixelIndex];
            gx += pixel * sobelX[ky + 1][kx + 1];
            gy += pixel * sobelY[ky + 1][kx + 1];
          }
        }
        
        edgeScore += Math.sqrt(gx * gx + gy * gy);
        count++;
      }
    }

    return count > 0 ? edgeScore / count : 0;
  }

  /**
   * Calculate overall risk score based on all factors
   */
  private calculateRiskScore({
    blurScore,
    colorAnalysis,
    dimensionAnalysis,
    edgeScore,
  }: {
    blurScore: number;
    colorAnalysis: ImageSafetyResult['colorAnalysis'];
    dimensionAnalysis: ImageSafetyResult['dimensionAnalysis'];
    edgeScore: number;
  }): { riskScore: number; flags: string[] } {
    
    let riskScore = 0;
    const flags: string[] = [];

    // Factor 1: Blur analysis (blurred images might hide inappropriate content)
    if (blurScore < 50) {
      riskScore += 0.3;
      flags.push('Image appears heavily blurred');
    } else if (blurScore < 100) {
      riskScore += 0.1;
      flags.push('Image appears slightly blurred');
    }

    // Factor 2: High skin tone percentage
    if (colorAnalysis.skinTonePercentage > 40) {
      riskScore += 0.4;
      flags.push('High skin tone content detected');
    } else if (colorAnalysis.skinTonePercentage > 20) {
      riskScore += 0.2;
      flags.push('Moderate skin tone content detected');
    }

    // Factor 3: Unusual color composition
    if (colorAnalysis.redPixelRatio > 30) {
      riskScore += 0.2;
      flags.push('High red pixel ratio detected');
    }

    // Factor 4: Suspicious aspect ratios
    const { aspectRatio } = dimensionAnalysis;
    if (aspectRatio > 2 || aspectRatio < 0.5) {
      riskScore += 0.1;
      flags.push('Unusual aspect ratio');
    }

    // Factor 5: Low resolution (might indicate screenshot or low-quality content)
    if (dimensionAnalysis.isLowRes) {
      riskScore += 0.1;
      flags.push('Low resolution image');
    }

    // Factor 6: Low edge content (might indicate simple/inappropriate images)
    if (edgeScore < 10) {
      riskScore += 0.15;
      flags.push('Low detail content detected');
    }

    // Normalize risk score to 0-1 range
    riskScore = Math.min(riskScore, 1);

    return { riskScore, flags };
  }

  /**
   * Quick safety check without detailed analysis
   */
  async quickSafetyCheck(imageFile: File): Promise<{ safe: boolean; reason?: string }> {
    try {
      const result = await this.analyzeImage(imageFile);
      
      if (result.riskScore > 0.7) {
        return {
          safe: false,
          reason: `High risk content detected: ${result.flags.join(', ')}`
        };
      }

      if (result.colorAnalysis.skinTonePercentage > 50) {
        return {
          safe: false,
          reason: 'High skin tone content detected'
        };
      }

      return { safe: true };
    } catch (error) {
      console.error('Image analysis failed:', error);
      return {
        safe: false,
        reason: 'Unable to analyze image safety'
      };
    }
  }
}

/**
 * Utility function to create a singleton detector instance
 */
let detectorInstance: ImageSafetyDetector | null = null;

export function getImageSafetyDetector(): ImageSafetyDetector {
  if (!detectorInstance) {
    detectorInstance = new ImageSafetyDetector();
  }
  return detectorInstance;
}

/**
 * React hook for image safety detection
 */
export function useImageSafety() {
  const detector = getImageSafetyDetector();

  const analyzeImage = async (file: File): Promise<ImageSafetyResult> => {
    return detector.analyzeImage(file);
  };

  const quickCheck = async (file: File): Promise<{ safe: boolean; reason?: string }> => {
    return detector.quickSafetyCheck(file);
  };

  return {
    analyzeImage,
    quickCheck,
  };
}