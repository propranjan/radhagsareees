/**
 * AI Saree Try-On Service
 * Handles image preprocessing, pose detection, AI model inference, and postprocessing
 */

import sharp from 'sharp';

/**
 * Image preprocessing configuration
 */
export interface PreprocessConfig {
  removeBackground?: boolean;
  normalizeBrightness?: boolean;
  enhanceFace?: boolean;
  resizeWidth?: number;
  resizeHeight?: number;
}

/**
 * Pose detection types
 */
export interface PoseKeypoint {
  x: number;
  y: number;
  z?: number;
  score?: number;
  name: string;
}

export interface PoseResult {
  keypoints: PoseKeypoint[];
  score: number;
  timestamp?: number;
}

/**
 * Saree asset configuration
 */
export interface SareeAssets {
  imageUrl: string;
  maskUrl: string;
  overlayUrl: string;
  texture?: string;
  sku: string;
  variant?: string;
}

/**
 * Try-on result output
 */
export interface TryOnResult {
  outputImageUrl: string;
  originalImageUrl: string;
  poseData: PoseResult;
  processingTime: number;
  metadata: Record<string, any>;
}

/**
 * Preprocessing Service
 * Handles image cleaning and normalization
 */
export class ImagePreprocessor {
  /**
   * Remove image background using rembg API or local implementation
   * For production, integrate with Cloudinary's AI backgrounds or rembg service
   */
  static async removeBackground(imagePath: string): Promise<Buffer> {
    try {
      // In production, use Cloudinary's background removal:
      // const url = cloudinary.url(imagePath, {
      //   quality: 'auto',
      //   fetch_format: 'auto',
      //   transformation: [
      //     { background: 'remove' }
      //   ]
      // });

      // For now, return the image as-is
      // You would integrate with rembg API: https://api.remove.bg/
      const image = sharp(imagePath);
      return await image.png().toBuffer();
    } catch (error) {
      console.error('Background removal error:', error);
      throw new Error(`Failed to remove background: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Normalize image brightness and contrast
   */
  static async normalizeBrightness(
    imageBuffer: Buffer,
    targetBrightness: number = 0
  ): Promise<Buffer> {
    try {
      // Use sharp to analyze and adjust brightness
      const metadata = await sharp(imageBuffer).metadata();
      
      return await sharp(imageBuffer)
        .normalize()
        .modulate({
          brightness: 1.0 + (targetBrightness / 100),
          saturation: 1.1, // Slightly boost saturation
        })
        .toBuffer();
    } catch (error) {
      console.error('Brightness normalization error:', error);
      throw new Error(`Failed to normalize brightness: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Enhance face features using local canvas operations
   * In production, use specialized face enhancement models
   */
  static async enhanceFace(imageBuffer: Buffer): Promise<Buffer> {
    try {
      // Apply sharpening and local contrast enhancement
      return await sharp(imageBuffer)
        .sharpen({
          sigma: 1.5,
        })
        .modulate({
          brightness: 1.05,
          saturation: 1.15,
        })
        .toBuffer();
    } catch (error) {
      console.error('Face enhancement error:', error);
      throw new Error(`Failed to enhance face: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Resize image to standard dimensions
   */
  static async resize(
    imageBuffer: Buffer,
    width: number = 512,
    height: number = 768
  ): Promise<Buffer> {
    try {
      return await sharp(imageBuffer)
        .resize(width, height, {
          fit: 'cover',
          position: 'center',
        })
        .toBuffer();
    } catch (error) {
      console.error('Image resize error:', error);
      throw new Error(`Failed to resize image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Full preprocessing pipeline
   */
  static async preprocess(
    imageBuffer: Buffer,
    config: PreprocessConfig = {}
  ): Promise<Buffer> {
    const {
      removeBackground = true,
      normalizeBrightness = true,
      enhanceFace = true,
      resizeWidth = 512,
      resizeHeight = 768,
    } = config;

    let result = imageBuffer;

    // Step 1: Resize first for faster processing
    result = await this.resize(result, resizeWidth, resizeHeight);

    // Step 2: Remove background (optional)
    if (removeBackground) {
      // result = await this.removeBackground(result);
      // Placeholder: background removal requires external API
    }

    // Step 3: Normalize brightness
    if (normalizeBrightness) {
      result = await this.normalizeBrightness(result);
    }

    // Step 4: Enhance face
    if (enhanceFace) {
      result = await this.enhanceFace(result);
    }

    return result;
  }
}

/**
 * Pose Detection Service
 * Integrates with MediaPipe or Human.js for body pose estimation
 */
export class PoseDetector {
  private static mlkitPromise: Promise<any> | null = null;

  /**
   * Initialize pose detection model (client-side or server-side)
   */
  static async initialize(): Promise<void> {
    // This would be implemented on the client-side with MediaPipe
    // On server-side, you would use @react-three/fiber or similar
    console.log('Pose detector ready (client-side initialization required)');
  }

  /**
   * Detect pose from image (placeholder for server-side)
   * In production, run this on the client-side with MediaPipe
   */
  static async detectPose(imageBuffer: Buffer): Promise<PoseResult> {
    // Server-side pose detection would require ml5.js or similar
    // For now, return a mock pose structure
    // CLIENT-SIDE: Use @mediapipe/pose for browser-based detection

    const mockPose: PoseResult = {
      keypoints: [
        // Upper body keypoints for saree alignment
        { x: 256, y: 100, score: 0.95, name: 'nose' },
        { x: 240, y: 95, score: 0.93, name: 'left_eye' },
        { x: 272, y: 95, score: 0.93, name: 'right_eye' },
        { x: 220, y: 130, score: 0.91, name: 'left_shoulder' },
        { x: 292, y: 130, score: 0.91, name: 'right_shoulder' },
        { x: 210, y: 200, score: 0.88, name: 'left_elbow' },
        { x: 302, y: 200, score: 0.88, name: 'right_elbow' },
        { x: 195, y: 280, score: 0.85, name: 'left_wrist' },
        { x: 317, y: 280, score: 0.85, name: 'right_wrist' },
        { x: 240, y: 250, score: 0.90, name: 'left_hip' },
        { x: 272, y: 250, score: 0.90, name: 'right_hip' },
        { x: 235, y: 350, score: 0.87, name: 'left_knee' },
        { x: 277, y: 350, score: 0.87, name: 'right_knee' },
        { x: 230, y: 450, score: 0.84, name: 'left_ankle' },
        { x: 282, y: 450, score: 0.84, name: 'right_ankle' },
      ],
      score: 0.89,
      timestamp: Date.now(),
    };

    return mockPose;
  }

  /**
   * Extract relevant body measurements for saree fitting
   */
  static extractMeasurements(pose: PoseResult): Record<string, number> {
    const kps = new Map(pose.keypoints.map(kp => [kp.name, kp]));

    const leftShoulder = kps.get('left_shoulder');
    const rightShoulder = kps.get('right_shoulder');
    const leftHip = kps.get('left_hip');
    const rightHip = kps.get('right_hip');

    const shoulderDistance = leftShoulder && rightShoulder
      ? Math.hypot(rightShoulder.x - leftShoulder.x, rightShoulder.y - leftShoulder.y)
      : 0;

    const hipDistance = leftHip && rightHip
      ? Math.hypot(rightHip.x - leftHip.x, rightHip.y - leftHip.y)
      : 0;

    const bodyHeight = pose.keypoints[14]?.y || 0 - (pose.keypoints[0]?.y || 100); // ankle to nose

    return {
      shoulderDistance,
      hipDistance,
      bodyHeight,
      scale: shoulderDistance / 70, // Normalize scale
    };
  }
}

/**
 * Pose-based Saree Alignment Service
 * Transforms saree assets to match user pose
 */
export class PoseAlignmentService {
  /**
   * Apply transformation to align saree with detected pose
   */
  static applyPoseTransform(
    sareeImageBuffer: Buffer,
    pose: PoseResult
  ): {
    transformedBuffer: Buffer;
    transforms: Record<string, number>;
  } {
    // Extract body measurements
    const measurements = PoseDetector.extractMeasurements(pose);

    // Calculate rotation angle from shoulders
    const leftShoulder = pose.keypoints.find(kp => kp.name === 'left_shoulder');
    const rightShoulder = pose.keypoints.find(kp => kp.name === 'right_shoulder');

    let rotationAngle = 0;
    if (leftShoulder && rightShoulder) {
      rotationAngle = Math.atan2(
        rightShoulder.y - leftShoulder.y,
        rightShoulder.x - leftShoulder.x
      );
    }

    // Calculate scale based on shoulder width
    const scale = measurements.scale || 1.0;

    // Calculate translation to center saree on body
    const centerX = pose.keypoints.find(kp => kp.name === 'nose')?.x || 256;
    const centerY = pose.keypoints.find(kp => kp.name === 'left_hip')?.y || 250;

    const transforms = {
      rotationAngle,
      scale,
      translationX: centerX,
      translationY: centerY,
      skewFactor: measurements.hipDistance / measurements.shoulderDistance,
    };

    // Return transformed buffer (in production, use image processing library)
    return {
      transformedBuffer: sareeImageBuffer,
      transforms,
    };
  }

  /**
   * Warp saree pleats based on pose keypoints
   * This creates the illusion of realistic draping
   */
  static warpSareePleats(
    sareeBuffer: Buffer,
    pose: PoseResult
  ): Buffer {
    // Extract key points for warping
    const leftHip = pose.keypoints.find(kp => kp.name === 'left_hip');
    const rightHip = pose.keypoints.find(kp => kp.name === 'right_hip');
    const leftKnee = pose.keypoints.find(kp => kp.name === 'left_knee');
    const rightKnee = pose.keypoints.find(kp => kp.name === 'right_knee');

    // Create perspective warp for realistic draping
    // In production, use OpenCV or similar for perspective transform
    const warpPoints = [
      { source: [0, 0], target: leftHip ? [leftHip.x - 50, leftHip.y] : [0, 0] },
      { source: [512, 0], target: rightHip ? [rightHip.x + 50, rightHip.y] : [512, 0] },
      { source: [0, 768], target: leftKnee ? [leftKnee.x, leftKnee.y] : [0, 768] },
      { source: [512, 768], target: rightKnee ? [rightKnee.x, rightKnee.y] : [512, 768] },
    ];

    // Return warped buffer
    return sareeBuffer;
  }
}

/**
 * AI Try-On Service
 * Integrates with TryOnDiffusion, VITON-HD, or ClothFlow
 */
export class AITryOnService {
  /**
   * Call AI try-on inference API
   * Supports: Hugging Face Spaces, Replicate, or custom model endpoint
   */
  static async inferTryOn(
    userImageBuffer: Buffer,
    sareeImageBuffer: Buffer,
    sareeMaskBuffer: Buffer,
    apiConfig: {
      endpoint: string;
      model: 'viton-hd' | 'tryon-diffusion' | 'clothflow' | 'custom';
      apiKey?: string;
    }
  ): Promise<Buffer> {
    try {
      // Example: Replicate API integration
      if (apiConfig.model === 'viton-hd') {
        // For Replicate API, we need to send image URLs, not buffers
        // Since we have buffers here, we'll use data URLs for testing
        // In production, upload to Cloudinary first and use those URLs
        
        const userImageUrl = `data:image/png;base64,${userImageBuffer.toString('base64')}`;
        const sareeImageUrl = `data:image/png;base64,${sareeImageBuffer.toString('base64')}`;
        const maskImageUrl = `data:image/png;base64,${sareeMaskBuffer.toString('base64')}`;

        const payload = {
          input: {
            human_img: userImageUrl,
            clothing_img: sareeImageUrl,
            mask_img: maskImageUrl,
          },
        };

        console.log('Calling Replicate API with VITON-HD model...');
        
        const response = await fetch(apiConfig.endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(apiConfig.apiKey && { Authorization: `Token ${apiConfig.apiKey}` }),
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ message: response.statusText }));
          console.error('Replicate API error response:', errorData);
          throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData.detail || errorData.message || ''}`);
        }

        const resultData = await response.json();
        console.log('Replicate API response:', { id: resultData.id, status: resultData.status });

        // Poll for completion if async
        if (resultData.id && !resultData.output) {
          return await this.pollForResult(resultData.id, apiConfig);
        }

        // Convert result to buffer
        if (typeof resultData.output === 'string' && resultData.output.startsWith('http')) {
          const imageResponse = await fetch(resultData.output);
          return Buffer.from(await imageResponse.arrayBuffer());
        }

        if (Array.isArray(resultData.output) && resultData.output[0]?.startsWith('http')) {
          const imageResponse = await fetch(resultData.output[0]);
          return Buffer.from(await imageResponse.arrayBuffer());
        }

        throw new Error('Invalid response format from try-on API');
      }

      throw new Error(`Model ${apiConfig.model} not yet implemented`);
    } catch (error) {
      console.error('AI try-on inference error:', error);
      throw new Error(`Failed to generate try-on: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Poll Replicate API for async results
   */
  private static async pollForResult(
    predictionId: string,
    apiConfig: any,
    maxAttempts: number = 60
  ): Promise<Buffer> {
    for (let i = 0; i < maxAttempts; i++) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second

      const response = await fetch(`${apiConfig.endpoint}/${predictionId}`, {
        headers: apiConfig.apiKey ? { Authorization: `Token ${apiConfig.apiKey}` } : {},
      });

      const result = await response.json();

      if (result.status === 'succeeded' && result.output) {
        const imageResponse = await fetch(result.output[0]);
        return Buffer.from(await imageResponse.arrayBuffer());
      }

      if (result.status === 'failed') {
        throw new Error(`Prediction failed: ${result.error}`);
      }
    }

    throw new Error('Prediction timeout');
  }
}

/**
 * Postprocessing Service
 * Refines AI output with blending, color correction, etc.
 */
export class PostprocessingService {
  /**
   * Blend edges between user image and saree
   */
  static async blendEdges(
    tryOnBuffer: Buffer,
    originalBuffer: Buffer,
    blendStrength: number = 0.85
  ): Promise<Buffer> {
    try {
      // Use sharp to blend images
      const originalMetadata = await sharp(originalBuffer).metadata();
      const width = originalMetadata.width || 512;
      const height = originalMetadata.height || 768;

      return await sharp(tryOnBuffer)
        .composite([
          {
            input: originalBuffer,
            blend: 'overlay' as any,
          },
        ])
        .toBuffer();
    } catch (error) {
      console.error('Edge blending error:', error);
      return tryOnBuffer; // Return original if blending fails
    }
  }

  /**
   * Adjust color and brightness to match original image
   */
  static async adjustColorBrightness(
    tryOnBuffer: Buffer,
    referenceBuffer: Buffer
  ): Promise<Buffer> {
    try {
      // Analyze reference image statistics
      const stats = await sharp(referenceBuffer)
        .stats();

      // Apply adjustments to try-on result
      return await sharp(tryOnBuffer)
        .modulate({
          brightness: (stats.channels[0].mean / 128) || 1.0,
          saturation: 1.0,
        })
        .toBuffer();
    } catch (error) {
      console.error('Color adjustment error:', error);
      return tryOnBuffer;
    }
  }

  /**
   * Preserve and enhance fabric texture
   */
  static async enhanceTexture(tryOnBuffer: Buffer): Promise<Buffer> {
    try {
      return await sharp(tryOnBuffer)
        .sharpen({
          sigma: 0.5,
        })
        .toBuffer();
    } catch (error) {
      console.error('Texture enhancement error:', error);
      return tryOnBuffer;
    }
  }

  /**
   * Full postprocessing pipeline
   */
  static async postprocess(
    tryOnBuffer: Buffer,
    originalBuffer: Buffer,
    options: {
      blendEdges?: boolean;
      adjustColor?: boolean;
      enhanceTexture?: boolean;
      blendStrength?: number;
    } = {}
  ): Promise<Buffer> {
    const {
      blendEdges: blend = true,
      adjustColor = true,
      enhanceTexture: enhance = true,
      blendStrength = 0.8,
    } = options;

    let result = tryOnBuffer;

    // Step 1: Adjust color to match original
    if (adjustColor) {
      result = await this.adjustColorBrightness(result, originalBuffer);
    }

    // Step 2: Enhance texture
    if (enhance) {
      result = await this.enhanceTexture(result);
    }

    // Step 3: Blend edges
    if (blend) {
      result = await this.blendEdges(result, originalBuffer, blendStrength);
    }

    return result;
  }
}

/**
 * Main Try-On Orchestrator Service
 */
export class TryOnService {
  /**
   * Fetch image from Cloudinary URL and return as buffer
   */
  private static async fetchCloudinaryImage(imageUrl: string): Promise<Buffer> {
    try {
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.statusText}`);
      }
      return Buffer.from(await response.arrayBuffer());
    } catch (error) {
      console.error(`Error fetching image from ${imageUrl}:`, error);
      throw new Error(`Failed to download image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Execute complete try-on pipeline
   */
  static async generateTryOn(
    userImageBuffer: Buffer,
    sareeAssets: SareeAssets,
    options: {
      preprocessConfig?: PreprocessConfig;
      modelEndpoint: string;
      modelType: 'viton-hd' | 'tryon-diffusion' | 'clothflow';
      modelApiKey?: string;
    }
  ): Promise<TryOnResult> {
    const startTime = Date.now();

    try {
      console.log('Starting try-on pipeline...');

      // Step 1: Preprocess user image
      console.log('Preprocessing user image...');
      const preprocessedUser = await ImagePreprocessor.preprocess(
        userImageBuffer,
        options.preprocessConfig
      );

      // Step 2: Detect pose
      console.log('Detecting pose...');
      const pose = await PoseDetector.detectPose(preprocessedUser);

      // Step 3: Load saree assets and align with pose
      console.log('Aligning saree with detected pose...');
      // Fetch saree assets from Cloudinary URLs
      const sareeImageBuffer = await this.fetchCloudinaryImage(sareeAssets.imageUrl);
      const sareeMaskBuffer = await this.fetchCloudinaryImage(sareeAssets.maskUrl);

      const { transformedBuffer: alignedSaree } = PoseAlignmentService.applyPoseTransform(
        sareeImageBuffer,
        pose
      );

      // Step 4: Call AI try-on model
      console.log('Generating try-on output...');
      const tryOnOutput = await AITryOnService.inferTryOn(
        preprocessedUser,
        alignedSaree,
        sareeMaskBuffer,
        {
          endpoint: options.modelEndpoint,
          model: options.modelType,
          apiKey: options.modelApiKey,
        }
      );

      // Step 5: Postprocess output
      console.log('Postprocessing output...');
      const finalOutput = await PostprocessingService.postprocess(
        tryOnOutput,
        userImageBuffer,
        {
          blendEdges: true,
          adjustColor: true,
          enhanceTexture: true,
          blendStrength: 0.8,
        }
      );

      const processingTime = Date.now() - startTime;

      return {
        outputImageUrl: '', // Will be set after uploading to Cloudinary
        originalImageUrl: '', // Will be set after uploading to Cloudinary
        poseData: pose,
        processingTime,
        metadata: {
          sareeAssets,
          preprocessedUserSize: preprocessedUser.length,
          outputSize: finalOutput.length,
          outputBuffer: finalOutput, // Store the actual output buffer for upload
        },
      };
    } catch (error) {
      console.error('Try-on pipeline error:', error);
      throw error;
    }
  }
}

export default TryOnService;
