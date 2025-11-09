export { ProductCard } from './components/ProductCard';
export { RatingStars } from './components/RatingStars';
export { TryOnCanvas } from './components/TryOnCanvas';
export { ReviewList } from './components/ReviewList';
export { cn } from './lib/utils';

// Export quality scoring functions for testing and external use
export { 
  getQualityScore, 
  calculateFaceVisibility, 
  isSkinTone,
  type QualityScore 
} from './lib/qualityScoring';

// Export try-on synthesis hook
export { useTryOnSynthesis } from './hooks/useTryOnSynthesis';

// Export all try-on synthesis types
export type {
  TryOnJob,
  TryOnJobStatus,
  TryOnUploadRequest,
  TryOnProcessingOptions,
  TryOnUploadResponse,
  TryOnJobStatusResponse,
  TryOnSynthesisHook,
  TryOnSynthesisConfig,
} from './types/tryon.d';

export { TryOnSynthesisError } from './types/tryon.d';