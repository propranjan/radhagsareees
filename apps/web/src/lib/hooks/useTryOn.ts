/**
 * useTryOn Hook
 * Manages try-on state and API calls
 */

'use client';

import { useState, useCallback, useRef } from 'react';

interface TryOnState {
  loading: boolean;
  error: string | null;
  originalImage: string | null;
  tryOnImage: string | null;
  processingTime: number | null;
}

interface UseTryOnOptions {
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}

export function useTryOn(options: UseTryOnOptions = {}) {
  const [state, setState] = useState<TryOnState>({
    loading: false,
    error: null,
    originalImage: null,
    tryOnImage: null,
    processingTime: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * Generate try-on for selected saree
   */
  const generateTryOn = useCallback(
    async (userImageUrl: string, sku: string, variant?: string) => {
      try {
        setState(prev => ({
          ...prev,
          loading: true,
          error: null,
        }));

        // Cancel previous request if any
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }

        abortControllerRef.current = new AbortController();

        const response = await fetch('/api/tryon/generate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userImageUrl,
            sku,
            variant: variant || 'default',
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to generate try-on');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Try-on generation failed');
        }

        setState(prev => ({
          ...prev,
          loading: false,
          originalImage: result.data.originalImageUrl,
          tryOnImage: result.data.outputImageUrl,
          processingTime: result.data.processingTime,
        }));

        options.onSuccess?.(result.data);
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          return; // Request was cancelled
        }

        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setState(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }));

        options.onError?.(error instanceof Error ? error : new Error(errorMessage));
      }
    },
    [options]
  );

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setState({
      loading: false,
      error: null,
      originalImage: null,
      tryOnImage: null,
      processingTime: null,
    });
  }, []);

  /**
   * Cancel current operation
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({
      ...prev,
      loading: false,
    }));
  }, []);

  return {
    ...state,
    generateTryOn,
    reset,
    cancel,
  };
}

export default useTryOn;
