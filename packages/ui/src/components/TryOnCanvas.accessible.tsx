/**
 * TryOnCanvas - Accessible Interactive Virtual Try-On Component
 * 
 * Enhanced with comprehensive accessibility features:
 * - Full keyboard navigation support
 * - Screen reader announcements via live regions
 * - Focus management and visible focus states
 * - ARIA labels, roles, and properties
 * - Skip links for complex interactions
 * - High contrast mode compatibility
 * 
 * @author Radha G Sarees Development Team
 * @version 2.0.0 - Accessibility Enhanced
 */

'use client';

import React, { 
  useRef, 
  useEffect, 
  useState, 
  useCallback, 
  useMemo,
  useImperativeHandle,
  forwardRef
} from 'react';
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
  AlertTriangle,
  Maximize2,
  Minimize2
} from 'lucide-react';
import { getQualityScore, QualityScore } from '../lib/qualityScoring';

// Types (same as original)
declare global {
  interface Window {
    tf?: any;
    bodyPix?: any;
  }
}

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

export interface GarmentTransform {
  x: number;
  y: number;
  scale: number;
  rotation: number;
  opacity: number;
}

interface MeshPoint {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
}

export interface TryOnCanvasProps {
  garmentImageUrl: string;
  onReady?: (modelInfo: ModelInfo) => void;
  onPoseState?: (poseOk: boolean) => void;
  onCapture?: (blob: Blob, dataUrl: string) => void;
  initialTransform?: Partial<GarmentTransform>;
  width?: number;
  height?: number;
  debug?: boolean;
  className?: string;
  
  // Accessibility props
  ariaLabel?: string;
  describedBy?: string;
  onFocusCapture?: () => void;
}

// Accessibility-focused ref interface
export interface TryOnCanvasRef {
  focus: () => void;
  capture: () => Promise<void>;
  reset: () => void;
  toggleControls: () => void;
}

const DEFAULT_TRANSFORM: GarmentTransform = {
  x: 0,
  y: 0,
  scale: 1.0,
  rotation: 0,
  opacity: 0.8,
};

/**
 * TryOnCanvas Component - Enhanced for Accessibility
 */
export const TryOnCanvas = forwardRef<TryOnCanvasRef, TryOnCanvasProps>(({
  garmentImageUrl,
  onReady,
  onPoseState,
  onCapture,
  initialTransform = {},
  width = 640,
  height = 480,
  debug = false,
  className = '',
  ariaLabel = "Virtual Try-On Camera",
  describedBy,
  onFocusCapture,
}, ref) => {
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null);
  const garmentImageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);
  
  // Focus management refs
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  
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
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusedElement, setFocusedElement] = useState<string | null>(null);
  
  // Accessibility state
  const [announcements, setAnnouncements] = useState<string[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const animationFrameRef = useRef<number>();

  // Announce to screen readers
  const announce = useCallback((message: string) => {
    setAnnouncements(prev => [...prev, message]);
    // Clear old announcements
    setTimeout(() => {
      setAnnouncements(prev => prev.filter(msg => msg !== message));
    }, 1000);
  }, []);

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

  // Imperative handle for external control
  useImperativeHandle(ref, () => ({
    focus: () => {
      containerRef.current?.focus();
    },
    capture: captureImage,
    reset: () => {
      setTransform(DEFAULT_TRANSFORM);
      announce("Transform settings reset to defaults");
    },
    toggleControls: () => {
      setShowControls(prev => !prev);
      announce(showControls ? "Controls hidden" : "Controls shown");
    }
  }), []);

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
      announce("Loading AI model for virtual try-on");

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
      announce("AI model loaded successfully. Ready for virtual try-on");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load AI model';
      setError(errorMessage);
      setIsLoading(false);
      announce(`Error loading model: ${errorMessage}`);
    }
  }, [width, height, onReady, announce]);

  /**
   * Initialize webcam stream
   */
  const initializeWebcam = useCallback(async () => {
    try {
      announce("Requesting camera access");
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
          announce("Camera access granted. Virtual try-on is ready");
        };
      }
    } catch (err) {
      setWebcamPermission('denied');
      const errorMessage = 'Camera access denied. Please allow camera permissions and refresh.';
      setError(errorMessage);
      announce(errorMessage);
    }
  }, [width, height, announce]);

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

    if (!ctx || !overlayCtx) return;

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
          personMask[pixelIndex] = imageData.data[pixelIndex];
          personMask[pixelIndex + 1] = imageData.data[pixelIndex + 1];
          personMask[pixelIndex + 2] = imageData.data[pixelIndex + 2];
          personMask[pixelIndex + 3] = 255;
        } else {
          personMask[pixelIndex + 3] = 0;
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
        const torsoOffsetY = -height * 0.15;
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
      setIsCapturing(true);
      announce("Capturing image");
      
      const canvas = canvasRef.current;
      const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
      
      // Convert to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();
      
      onCapture?.(blob, dataUrl);
      announce("Image captured successfully");
    } catch (err) {
      console.error('Capture failed:', err);
      const errorMessage = 'Failed to capture image';
      setError(errorMessage);
      announce(errorMessage);
    } finally {
      setIsCapturing(false);
    }
  }, [onCapture, announce]);

  /**
   * Enhanced keyboard controls for accessibility
   */
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!showControls) return;

    const step = event.shiftKey ? 10 : 1;
    const scaleStep = event.shiftKey ? 0.1 : 0.05;
    const rotationStep = event.shiftKey ? 15 : 5;

    let handled = true;
    let announcement = '';

    switch (event.key) {
      case 'ArrowUp':
        setTransform(prev => ({ ...prev, y: prev.y - step }));
        announcement = `Moved up by ${step} pixels`;
        break;
      case 'ArrowDown':
        setTransform(prev => ({ ...prev, y: prev.y + step }));
        announcement = `Moved down by ${step} pixels`;
        break;
      case 'ArrowLeft':
        setTransform(prev => ({ ...prev, x: prev.x - step }));
        announcement = `Moved left by ${step} pixels`;
        break;
      case 'ArrowRight':
        setTransform(prev => ({ ...prev, x: prev.x + step }));
        announcement = `Moved right by ${step} pixels`;
        break;
      case '+':
      case '=':
        setTransform(prev => ({ ...prev, scale: Math.min(prev.scale + scaleStep, 3) }));
        announcement = `Increased scale to ${(transform.scale + scaleStep).toFixed(2)}`;
        break;
      case '-':
        setTransform(prev => ({ ...prev, scale: Math.max(prev.scale - scaleStep, 0.1) }));
        announcement = `Decreased scale to ${(transform.scale - scaleStep).toFixed(2)}`;
        break;
      case 'r':
      case 'R':
        setTransform(prev => ({ ...prev, rotation: (prev.rotation + rotationStep) % 360 }));
        announcement = `Rotated to ${(transform.rotation + rotationStep) % 360} degrees`;
        break;
      case ' ':
        captureImage();
        announcement = 'Capturing image';
        break;
      case 'c':
      case 'C':
        setShowControls(prev => !prev);
        announcement = showControls ? 'Controls hidden' : 'Controls shown';
        break;
      case 'f':
      case 'F':
        if (document.fullscreenEnabled) {
          toggleFullscreen();
        }
        break;
      case 'Escape':
        if (isFullscreen) {
          exitFullscreen();
        }
        break;
      default:
        handled = false;
    }

    if (handled) {
      event.preventDefault();
      if (announcement) {
        announce(announcement);
      }
    }
  }, [showControls, captureImage, announce, transform, isFullscreen]);

  /**
   * Focus trap for modal-like behavior when fullscreen
   */
  const handleKeyDownCapture = useCallback((event: React.KeyboardEvent) => {
    if (event.key === 'Tab' && isFullscreen) {
      const focusableElements = containerRef.current?.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      );
      
      if (focusableElements && focusableElements.length > 0) {
        const first = focusableElements[0] as HTMLElement;
        const last = focusableElements[focusableElements.length - 1] as HTMLElement;
        
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    }
  }, [isFullscreen]);

  /**
   * Toggle fullscreen mode
   */
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!isFullscreen) {
        await containerRef.current?.requestFullscreen();
        setIsFullscreen(true);
        announce("Entered fullscreen mode");
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
        announce("Exited fullscreen mode");
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, [isFullscreen, announce]);

  /**
   * Exit fullscreen mode
   */
  const exitFullscreen = useCallback(async () => {
    try {
      await document.exitFullscreen();
      setIsFullscreen(false);
      announce("Exited fullscreen mode");
    } catch (err) {
      console.error('Exit fullscreen error:', err);
    }
  }, [announce]);

  // Enhanced transform update functions with announcements
  const updateTransform = useCallback((key: keyof GarmentTransform, value: number, label: string) => {
    setTransform(prev => ({ ...prev, [key]: value }));
    
    let announcement = '';
    switch (key) {
      case 'x':
        announcement = `Horizontal position: ${value}`;
        break;
      case 'y':
        announcement = `Vertical position: ${value}`;
        break;
      case 'scale':
        announcement = `Scale: ${value.toFixed(2)}`;
        break;
      case 'rotation':
        announcement = `Rotation: ${value} degrees`;
        break;
      case 'opacity':
        announcement = `Opacity: ${Math.round(value * 100)} percent`;
        break;
    }
    
    announce(announcement);
  }, [announce]);

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
      garmentImageRef.current.onload = () => {
        announce("Garment image loaded");
      };
    }
  }, [garmentImageUrl, announce]);

  // Fullscreen event listeners
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  return (
    <div 
      ref={containerRef}
      className={`relative bg-gray-900 rounded-lg overflow-hidden focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${className}`}
      role="application"
      aria-label={ariaLabel}
      aria-describedby={describedBy}
      tabIndex={0}
      onKeyDown={handleKeyDownCapture}
      onFocus={onFocusCapture}
    >
      {/* Screen reader announcements */}
      <div 
        ref={liveRegionRef}
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {announcements.map((announcement, index) => (
          <div key={index}>{announcement}</div>
        ))}
      </div>

      {/* Skip link for keyboard users */}
      <a 
        href="#tryon-controls"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-white px-2 py-1 rounded text-sm z-50"
      >
        Skip to try-on controls
      </a>

      {/* Hidden elements */}
      <video
        ref={videoRef}
        className="hidden"
        width={width}
        height={height}
        autoPlay
        muted
        playsInline
        aria-hidden="true"
      />
      
      <canvas
        ref={overlayCanvasRef}
        width={width}
        height={height}
        className="hidden"
        aria-hidden="true"
      />
      
      <img
        ref={garmentImageRef}
        alt="Garment overlay for virtual try-on"
        className="hidden"
        crossOrigin="anonymous"
      />

      {/* Main canvas */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full object-contain"
        aria-label="Virtual try-on preview showing live camera feed with garment overlay"
        role="img"
      />

      {/* Loading overlay */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center"
          role="status"
          aria-live="polite"
        >
          <div className="text-center text-white">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2" aria-hidden="true" />
            <p>Loading AI model for virtual try-on...</p>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {error && (
        <div 
          className="absolute inset-0 bg-red-900 bg-opacity-75 flex items-center justify-center p-4"
          role="alert"
          aria-live="assertive"
        >
          <div className="text-center text-white max-w-md">
            <CameraOff className="w-8 h-8 mx-auto mb-2" aria-hidden="true" />
            <h3 className="font-semibold mb-2">Error</h3>
            <p className="text-sm mb-4">{error}</p>
            {webcamPermission === 'denied' && (
              <button
                onClick={initializeWebcam}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 focus:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-300 rounded-lg transition-colors"
                aria-describedby="retry-camera-help"
              >
                Retry Camera Access
              </button>
            )}
            <div id="retry-camera-help" className="sr-only">
              This will request camera permissions again for the virtual try-on feature
            </div>
          </div>
        </div>
      )}

      {/* Pose Quality Banner */}
      {isRecording && qualityScore && qualityScore.overall < 0.7 && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
          <div 
            className="bg-yellow-500 bg-opacity-90 backdrop-blur-sm text-black px-4 py-2 rounded-lg flex items-center space-x-2 shadow-lg"
            role="status"
            aria-live="polite"
          >
            <AlertTriangle className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">{qualityScore.feedback}</span>
          </div>
        </div>
      )}

      {/* Controls */}
      {showControls && isRecording && (
        <div 
          id="tryon-controls"
          className="absolute top-4 left-4 right-4"
          role="region"
          aria-labelledby="controls-heading"
        >
          <h2 id="controls-heading" className="sr-only">Try-on adjustment controls</h2>
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-lg p-4 space-y-4">
            {/* Position Controls */}
            <fieldset className="grid grid-cols-2 gap-4">
              <legend className="sr-only">Position controls</legend>
              <div>
                <label 
                  htmlFor="position-x" 
                  className="block text-white text-sm mb-1"
                >
                  Horizontal Position: {transform.x}
                </label>
                <input
                  id="position-x"
                  type="range"
                  min="-200"
                  max="200"
                  value={transform.x}
                  onChange={(e) => updateTransform('x', Number(e.target.value), 'Horizontal position')}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="position-x-help"
                />
                <div id="position-x-help" className="sr-only">
                  Use arrow keys or drag to adjust horizontal position. Current value: {transform.x} pixels
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="position-y" 
                  className="block text-white text-sm mb-1"
                >
                  Vertical Position: {transform.y}
                </label>
                <input
                  id="position-y"
                  type="range"
                  min="-200"
                  max="200"
                  value={transform.y}
                  onChange={(e) => updateTransform('y', Number(e.target.value), 'Vertical position')}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="position-y-help"
                />
                <div id="position-y-help" className="sr-only">
                  Use arrow keys or drag to adjust vertical position. Current value: {transform.y} pixels
                </div>
              </div>
            </fieldset>

            {/* Scale, Rotation, Opacity */}
            <fieldset className="grid grid-cols-3 gap-4">
              <legend className="sr-only">Transform controls</legend>
              <div>
                <label 
                  htmlFor="scale" 
                  className="block text-white text-sm mb-1"
                >
                  Scale: {transform.scale.toFixed(2)}
                </label>
                <input
                  id="scale"
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.05"
                  value={transform.scale}
                  onChange={(e) => updateTransform('scale', Number(e.target.value), 'Scale')}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="scale-help"
                />
                <div id="scale-help" className="sr-only">
                  Adjust garment size. Use plus/minus keys or drag. Current scale: {transform.scale.toFixed(2)}
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="rotation" 
                  className="block text-white text-sm mb-1"
                >
                  Rotation: {transform.rotation}°
                </label>
                <input
                  id="rotation"
                  type="range"
                  min="0"
                  max="360"
                  value={transform.rotation}
                  onChange={(e) => updateTransform('rotation', Number(e.target.value), 'Rotation')}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="rotation-help"
                />
                <div id="rotation-help" className="sr-only">
                  Rotate garment. Use R key or drag. Current rotation: {transform.rotation} degrees
                </div>
              </div>
              
              <div>
                <label 
                  htmlFor="opacity" 
                  className="block text-white text-sm mb-1"
                >
                  Opacity: {Math.round(transform.opacity * 100)}%
                </label>
                <input
                  id="opacity"
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={transform.opacity}
                  onChange={(e) => updateTransform('opacity', Number(e.target.value), 'Opacity')}
                  className="w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-describedby="opacity-help"
                />
                <div id="opacity-help" className="sr-only">
                  Adjust garment transparency. Current opacity: {Math.round(transform.opacity * 100)} percent
                </div>
              </div>
            </fieldset>

            {/* Action buttons */}
            <div className="flex justify-between items-center" role="group" aria-labelledby="actions-heading">
              <h3 id="actions-heading" className="sr-only">Action buttons</h3>
              <div className="flex space-x-2">
                <button
                  ref={firstFocusableRef}
                  onClick={() => {
                    setShowControls(false);
                    announce("Controls hidden");
                  }}
                  className="p-2 bg-gray-700 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg text-white transition-colors"
                  aria-label="Hide controls"
                  title="Hide controls (C key)"
                >
                  <EyeOff className="w-4 h-4" aria-hidden="true" />
                </button>
                
                <button
                  onClick={() => {
                    setTransform(DEFAULT_TRANSFORM);
                    announce("Transform settings reset to defaults");
                  }}
                  className="px-3 py-2 bg-gray-700 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg text-white text-sm transition-colors"
                  aria-label="Reset all transform settings to default values"
                >
                  Reset
                </button>

                {document.fullscreenEnabled && (
                  <button
                    onClick={toggleFullscreen}
                    className="p-2 bg-gray-700 hover:bg-gray-600 focus:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-300 rounded-lg text-white transition-colors"
                    aria-label={isFullscreen ? "Exit fullscreen (F key)" : "Enter fullscreen (F key)"}
                    title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" aria-hidden="true" />
                    ) : (
                      <Maximize2 className="w-4 h-4" aria-hidden="true" />
                    )}
                  </button>
                )}
              </div>
              
              <button
                ref={lastFocusableRef}
                onClick={captureImage}
                disabled={isProcessing || isCapturing}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-700 focus:bg-primary-700 disabled:bg-gray-600 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary-300 rounded-lg text-white font-medium transition-colors flex items-center space-x-2"
                aria-label="Capture current try-on image (Spacebar)"
                aria-describedby="capture-help"
              >
                {isCapturing ? (
                  <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Camera className="w-4 h-4" aria-hidden="true" />
                )}
                <span>{isCapturing ? 'Capturing...' : 'Capture'}</span>
              </button>
              <div id="capture-help" className="sr-only">
                This will save the current try-on preview as an image
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toggle controls button when hidden */}
      {!showControls && isRecording && (
        <button
          onClick={() => {
            setShowControls(true);
            announce("Controls shown");
          }}
          className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 hover:bg-opacity-75 focus:bg-opacity-75 focus:outline-none focus:ring-2 focus:ring-white rounded-lg text-white transition-colors"
          aria-label="Show controls (C key)"
          title="Show controls"
        >
          <Eye className="w-4 h-4" aria-hidden="true" />
        </button>
      )}

      {/* Processing indicator */}
      {isProcessing && (
        <div 
          className="absolute bottom-4 left-4"
          role="status"
          aria-live="polite"
        >
          <div className="bg-black bg-opacity-50 backdrop-blur-sm rounded-full px-3 py-1 text-white text-xs flex items-center space-x-2">
            <RefreshCw className="w-3 h-3 animate-spin" aria-hidden="true" />
            <span>Processing frame...</span>
          </div>
        </div>
      )}

      {/* Enhanced keyboard help */}
      <details 
        className="absolute bottom-4 right-4 text-xs text-white bg-black bg-opacity-50 backdrop-blur-sm rounded-lg"
        aria-labelledby="keyboard-help-summary"
      >
        <summary 
          id="keyboard-help-summary"
          className="p-2 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white rounded"
          aria-expanded="false"
        >
          Keyboard Help
        </summary>
        <div className="p-2 pt-0 space-y-1">
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">↑↓←→</kbd> Move garment</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Shift</kbd> + arrows for faster movement</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">+/-</kbd> Scale up/down</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">R</kbd> Rotate garment</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Space</kbd> Capture image</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">C</kbd> Toggle controls</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">F</kbd> Toggle fullscreen</div>
          <div><kbd className="px-1 py-0.5 bg-gray-700 rounded text-xs">Esc</kbd> Exit fullscreen</div>
        </div>
      </details>
    </div>
  );
});

TryOnCanvas.displayName = 'TryOnCanvas';

export default TryOnCanvas;