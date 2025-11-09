/**
 * useTryOnSynthesis Hook
 * 
 * React hook for managing virtual try-on image synthesis jobs.
 * Handles image upload, job polling, and status management.
 * 
 * @example
 * ```typescript
 * const { job, isLoading, uploadImage, cancelJob } = useTryOnSynthesis({
 *   onComplete: (job) => console.log('Job completed:', job.previewUrl),
 *   onError: (error) => console.error('Job failed:', error)
 * });
 * 
 * // Upload captured image for processing
 * await uploadImage(capturedBlob, 'garment-123', { quality: 0.9 });
 * ```
 */

'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import type { 
  TryOnJob, 
  TryOnSynthesisHook, 
  TryOnSynthesisConfig, 
  TryOnProcessingOptions,
  TryOnUploadResponse,
  TryOnJobStatusResponse
} from '../types/tryon.d';
import { TryOnSynthesisError } from '../types/tryon.d';

/**
 * Default configuration for the synthesis hook
 */
const DEFAULT_CONFIG: Required<TryOnSynthesisConfig> = {
  pollingInterval: 2000,        // Poll every 2 seconds
  maxPollingAttempts: 150,      // 5 minutes max (150 * 2s)
  autoStartPolling: true,       // Auto-start polling after upload
  onStatusChange: () => {},     // No-op callbacks
  onComplete: () => {},
  onError: () => {},
};

/**
 * Virtual try-on synthesis hook
 * 
 * @param config - Configuration options for polling and callbacks
 * @returns Hook interface with job state and control functions
 */
export function useTryOnSynthesis(config: TryOnSynthesisConfig = {}): TryOnSynthesisHook {
  const resolvedConfig = { ...DEFAULT_CONFIG, ...config };
  
  // State management
  const [job, setJob] = useState<TryOnJob | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Polling control
  const pollingIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollingAttemptsRef = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // Derived state
  const isCompleted = job?.status === 'completed';
  const isError = job?.status === 'failed' || !!error;
  
  /**
   * Clear polling interval and abort any pending requests
   */
  const clearPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    pollingAttemptsRef.current = 0;
  }, []);
  
  /**
   * Make API request with proper error handling
   */
  const makeApiRequest = useCallback(async <T>(
    url: string, 
    options: RequestInit = {}
  ): Promise<T> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'API request failed');
      }
      
      return data;
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        throw new TryOnSynthesisError('Request cancelled', 'CANCELLED');
      }
      
      throw new TryOnSynthesisError(
        err instanceof Error ? err.message : 'Unknown error',
        'UPLOAD_FAILED'
      );
    }
  }, []);
  
  /**
   * Poll job status until completion or timeout
   */
  const pollJobStatus = useCallback(async (jobId: string) => {
    if (pollingAttemptsRef.current >= resolvedConfig.maxPollingAttempts) {
      clearPolling();
      const timeoutError = 'Job processing timed out after 5 minutes';
      setError(timeoutError);
      resolvedConfig.onError(timeoutError);
      return;
    }
    
    try {
      const response = await makeApiRequest<TryOnJobStatusResponse>(
        `/api/tryon/status/${jobId}`
      );
      
      const updatedJob = response.job;
      setJob(updatedJob);
      resolvedConfig.onStatusChange(updatedJob);
      
      pollingAttemptsRef.current++;
      
      // Check terminal states
      if (updatedJob.status === 'completed') {
        clearPolling();
        setIsLoading(false);
        setError(null);
        resolvedConfig.onComplete(updatedJob);
        
      } else if (updatedJob.status === 'failed') {
        clearPolling();
        setIsLoading(false);
        const jobError = updatedJob.error || 'Job processing failed';
        setError(jobError);
        resolvedConfig.onError(jobError, updatedJob);
        
      } else if (updatedJob.status === 'cancelled') {
        clearPolling();
        setIsLoading(false);
        setError(null);
        
      } else {
        // Continue polling for pending/processing status
        pollingIntervalRef.current = setTimeout(
          () => pollJobStatus(jobId),
          resolvedConfig.pollingInterval
        );
      }
      
    } catch (err) {
      clearPolling();
      setIsLoading(false);
      
      if (err instanceof TryOnSynthesisError && err.code === 'CANCELLED') {
        return; // Don't treat cancellation as an error
      }
      
      const errorMsg = err instanceof Error ? err.message : 'Failed to check job status';
      setError(errorMsg);
      resolvedConfig.onError(errorMsg);
    }
  }, [resolvedConfig, makeApiRequest, clearPolling]);
  
  /**
   * Upload image and create processing job
   */
  const uploadImage = useCallback(async (
    blob: Blob,
    garmentId: string,
    options: TryOnProcessingOptions = {}
  ): Promise<void> => {
    // Reset state
    setJob(null);
    setError(null);
    setIsLoading(true);
    clearPolling();
    
    try {
      // Validate inputs
      if (!blob || blob.size === 0) {
        throw new TryOnSynthesisError('Invalid image blob', 'INVALID_INPUT');
      }
      
      if (!garmentId?.trim()) {
        throw new TryOnSynthesisError('Garment ID is required', 'INVALID_INPUT');
      }
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('image', blob, 'capture.png');
      formData.append('garmentId', garmentId);
      formData.append('options', JSON.stringify(options));
      
      // Upload image and create job
      const controller = new AbortController();
      abortControllerRef.current = controller;
      
      const response = await fetch('/api/tryon/upload', {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status} ${response.statusText}`);
      }
      
      const uploadResponse: TryOnUploadResponse = await response.json();
      
      if (!uploadResponse.success) {
        throw new Error(uploadResponse.error || 'Upload failed');
      }
      
      // Set initial job state
      const newJob = uploadResponse.job;
      setJob(newJob);
      resolvedConfig.onStatusChange(newJob);
      
      // Start polling if auto-polling is enabled
      if (resolvedConfig.autoStartPolling) {
        pollingAttemptsRef.current = 0;
        await pollJobStatus(newJob.jobId);
      } else {
        setIsLoading(false);
      }
      
    } catch (err) {
      setIsLoading(false);
      clearPolling();
      
      if (err instanceof TryOnSynthesisError && err.code === 'CANCELLED') {
        return; // Don't treat cancellation as an error
      }
      
      const errorMsg = err instanceof Error ? err.message : 'Upload failed';
      setError(errorMsg);
      resolvedConfig.onError(errorMsg);
      
      throw new TryOnSynthesisError(errorMsg, 'UPLOAD_FAILED');
    }
  }, [resolvedConfig, makeApiRequest, clearPolling, pollJobStatus]);
  
  /**
   * Cancel current job
   */
  const cancelJob = useCallback(async (): Promise<void> => {
    if (!job) {
      return;
    }
    
    try {
      clearPolling();
      
      await makeApiRequest(`/api/tryon/cancel/${job.jobId}`, {
        method: 'POST',
      });
      
      // Update job status locally
      setJob((prev: TryOnJob | null) => prev ? { ...prev, status: 'cancelled' } : null);
      setIsLoading(false);
      setError(null);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to cancel job';
      setError(errorMsg);
      resolvedConfig.onError(errorMsg);
    }
  }, [job, makeApiRequest, clearPolling, resolvedConfig]);
  
  /**
   * Reset hook state for new job
   */
  const reset = useCallback(() => {
    clearPolling();
    setJob(null);
    setIsLoading(false);
    setError(null);
  }, [clearPolling]);
  
  /**
   * Retry failed job
   */
  const retry = useCallback(async (): Promise<void> => {
    if (!job || job.status !== 'failed') {
      return;
    }
    
    setError(null);
    setIsLoading(true);
    pollingAttemptsRef.current = 0;
    
    // Restart polling for the same job
    await pollJobStatus(job.jobId);
  }, [job, pollJobStatus]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearPolling();
    };
  }, [clearPolling]);
  
  return {
    job,
    isLoading,
    isCompleted,
    isError,
    error,
    uploadImage,
    cancelJob,
    reset,
    retry,
  };
}

/**
 * TODO: Future enhancements
 * 
 * 1. Offline Support:
 *    - Cache jobs in localStorage for offline access
 *    - Queue uploads when offline, sync when online
 *    - Background sync for failed uploads
 * 
 * 2. Performance Optimizations:
 *    - WebWorker for image processing
 *    - Streaming upload for large images
 *    - Compression before upload
 * 
 * 3. Advanced Features:
 *    - Batch processing for multiple images
 *    - Real-time progress updates via WebSocket
 *    - Job priority queuing system
 *    - Result caching and CDN integration
 * 
 * 4. Error Recovery:
 *    - Exponential backoff for failed requests
 *    - Automatic retry with circuit breaker
 *    - Graceful degradation for slow connections
 * 
 * 5. Analytics & Monitoring:
 *    - Upload success/failure rates
 *    - Processing time metrics
 *    - User engagement tracking
 *    - Performance monitoring
 */