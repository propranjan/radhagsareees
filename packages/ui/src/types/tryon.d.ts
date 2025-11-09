// Global type declarations for TryOnCanvas component

declare global {
  interface Window {
    tf?: any;
    bodyPix?: any;
  }
}

// TensorFlow.js BodyPix types
export interface BodyPixModel {
  segmentPerson: (
    input: HTMLVideoElement | HTMLCanvasElement,
    config?: SegmentationConfig
  ) => Promise<SemanticSegmentation>;
}

export interface SemanticSegmentation {
  data: Uint8Array;
  width: number;
  height: number;
}

export interface SegmentationConfig {
  flipHorizontal?: boolean;
  internalResolution?: 'low' | 'medium' | 'high' | 'full';
  segmentationThreshold?: number;
}

export interface ModelInfo {
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

export interface MeshPoint {
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
}

// Try-On Synthesis Types

/**
 * Status of a try-on synthesis job
 */
export type TryOnJobStatus = 
  | 'pending'     // Job queued for processing
  | 'processing'  // AI model actively working
  | 'completed'   // Successfully finished
  | 'failed'      // Processing error occurred
  | 'cancelled';  // Job was cancelled

/**
 * Try-on synthesis job details
 */
export interface TryOnJob {
  /** Unique job identifier */
  jobId: string;
  
  /** Current processing status */
  status: TryOnJobStatus;
  
  /** URL to preview/result image (available when status is 'completed') */
  previewUrl?: string;
  
  /** Error message if status is 'failed' */
  error?: string;
  
  /** Processing progress percentage (0-100) */
  progress?: number;
  
  /** Estimated completion time in seconds */
  estimatedTimeRemaining?: number;
  
  /** Job creation timestamp */
  createdAt: string;
  
  /** Job completion/failure timestamp */
  completedAt?: string;
}

/**
 * Request payload for uploading try-on synthesis job
 */
export interface TryOnUploadRequest {
  /** Garment identifier to overlay */
  garmentId: string;
  
  /** Base64 encoded image data or FormData field name */
  imageData?: string;
  
  /** Optional user ID for tracking */
  userId?: string;
  
  /** Additional processing options */
  options?: TryOnProcessingOptions;
}

/**
 * Processing configuration options
 */
export interface TryOnProcessingOptions {
  /** Output image quality (0.1-1.0) */
  quality?: number;
  
  /** Output image format */
  format?: 'jpeg' | 'png' | 'webp';
  
  /** Maximum output dimensions */
  maxWidth?: number;
  maxHeight?: number;
  
  /** Enable advanced mesh warping */
  enableAdvancedWarping?: boolean;
  
  /** Processing priority (higher = faster) */
  priority?: 'low' | 'normal' | 'high';
}

/**
 * API response for job upload
 */
export interface TryOnUploadResponse {
  /** Created job details */
  job: TryOnJob;
  
  /** Success status */
  success: boolean;
  
  /** Error message if upload failed */
  error?: string;
}

/**
 * API response for job status polling
 */
export interface TryOnJobStatusResponse {
  /** Updated job details */
  job: TryOnJob;
  
  /** Success status */
  success: boolean;
  
  /** Error message if status check failed */
  error?: string;
}

/**
 * Hook return type for useTryOnSynthesis
 */
export interface TryOnSynthesisHook {
  /** Current job details (null if no active job) */
  job: TryOnJob | null;
  
  /** Whether upload/processing is in progress */
  isLoading: boolean;
  
  /** Whether job completed successfully */
  isCompleted: boolean;
  
  /** Whether job failed */
  isError: boolean;
  
  /** Error message if job failed */
  error: string | null;
  
  /** Upload captured image and start processing */
  uploadImage: (blob: Blob, garmentId: string, options?: TryOnProcessingOptions) => Promise<void>;
  
  /** Cancel current job if in progress */
  cancelJob: () => Promise<void>;
  
  /** Reset hook state for new job */
  reset: () => void;
  
  /** Manually retry failed job */
  retry: () => Promise<void>;
}

/**
 * Configuration for the useTryOnSynthesis hook
 */
export interface TryOnSynthesisConfig {
  /** Polling interval in milliseconds (default: 2000) */
  pollingInterval?: number;
  
  /** Maximum polling attempts before timeout (default: 150 = 5 minutes) */
  maxPollingAttempts?: number;
  
  /** Auto-start polling after upload (default: true) */
  autoStartPolling?: boolean;
  
  /** Callback when job status changes */
  onStatusChange?: (job: TryOnJob) => void;
  
  /** Callback when job completes successfully */
  onComplete?: (job: TryOnJob) => void;
  
  /** Callback when job fails */
  onError?: (error: string, job?: TryOnJob) => void;
}

/**
 * Error types for try-on synthesis
 */
export class TryOnSynthesisError extends Error {
  constructor(
    message: string,
    public code: 'UPLOAD_FAILED' | 'PROCESSING_FAILED' | 'TIMEOUT' | 'CANCELLED' | 'INVALID_INPUT',
    public job?: TryOnJob
  ) {
    super(message);
    this.name = 'TryOnSynthesisError';
  }
}

export {};