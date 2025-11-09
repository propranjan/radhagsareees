/**
 * Lazy Loading Manager for ML Libraries
 * Only loads TensorFlow.js and BodyPix when TryOn modal is opened
 */

import React from 'react';
import { performanceConfig } from './config';

export interface MLLibraries {
  tf?: any; // Dynamic import type
  bodyPix?: any; // Dynamic import type
}

export interface LoadingState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  progress: number;
}

/**
 * ML Library Lazy Loader
 */
export class MLLibraryLoader {
  private static instance: MLLibraryLoader;
  private libraries: MLLibraries = {};
  private loadingState: LoadingState = {
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0
  };
  private loadingPromise: Promise<MLLibraries> | null = null;
  private listeners: Array<(state: LoadingState) => void> = [];

  static getInstance(): MLLibraryLoader {
    if (!MLLibraryLoader.instance) {
      MLLibraryLoader.instance = new MLLibraryLoader();
    }
    return MLLibraryLoader.instance;
  }

  /**
   * Get current loading state
   */
  getState(): LoadingState {
    return { ...this.loadingState };
  }

  /**
   * Subscribe to loading state changes
   */
  subscribe(listener: (state: LoadingState) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Update loading state and notify listeners
   */
  private updateState(updates: Partial<LoadingState>) {
    this.loadingState = { ...this.loadingState, ...updates };
    this.listeners.forEach(listener => listener(this.loadingState));
  }

  /**
   * Check if libraries are already loaded
   */
  isLoaded(): boolean {
    return this.loadingState.isLoaded && this.libraries.tf && this.libraries.bodyPix;
  }

  /**
   * Get loaded libraries (if available)
   */
  getLibraries(): MLLibraries | null {
    if (this.isLoaded()) {
      return this.libraries;
    }
    return null;
  }

  /**
   * Preload libraries without blocking
   */
  async preload(): Promise<void> {
    if (this.isLoaded() || this.loadingState.isLoading) {
      return;
    }

    // Start loading in background
    this.loadLibraries().catch(console.error);
  }

  /**
   * Load ML libraries on demand
   */
  async loadLibraries(): Promise<MLLibraries> {
    // Return existing promise if already loading
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    // Return cached libraries if already loaded
    if (this.isLoaded()) {
      return this.libraries;
    }

    this.updateState({
      isLoading: true,
      error: null,
      progress: 0
    });

    this.loadingPromise = this.performLoad();
    
    try {
      const libraries = await this.loadingPromise;
      this.libraries = libraries;
      
      this.updateState({
        isLoading: false,
        isLoaded: true,
        progress: 100
      });
      
      return libraries;
    } catch (error) {
      this.updateState({
        isLoading: false,
        error: error as Error,
        progress: 0
      });
      
      this.loadingPromise = null;
      throw error;
    }
  }

  /**
   * Perform the actual loading with progress tracking
   */
  private async performLoad(): Promise<MLLibraries> {
    const startTime = performance.now();
    
    try {
      // Load TensorFlow.js first (largest dependency)
      this.updateState({ progress: 10 });
      
      const [tfModule] = await Promise.all([
        import('@tensorflow/tfjs').catch(err => {
          console.error('Failed to load TensorFlow.js:', err);
          throw new Error('Failed to load TensorFlow.js');
        })
      ]);
      
      this.updateState({ progress: 40 });
      
      // Initialize TensorFlow backend
      await tfModule.ready();
      
      this.updateState({ progress: 60 });
      
      // Load BodyPix model
      const [bodyPixModule] = await Promise.all([
        import('@tensorflow-models/body-pix').catch(err => {
          console.error('Failed to load BodyPix:', err);
          throw new Error('Failed to load BodyPix model');
        })
      ]);
      
      this.updateState({ progress: 80 });
      
      // Load the actual BodyPix model
      const bodyPixModel = await bodyPixModule.load({
        architecture: 'MobileNetV1',
        outputStride: 16,
        multiplier: 0.75, // Smaller model for better performance
        quantBytes: 2
      });
      
      this.updateState({ progress: 95 });
      
      const loadTime = performance.now() - startTime;
      console.log(`ML libraries loaded in ${loadTime.toFixed(2)}ms`);
      
      // Track performance
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ml_library_load_time', {
          custom_parameter_duration: loadTime,
          custom_parameter_library: 'tensorflow_bodypix'
        });
      }
      
      return {
        tf: tfModule,
        bodyPix: { ...bodyPixModule, model: bodyPixModel }
      };
      
    } catch (error) {
      console.error('ML library loading failed:', error);
      
      // Track loading failure
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'ml_library_load_error', {
          custom_parameter_error: (error as Error).message
        });
      }
      
      throw error;
    }
  }

  /**
   * Unload libraries to free memory
   */
  async unload(): Promise<void> {
    if (this.libraries.tf) {
      // Dispose of TensorFlow resources
      this.libraries.tf.disposeVariables();
      
      // Clear GPU memory if using WebGL backend
      if (this.libraries.tf.getBackend() === 'webgl') {
        const webglBackend = this.libraries.tf.backend() as any;
        if (webglBackend && typeof webglBackend.dispose === 'function') {
          webglBackend.dispose();
        }
      }
    }
    
    this.libraries = {};
    this.loadingPromise = null;
    
    this.updateState({
      isLoading: false,
      isLoaded: false,
      error: null,
      progress: 0
    });
    
    console.log('ML libraries unloaded');
  }
}

/**
 * React Hook for ML Library Loading
 */
export function useMLLibraries() {
  const [state, setState] = React.useState<LoadingState>(() => 
    MLLibraryLoader.getInstance().getState()
  );

  React.useEffect(() => {
    const loader = MLLibraryLoader.getInstance();
    const unsubscribe = loader.subscribe(setState);
    
    return unsubscribe;
  }, []);

  const loadLibraries = React.useCallback(async () => {
    const loader = MLLibraryLoader.getInstance();
    return loader.loadLibraries();
  }, []);

  const preload = React.useCallback(() => {
    const loader = MLLibraryLoader.getInstance();
    loader.preload();
  }, []);

  const getLibraries = React.useCallback(() => {
    const loader = MLLibraryLoader.getInstance();
    return loader.getLibraries();
  }, []);

  return {
    ...state,
    loadLibraries,
    preload,
    getLibraries,
    isAvailable: state.isLoaded
  };
}

/**
 * Component Lazy Loading Manager
 */
export class ComponentLazyLoader {
  private static cache = new Map<string, React.ComponentType<any>>();
  
  /**
   * Lazy load TryOn components only when needed
   */
  static async loadTryOnComponents() {
    const components = await Promise.all([
      import('@radhagsareees/ui').then(m => ({ TryOnCanvas: m.TryOnCanvas })),
      import('../../components/TryOnModal').then(m => ({ TryOnModal: m.TryOnModal }))
    ]);
    
    return components.reduce((acc, comp) => ({ ...acc, ...comp }), {});
  }
  
  /**
   * Load analytics components lazily
   */
  static async loadAnalyticsComponents() {
    const [gtag, hotjar] = await Promise.all([
      import('../../lib/analytics/gtag').catch(() => null),
      import('../../lib/analytics/hotjar').catch(() => null)
    ]);
    
    return { gtag, hotjar };
  }
  
  /**
   * Generic component lazy loader with caching
   */
  static async loadComponent<T = any>(
    importFn: () => Promise<{ default: React.ComponentType<T> }>,
    key: string
  ): Promise<React.ComponentType<T>> {
    if (this.cache.has(key)) {
      return this.cache.get(key)!;
    }
    
    const module = await importFn();
    const Component = module.default;
    
    this.cache.set(key, Component);
    return Component;
  }
}

/**
 * Performance-aware resource loader
 */
export class ResourceLoader {
  /**
   * Load resources based on network conditions
   */
  static async loadBasedOnConnection() {
    const connection = (navigator as any).connection;
    
    if (!connection) {
      // No connection info available, load normally
      return this.loadStandardResources();
    }
    
    const { effectiveType, downlink, rtt } = connection;
    
    // Adjust loading strategy based on connection
    if (effectiveType === '4g' && downlink > 2) {
      // Fast connection - can preload more
      await this.loadStandardResources();
      MLLibraryLoader.getInstance().preload(); // Preload ML libraries
    } else if (effectiveType === '3g' || (effectiveType === '4g' && downlink <= 2)) {
      // Medium connection - load on demand only
      await this.loadCriticalResources();
    } else {
      // Slow connection - minimal loading
      await this.loadMinimalResources();
    }
  }
  
  private static async loadStandardResources() {
    // Load all standard resources
    return ComponentLazyLoader.loadAnalyticsComponents();
  }
  
  private static async loadCriticalResources() {
    // Load only critical resources
    return Promise.resolve();
  }
  
  private static async loadMinimalResources() {
    // Load absolute minimum
    return Promise.resolve();
  }
}

// Export singleton instance for convenience
export const mlLoader = MLLibraryLoader.getInstance();

// React is imported at top of file