// TryOn related types and interfaces

export interface TryOnRequest {
  userId: string;
  productId: string;
  userImage: string; // Base64 or URL to user photo
  garmentImage: string; // URL to garment image
  settings?: TryOnSettings;
}

export interface TryOnSettings {
  quality: 'low' | 'medium' | 'high';
  pose?: 'front' | 'side' | 'back';
  lighting?: 'auto' | 'studio' | 'natural';
  fitType?: 'loose' | 'regular' | 'tight';
}

export interface TryOnJob {
  id: string;
  userId: string;
  productId: string;
  status: TryOnStatus;
  progress: number;
  userImageUrl: string;
  garmentImageUrl: string;
  resultImageUrl?: string;
  settings: TryOnSettings;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  processingTimeMs?: number;
}

export enum TryOnStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export interface TryOnResult {
  jobId: string;
  status: TryOnStatus;
  resultImageUrl?: string;
  confidence?: number;
  errorMessage?: string;
  processingTimeMs?: number;
  metadata?: {
    originalImageDimensions: { width: number; height: number };
    resultImageDimensions: { width: number; height: number };
    garmentBounds?: { x: number; y: number; width: number; height: number };
    qualityScore?: number;
  };
}

export interface TryOnProcessingError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface TryOnUploadResponse {
  success: boolean;
  jobId?: string;
  uploadUrl?: string;
  error?: TryOnProcessingError;
}

export interface TryOnStatusResponse {
  jobId: string;
  status: TryOnStatus;
  progress: number;
  result?: TryOnResult;
  error?: TryOnProcessingError;
}

export interface TryOnCancelResponse {
  success: boolean;
  jobId: string;
  error?: TryOnProcessingError;
}

// Hooks and utilities
export interface UseTryOnReturn {
  uploadImage: (file: File) => Promise<TryOnUploadResponse>;
  getStatus: (jobId: string) => Promise<TryOnStatusResponse>;
  cancelJob: (jobId: string) => Promise<TryOnCancelResponse>;
  isLoading: boolean;
  error: string | null;
}

export interface TryOnCanvasProps {
  userImage?: string;
  garmentImage: string;
  resultImage?: string;
  isLoading?: boolean;
  onImageLoad?: (event: Event) => void;
  onError?: (error: Error) => void;
  className?: string;
}

export interface TryOnControlsProps {
  onStartTryOn: () => void;
  onCancelTryOn: () => void;
  onRetry: () => void;
  isProcessing: boolean;
  canStart: boolean;
  canCancel: boolean;
  className?: string;
}