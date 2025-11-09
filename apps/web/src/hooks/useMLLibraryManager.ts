/**
 * Custom hook for ML library management with analytics
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMLLibraries } from '../lib/performance/lazy-loading';
import { useTryOn } from '../contexts/TryOnContext';
import { useProduct } from '../contexts/ProductContext';

interface MLLibraryState {
  isLoaded: boolean;
  isLoading: boolean;
  error: string | null;
  progress: number;
}

interface MLLibraryActions {
  loadLibraries: () => Promise<void>;
  preloadLibraries: () => void;
  retryLoad: () => Promise<void>;
}

export function useMLLibraryManager(): MLLibraryState & MLLibraryActions {
  const mlState = useMLLibraries();
  const { setMLLibrariesLoaded, setMLLoading, setMLError } = useTryOn();
  const { product } = useProduct();
  
  // Sync ML state with TryOn context
  useEffect(() => {
    setMLLibrariesLoaded(mlState.isLoaded);
    setMLLoading(mlState.isLoading);
    setMLError(mlState.error ? mlState.error.message : null);
  }, [mlState.isLoaded, mlState.isLoading, mlState.error, setMLLibrariesLoaded, setMLLoading, setMLError]);

  const loadLibraries = useCallback(async () => {
    if (mlState.isLoaded) return;

    const startTime = performance.now();
    
    try {
      await mlState.loadLibraries();
      
      const loadTime = performance.now() - startTime;
      console.log(`ML libraries loaded in ${loadTime.toFixed(2)}ms`);

      // Track loading performance
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ml_libraries_loaded', {
          custom_parameter_load_time: loadTime,
          custom_parameter_trigger: 'tryon_modal_open',
          custom_parameter_product_id: product?.id,
        });
      }
    } catch (error) {
      console.error('Failed to load ML libraries:', error);
      
      // Track loading error
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'ml_libraries_error', {
          custom_parameter_error: error instanceof Error ? error.message : 'Unknown error',
          custom_parameter_trigger: 'tryon_modal_open',
          custom_parameter_product_id: product?.id,
        });
      }
    }
  }, [mlState, product?.id]);

  const preloadLibraries = useCallback(() => {
    mlState.preload();
  }, [mlState]);

  const retryLoad = useCallback(async () => {
    setMLError(null);
    await loadLibraries();
  }, [loadLibraries, setMLError]);

  return {
    isLoaded: mlState.isLoaded,
    isLoading: mlState.isLoading,
    error: mlState.error ? mlState.error.message : null,
    progress: mlState.progress,
    loadLibraries,
    preloadLibraries,
    retryLoad,
  };
}