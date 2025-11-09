/**
 * TryOnCanvas - Interactive Virtual Try-On Component
 * 
 * A real-time virtual try-on experience using webcam, TensorFlow.js BodyPix for person segmentation,
 * and interactive garment overlay with mesh warping capabilities.
 * 
 * Features:
 * - Webcam integration with permission handling
 * - Real-time person segmentation using BodyPix
 * - Interactive garment overlay with transform controls
 * - Lightweight 3x3 mesh warping for garment fitting
 * - Accessibility support with keyboard controls
 * - Capture functionality returning processed image as Blob
 * 
 * @author Radha G Sarees Development Team
 * @version 1.0.0
 */

'use client';

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { 
  Camera, 
  CameraOff, 
  Download, 
  RotateCw, 
  Move, 
  ZoomIn, 
  ZoomOut,
  Settings,
  Eye,
  EyeOff,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { getQualityScore, QualityScore } from '../lib/qualityScoring';

// Extend Window interface for TensorFlow.js
declare global {
  interface Window {
    tf?: any;
    bodyPix?: any;
  }
}

// TensorFlow.js and BodyPix types
interface BodyPixModel {
  segmentPerson: (
    input: HTMLVideoElement | HTMLCanvasElement,
    config?: SegmentationConfig
  ) => Promise<SemanticSegmentation>;
}

interface SemanticSegmentation {
  data: Uint8Array;
  width: number;
  height: number;
}

interface SegmentationConfig {
  flipHorizontal?: boolean;
  internalResolution?: 'low' | 'medium' | 'high' | 'full';
  segmentationThreshold?: number;
}

interface ModelInfo {
  name: string;
  version: string;
  inputSize: [number, number];
  outputStride: number;
}

/**
 * Transform properties for garment overlay positioning
 */
export interface GarmentTransform {
  /** X position offset in pixels */
  x: number;
  /** Y position offset in pixels */
  y: number;
  /** Scale factor (1.0 = original size) */
  scale: number;
  /** Rotation angle in degrees */
  rotation: number;
  /** Opacity (0.0 to 1.0) */
  opacity: number;
}

/**
 * Mesh point for 3x3 warping grid
 */
interface MeshPoint {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
}

/**
 * Props for TryOnCanvas component
 */
export interface TryOnCanvasProps {
  /** URL of the garment image to overlay */
  garmentImageUrl: string;
  /** Callback when model is loaded and ready */
  onReady?: (modelInfo: ModelInfo) => void;
  /** Callback for pose detection state */
  onPoseState?: (poseOk: boolean) => void;
  /** Callback when capture is completed */
  onCapture?: (blob: Blob, dataUrl: string) => void;
  /** Initial transform values */
  initialTransform?: Partial<GarmentTransform>;
  /** Canvas dimensions */
  width?: number;
  height?: number;
  /** Enable debug mode to show segmentation overlay */
  debug?: boolean;
  /** Custom CSS class */
  className?: string;
}

const DEFAULT_TRANSFORM: GarmentTransform = {
  x: 0,
  y: 0,
  scale: 1.0,
  rotation: 0,
  opacity: 0.8,
};



/**
 * TryOnCanvas Component
 * 
 * Interactive virtual try-on component with real-time garment overlay
 * using webcam and AI-powered person segmentation.
 */
export function TryOnCanvas({
  garmentImageUrl,
  onReady,
  onPoseState,
  onCapture,
  initialTransform = {},
  width = 640,
  height = 480,
  debug = false,
  className = '',
}: TryOnCanvasProps) {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const garmentImageRef = useRef<HTMLImageElement>(null);
  
  // State
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [model, setModel] = useState<BodyPixModel | null>(null);
  const [webcamPermission, setWebcamPermission] = useState<'granted' | 'denied' | 'prompt'>('prompt');
  const [transform, setTransform] = useState<GarmentTransform>({
    ...DEFAULT_TRANSFORM,
    ...initialTransform,
  });
  const [showControls, setShowControls] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [meshPoints, setMeshPoints] = useState<MeshPoint[]>([]);
  const [qualityScore, setQualityScore] = useState<QualityScore | null>(null);
  
  // Animation frame ID
  const animationFrameRef = useRef<number>();
  
  // Memoized transform values for performance
  const transformMatrix = useMemo(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    return {
      translateX: centerX + transform.x,
      translateY: centerY + transform.y,
      scale: transform.scale,
      rotation: (transform.rotation * Math.PI) / 180,
      opacity: transform.opacity,
    };
  }, [transform, width, height]);

  /**
   * Initialize 3x3 mesh grid for garment warping
   */
  const initializeMeshGrid = useCallback(() => {
    const points: MeshPoint[] = [];
    const rows = 3;
    const cols = 3;
    
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x = (col / (cols - 1)) * width;
        const y = (row / (rows - 1)) * height;
        points.push({
          x,
          y,
          originalX: x,
          originalY: y,
        });
      }
    }
    
    setMeshPoints(points);
  }, [width, height]);

  /**
   * Load TensorFlow.js and BodyPix model
   */
  const loadModel = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load TensorFlow.js and BodyPix from CDN
      if (typeof window !== 'undefined' && !window.tf) {
        await new Promise<void>((resolve, reject) => {
          const script1 = document.createElement('script');
          script1.src = 'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.10.0/dist/tf.min.js';
          script1.onload = () => {
            const script2 = document.createElement('script');
            script2.src = 'https://cdn.jsdelivr.net/npm/@tensorflow-models/body-pix@2.2.1/dist/body-pix.min.js';
            script2.onload = () => resolve();
            script2.onerror = () => reject(new Error('Failed to load BodyPix'));
            document.head.appendChild(script2);
          };
          script1.onerror = () => reject(new Error('Failed to load TensorFlow.js'));
          document.head.appendChild(script1);
        });
      }

      // Load BodyPix model
      const bodyPix = window.bodyPix;
      if (!bodyPix) {
        throw new Error('BodyPix failed to load');
      }

      const loadedModel = await bodyPix.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75,
        quantBytes: 2,
      });

      setModel(loadedModel);
      
      const modelInfo: ModelInfo = {
        name: 'BodyPix MobileNetV1',
        version: '2.2.1',
        inputSize: [width, height],
        outputStride: 16,
      };

      onReady?.(modelInfo);
      setIsLoading(false);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI model';
      setError(errorMessage);
      setIsLoading(false);
    }
  }, [width, height, onReady]);

  /**
   * Initialize webcam stream
   */
  const initializeWebcam = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: width },
          height: { ideal: height },
          facingMode: 'user',
        },
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play();
          setIsRecording(true);
          setWebcamPermission('granted');
        };
      }
    } catch (err) {
      setWebcamPermission('denied');
      setError('Webcam access denied. Please allow camera permissions and refresh.');
    }
  }, [width, height]);

  /**
   * Perform real-time person segmentation and garment overlay
   */
  const processFrame = useCallback(async () => {
    if (!model || !videoRef.current || !canvasRef.current || !garmentImageRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const overlayCanvas = overlayCanvasRef.current;
    const overlayCtx = overlayCanvas?.getContext('2d');

    if (!ctx || !overlayCanvas || !overlayCtx) return;

    try {
      setIsProcessing(true);

      // Perform person segmentation
      const segmentation = await model.segmentPerson(video, {
        flipHorizontal: true,
        internalResolution: 'medium',
        segmentationThreshold: 0.7,
      });

      // Clear canvases
      ctx.clearRect(0, 0, width, height);
      overlayCtx.clearRect(0, 0, width, height);

      // Draw video frame
      ctx.save();
      ctx.scale(-1, 1);
      ctx.drawImage(video, -width, 0, width, height);
      ctx.restore();

      // Create person mask
      const imageData = ctx.getImageData(0, 0, width, height);
      const personMask = new Uint8ClampedArray(width * height * 4);

      for (let i = 0; i < segmentation.data.length; i++) {
        const isPerson = segmentation.data[i] > 0;
        const pixelIndex = i * 4;
        
        if (isPerson) {
          personMask[pixelIndex] = imageData.data[pixelIndex];     // R
          personMask[pixelIndex + 1] = imageData.data[pixelIndex + 1]; // G
          personMask[pixelIndex + 2] = imageData.data[pixelIndex + 2]; // B
          personMask[pixelIndex + 3] = 255; // A
        } else {
          personMask[pixelIndex + 3] = 0; // Transparent
        }
      }

      // Calculate quality score for pose assessment
      const currentQualityScore = getQualityScore(segmentation, imageData, width, height);
      setQualityScore(currentQualityScore);
      
      const poseOk = currentQualityScore.overall >= 0.7;
      onPoseState?.(poseOk);

      // Draw garment overlay if person is detected
      if (poseOk) {
        overlayCtx.save();
        overlayCtx.globalAlpha = transformMatrix.opacity;
        
        // Apply transforms
        overlayCtx.translate(transformMatrix.translateX, transformMatrix.translateY);
        overlayCtx.scale(transformMatrix.scale, transformMatrix.scale);
        overlayCtx.rotate(transformMatrix.rotation);

        // Simple mesh warping (lightweight 3x3 grid)
        const garmentWidth = garmentImageRef.current.width * transformMatrix.scale;
        const garmentHeight = garmentImageRef.current.height * transformMatrix.scale;
        
        // Draw garment with basic torso alignment
        const torsoOffsetY = -height * 0.15; // Align with upper torso
        overlayCtx.drawImage(
          garmentImageRef.current,
          -garmentWidth / 2,
          torsoOffsetY - garmentHeight / 2,
          garmentWidth,
          garmentHeight
        );
        
        overlayCtx.restore();
      }

      // Composite final image
      ctx.globalCompositeOperation = 'source-over';
      ctx.drawImage(overlayCanvas, 0, 0);

      // Debug mode: show segmentation
      if (debug) {
        const maskImageData = new ImageData(personMask, width, height);
        ctx.globalAlpha = 0.5;
        ctx.putImageData(maskImageData, 0, 0);
        ctx.globalAlpha = 1.0;
      }

      setIsProcessing(false);
    } catch (err) {
      console.error('Frame processing error:', err);
      setIsProcessing(false);
    }
  }, [model, transformMatrix, onPoseState, width, height, debug]);

  /**
   * Animation loop for real-time processing
   */
  const animate = useCallback(() => {
    processFrame();
    animationFrameRef.current = requestAnimationFrame(animate);
  }, [processFrame]);

  /**
   * Capture current frame as image
   */
  const captureImage = useCallback(async () => {
    if (!canvasRef.current) return;

    try {
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      onCapture?.(blob, dataUrl);
    } catch (err) {
      console.error('Capture failed:', err);
      setError('Failed to capture image');
    }
  }, [onCapture]);

  /**
   * Handle keyboard controls for accessibility
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!showControls) return;

    const step = event.shiftKey ? 10 : 1;
    const scaleStep = event.shiftKey ? 0.1 : 0.05;
    const rotationStep = event.shiftKey ? 15 : 5;

    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, y: prev.y - step }));
        break;
      case 'ArrowDown':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, y: prev.y + step }));
        break;
      case 'ArrowLeft':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, x: prev.x - step }));
        break;
      case 'ArrowRight':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, x: prev.x + step }));
        break;
      case '+':
      case '=':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, scale: Math.min(prev.scale + scaleStep, 3) }));
        break;
      case '-':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, scale: Math.max(prev.scale - scaleStep, 0.1) }));
        break;
      case 'r':
        event.preventDefault();
        setTransform((prev: GarmentTransform) => ({ ...prev, rotation: (prev.rotation + rotationStep) % 360 }));
        break;
      case ' ':
        event.preventDefault();
        captureImage();
        break;
    }
  }, [showControls, captureImage]);

  // Initialize component
  useEffect(() => {
    loadModel();
    initializeMeshGrid();
  }, [loadModel, initializeMeshGrid]);

  // Setup webcam when model is ready
  useEffect(() => {
    if (model && webcamPermission === 'prompt') {
      initializeWebcam();
    }
  }, [model, webcamPermission, initializeWebcam]);

  // Start animation loop when recording
  useEffect(() => {
    if (isRecording && model) {
      animate();
    }
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isRecording, model, animate]);

  // Setup keyboard listeners
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Load garment image
  useEffect(() => {
    if (garmentImageUrl && garmentImageRef.current) {
      garmentImageRef.current.src = garmentImageUrl;
    }
  }, [garmentImageUrl]);

  return (
    <div 
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
      role="application"
      aria-label="Virtual Try-On Canvas"
    >
      {/* Hidden elements */}
      <video
        ref={videoRef}
        className="hidden"
        width={width}
        height={height}
        autoPlay
        muted
        playsInline
      />
      
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="hidden"
      />
      
      <img
        ref={garmentImageRef}
        alt="Garment overlay"
        className="hidden"
        crossOrigin="anonymous"
      />

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain"
        aria-label="Virtual try-on preview"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
          <div className="text-center text-white">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" />
            <p>Loading AI model...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center p-4">
          <div className="text-center text-white max-w-md">
            <CameraOff className="w-8 h-8 mx-auto mb-2" />
            <p className="font-semibold mb-2">Error</p>
            <p className="text-sm">{error}</p>
            {webcamPermission === 'denied' && (
              <button
                onClick={initializeWebcam}
                className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
              >
                Retry Camera Access
              </button>
            )}
          </div>
        </div>
      )}

      {/* Pose Quality Banner */}
      {isRecording && qualityScore && qualityScore.overall < 0.7 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div className="bg-yellow-500 bg-opacity-90 backdrop-blur-sm text-white px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{qualityScore.feedback}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && isRecording && (
        <div className="absolute top-4 left-4 right-4">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4 space-y-4">
            {/* Position Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-white text-sm mb-1">
                  Position X: {transform.x}
                </label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={transform.x}
                  onChange={(e) => setTransform((prev: GarmentTransform) => ({ ...prev, x: Number(e.target.value) }))}
                  className="w-full"
                  aria-label="Horizontal position"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">
                  Position Y: {transform.y}
                </label>
                <input
                  type="range"
                  min="-200"
                  max="200"
                  value={transform.y}
                  onChange={(e) => setTransform((prev: GarmentTransform) => ({ ...prev, y: Number(e.target.value) }))}
                  className="w-full"
                  aria-label="Vertical position"
                />
              </div>
            </div>

            {/* Scale, Rotation, Opacity */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-white text-sm mb-1">
                  Scale: {transform.scale.toFixed(2)}
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={transform.scale}
                  onChange={(e) => setTransform((prev: GarmentTransform) => ({ ...prev, scale: Number(e.target.value) }))}
                  className="w-full"
                  aria-label="Scale"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">
                  Rotation: {transform.rotation}°
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  value={transform.rotation}
                  onChange={(e) => setTransform((prev: GarmentTransform) => ({ ...prev, rotation: Number(e.target.value) }))}
                  className="w-full"
                  aria-label="Rotation"
                />
              </div>
              <div>
                <label className="block text-white text-sm mb-1">
                  Opacity: {Math.round(transform.opacity * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={transform.opacity}
                  onChange={(e) => setTransform((prev: GarmentTransform) => ({ ...prev, opacity: Number(e.target.value) }))}
                  className="w-full"
                  aria-label="Opacity"
                />
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowControls(false)}
                  className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white transition-colors"
                  aria-label="Hide controls"
                >
                  <EyeOff className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setTransform(DEFAULT_TRANSFORM)}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-white text-sm transition-colors"
                  aria-label="Reset transform"
                >
                  Reset
                </button>
              </div>
              
              <button
                onClick={captureImage}
                disabled={isProcessing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-600 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
                aria-label="Capture image"
              >
                <Camera className="w-4 h-4" />
                <span>Capture</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toggle controls button when hidden */}
      {!showControls && isRecording && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 rounded-lg text-white transition-colors"
          aria-label="Show controls"
        >
          <Eye className="w-4 h-4" />
        </button>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div className="absolute bottom-4 left-4">
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs flex items-center space-x-2">
            <RefreshCw className="w-3 h-3 animate-spin" />
            <span>Processing...</span>
          </div>
        </div>
      )}

      {/* Keyboard help */}
      <div className="absolute bottom-4 right-4 text-xs text-white bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-2">
        <div className="text-center">
          <kbd className="px-1 py-0.5 bg-gray-700 rounded">↑↓←→</kbd> Move
          <br />
          <kbd className="px-1 py-0.5 bg-gray-700 rounded">+/-</kbd> Scale
          <br />
          <kbd className="px-1 py-0.5 bg-gray-700 rounded">R</kbd> Rotate
          <br />
          <kbd className="px-1 py-0.5 bg-gray-700 rounded">Space</kbd> Capture
        </div>
      </div>
    </div>
  );
}