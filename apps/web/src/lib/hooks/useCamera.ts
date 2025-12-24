/**
 * useCamera Hook
 * Manages camera access and photo capture functionality
 */

'use client';

import { useRef, useState, useCallback } from 'react';

export interface UseCameraOptions {
  onCapture?: (imageData: Blob) => void;
  onError?: (error: Error) => void;
}

export function useCamera(options: UseCameraOptions = {}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  /**
   * Start camera stream
   */
  const startCamera = useCallback(async () => {
    try {
      setError(null);

      // Check for camera permissions
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Camera access not supported in this browser');
      }

      // Request camera access
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;

      // Attach stream to video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch((err) => {
          console.warn('Error playing video:', err);
        });
      }

      setCameraActive(true);
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      setError(error.message);
      options.onError?.(error);
      console.error('Camera access error:', err);
    }
  }, [options]);

  /**
   * Stop camera stream
   */
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }, []);

  /**
   * Capture photo from camera
   */
  const capturePhoto = useCallback(async (): Promise<Blob | null> => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        throw new Error('Camera or canvas not available');
      }

      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) {
        throw new Error('Canvas context not available');
      }

      // Set canvas dimensions to match video
      canvas.width = videoRef.current.videoWidth || 1280;
      canvas.height = videoRef.current.videoHeight || 720;

      if (canvas.width === 0 || canvas.height === 0) {
        throw new Error('Video not ready - please wait for camera to load');
      }

      // Draw video frame to canvas
      context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

      // Convert canvas to blob
      return new Promise((resolve, reject) => {
        canvas.toBlob(
          (blob) => {
            if (blob) {
              console.log('Photo captured successfully:', blob.size, 'bytes');
              options.onCapture?.(blob);
              resolve(blob);
            } else {
              reject(new Error('Failed to capture photo - blob is null'));
            }
          },
          'image/jpeg',
          0.95
        );
      });
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      console.error('Capture photo error:', error);
      setError(error.message);
      options.onError?.(error);
      return null;
    }
  }, [options]);

  /**
   * Switch camera (front/back on mobile)
   */
  const switchCamera = useCallback(async () => {
    try {
      stopCamera();

      const constraints = {
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      // If back camera not available, try front camera again
      await startCamera();
    }
  }, [stopCamera, startCamera]);

  return {
    videoRef,
    canvasRef,
    cameraActive,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
  };
}
