/**
 * TryOnCanvas Helper Functions
 * Utility functions for pose quality assessment and image analysis
 */

export interface QualityScore {
  overall: number;
  segmentationCoverage: number;
  faceVisibility: number;
  properlyPositioned: boolean;
  feedback: string;
}

// Helper function to check if RGB values represent skin tone
export function isSkinTone(r: number, g: number, b: number): boolean {
  // Multi-ethnic skin tone detection ranges
  // Light skin tones
  if (r >= 180 && r <= 255 && g >= 120 && g <= 200 && b >= 90 && b <= 150) {
    return true;
  }
  
  // Medium skin tones
  if (r >= 120 && r <= 180 && g >= 80 && g <= 130 && b >= 60 && b <= 100) {
    return true;
  }
  
  // Darker skin tones
  if (r >= 80 && r <= 140 && g >= 60 && g <= 100 && b >= 40 && b <= 80) {
    return true;
  }
  
  return false;
}

// Calculate face visibility based on skin tone detection in upper region
export function calculateFaceVisibility(imageData: ImageData, width: number, height: number): number {
  if (!imageData || !imageData.data || imageData.data.length === 0) {
    return 0;
  }

  let skinPixels = 0;
  let totalPixels = 0;
  
  // Sample upper 30% of the image for face region
  const faceRegionHeight = Math.floor(height * 0.3);
  const step = 4; // Sample every 4th pixel for performance
  
  for (let y = 0; y < faceRegionHeight; y += step) {
    for (let x = 0; x < width; x += step) {
      const pixelIndex = (y * width + x) * 4;
      
      if (pixelIndex + 3 < imageData.data.length) {
        const alpha = imageData.data[pixelIndex + 3];
        
        if (alpha > 128) { // Only check non-transparent pixels
          const r = imageData.data[pixelIndex];
          const g = imageData.data[pixelIndex + 1];
          const b = imageData.data[pixelIndex + 2];
          
          if (isSkinTone(r, g, b)) {
            skinPixels++;
          }
          totalPixels++;
        }
      }
    }
  }
  
  return totalPixels > 0 ? skinPixels / totalPixels : 0;
}

// Main quality scoring function combining segmentation and face visibility
export function getQualityScore(
  segmentation: any,
  imageData: ImageData,
  width: number,
  height: number
): QualityScore {
  // Calculate segmentation coverage
  let personPixels = 0;
  let totalPixels = segmentation.data.length;
  
  for (let i = 0; i < segmentation.data.length; i++) {
    if (segmentation.data[i] > 128) {
      personPixels++;
    }
  }
  
  const segmentationCoverage = totalPixels > 0 ? personPixels / totalPixels : 0;
  
  // Calculate face visibility
  const faceVisibility = calculateFaceVisibility(imageData, width, height);
  
  // Determine positioning quality
  const isProperDistance = segmentationCoverage >= 0.2 && segmentationCoverage <= 0.7;
  
  // Generate feedback
  let feedback: string;
  if (faceVisibility < 0.05) {
    feedback = 'Please face the camera';
  } else if (segmentationCoverage < 0.2) {
    feedback = 'Move closer to the camera';
  } else if (segmentationCoverage > 0.7) {
    feedback = 'Step back from the camera';
  } else {
    feedback = 'Perfect positioning!';
  }
  
  // Calculate weighted overall score
  const overall = (segmentationCoverage * 0.6) + (faceVisibility * 0.4);
  
  return {
    overall,
    segmentationCoverage,
    faceVisibility,
    properlyPositioned: isProperDistance && faceVisibility > 0.05,
    feedback
  };
}