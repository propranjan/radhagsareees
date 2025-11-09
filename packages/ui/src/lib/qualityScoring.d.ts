/**
 * TypeScript declarations for Quality Scoring functions
 * Provides type safety for exported helper functions
 */

export interface QualityScore {
  /** Overall quality score combining segmentation and face visibility (0-1) */
  overall: number;
  /** Person segmentation coverage ratio (0-1) */
  segmentationCoverage: number;
  /** Face visibility confidence based on skin tone detection (0-1) */
  faceVisibility: number;
  /** Whether person is optimally positioned for try-on */
  properlyPositioned: boolean;
  /** Human-readable feedback message for user guidance */
  feedback: string;
}

/**
 * Simple skin tone detection using RGB color ranges
 * Supports multiple ethnic skin tones for inclusive detection
 * 
 * @param r Red channel value (0-255)
 * @param g Green channel value (0-255)  
 * @param b Blue channel value (0-255)
 * @returns True if RGB values appear to represent skin tone
 * 
 * @example
 * ```typescript
 * // Light skin tone
 * isSkinTone(220, 170, 120) // returns true
 * 
 * // Medium skin tone
 * isSkinTone(160, 120, 90) // returns true
 * 
 * // Dark skin tone
 * isSkinTone(120, 80, 60) // returns true
 * 
 * // Non-skin color
 * isSkinTone(255, 0, 0) // returns false (red)
 * ```
 */
export declare function isSkinTone(r: number, g: number, b: number): boolean;

/**
 * Calculate face visibility using skin tone analysis in upper image region
 * Optimized with pixel sampling for real-time performance
 * 
 * @param imageData Canvas ImageData containing RGBA pixel values
 * @param width Image width in pixels
 * @param height Image height in pixels  
 * @returns Face visibility confidence score (0-1)
 * 
 * @example
 * ```typescript
 * const canvas = document.createElement('canvas');
 * const ctx = canvas.getContext('2d');
 * const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
 * 
 * const faceScore = calculateFaceVisibility(imageData, canvas.width, canvas.height);
 * if (faceScore > 0.5) {
 *   console.log('Face detected');
 * }
 * ```
 */
export declare function calculateFaceVisibility(
  imageData: ImageData, 
  width: number, 
  height: number
): number;

/**
 * Main quality scoring function combining segmentation coverage and face visibility
 * Provides comprehensive pose assessment with actionable feedback
 * 
 * @param segmentation BodyPix segmentation result with pixel data
 * @param imageData Canvas ImageData for face detection analysis
 * @param width Canvas width in pixels
 * @param height Canvas height in pixels
 * @returns Comprehensive quality score with metrics and feedback
 * 
 * @example
 * ```typescript
 * // After BodyPix segmentation
 * const segmentation = await bodyPixModel.segmentPerson(video);
 * const ctx = canvas.getContext('2d');
 * const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
 * 
 * const quality = getQualityScore(segmentation, imageData, canvas.width, canvas.height);
 * 
 * if (quality.overall > 0.7) {
 *   console.log('Excellent positioning:', quality.feedback);
 * } else {
 *   console.log('Adjust position:', quality.feedback);
 * }
 * 
 * // Access individual metrics
 * console.log('Person coverage:', quality.segmentationCoverage);
 * console.log('Face visibility:', quality.faceVisibility);
 * console.log('Properly positioned:', quality.properlyPositioned);
 * ```
 */
export declare function getQualityScore(
  segmentation: {
    data: Uint8Array;
    width: number;
    height: number;
  },
  imageData: ImageData,
  width: number,
  height: number
): QualityScore;