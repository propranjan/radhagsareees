/**
 * useImageUpload Hook
 * Manages user image upload to Cloudinary
 */

'use client';

import { useState, useCallback, useRef } from 'react';

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseImageUploadOptions {
  onSuccess?: (uploadedUrl: string, publicId: string) => void;
  onError?: (error: Error) => void;
  onProgress?: (progress: UploadProgress) => void;
}

export function useImageUpload(options: UseImageUploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress>({
    loaded: 0,
    total: 0,
    percentage: 0,
  });
  const [error, setError] = useState<string | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  /**
   * Upload image to Cloudinary (client-side)
   */
  const uploadImage = useCallback(
    async (file: File): Promise<{ url: string; publicId: string } | null> => {
      try {
        setUploading(true);
        setError(null);

        // Get upload signature from API
        const signatureResponse = await fetch('/api/cloudinary/signature', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            folder: 'saree-tryon/user-images',
          }),
        });

        if (!signatureResponse.ok) {
          throw new Error('Failed to get upload signature');
        }

        const { signature, timestamp, apiKey, cloudName } = await signatureResponse.json();

        // Prepare FormData
        const formData = new FormData();
        formData.append('file', file);
        formData.append('api_key', apiKey);
        formData.append('timestamp', timestamp.toString());
        formData.append('signature', signature);
        formData.append('folder', 'saree-tryon/user-images');
        formData.append('tags', 'user-upload');
        formData.append('resource_type', 'auto');

        // Upload with progress tracking
        return await new Promise((resolve, reject) => {
          const xhr = new XMLHttpRequest();
          xhrRef.current = xhr;

          // Progress events
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progressData = {
                loaded: e.loaded,
                total: e.total,
                percentage: Math.round((e.loaded / e.total) * 100),
              };
              setProgress(progressData);
              options.onProgress?.(progressData);
            }
          });

          // Success
          xhr.addEventListener('load', () => {
            if (xhr.status === 200) {
              const response = JSON.parse(xhr.responseText);
              setUploading(false);
              options.onSuccess?.(response.secure_url, response.public_id);
              resolve({ url: response.secure_url, publicId: response.public_id });
            } else {
              const errorMsg = `Upload failed with status ${xhr.status}`;
              setError(errorMsg);
              setUploading(false);
              reject(new Error(errorMsg));
            }
          });

          // Error
          xhr.addEventListener('error', () => {
            const errorMsg = 'Upload error occurred';
            setError(errorMsg);
            setUploading(false);
            options.onError?.(new Error(errorMsg));
            reject(new Error(errorMsg));
          });

          // Abort
          xhr.addEventListener('abort', () => {
            setUploading(false);
          });

          // Send request
          xhr.open('POST', `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`);
          xhr.send(formData);
        });
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Upload failed';
        setError(errorMessage);
        setUploading(false);
        options.onError?.(err instanceof Error ? err : new Error(errorMessage));
        return null;
      }
    },
    [options]
  );

  /**
   * Cancel upload
   */
  const cancel = useCallback(() => {
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
    setUploading(false);
  }, []);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    setUploading(false);
    setProgress({ loaded: 0, total: 0, percentage: 0 });
    setError(null);
  }, []);

  return {
    uploadImage,
    uploading,
    progress,
    error,
    cancel,
    reset,
  };
}

export default useImageUpload;
