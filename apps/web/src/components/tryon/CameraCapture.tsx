'use client';

import React, { useState } from 'react';
import { useCamera } from '@/lib/hooks/useCamera';
import { Camera, X, Maximize2, RotateCw, Loader } from 'lucide-react';

interface CameraCaptureProps {
  onPhotoCapture: (blob: Blob) => void;
  onClose: () => void;
}

export default function CameraCapture({
  onPhotoCapture,
  onClose,
}: CameraCaptureProps) {
  const {
    videoRef,
    canvasRef,
    cameraActive,
    error,
    startCamera,
    stopCamera,
    capturePhoto,
    switchCamera,
  } = useCamera({
    onCapture: onPhotoCapture,
  });

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  React.useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  const handleCapture = async () => {
    try {
      console.log('Starting photo capture...');
      setIsCapturing(true);
      const blob = await capturePhoto();
      console.log('Capture returned blob:', blob);
      
      if (blob) {
        console.log('Photo captured, closing camera modal');
        await new Promise(resolve => setTimeout(resolve, 500)); // Small delay for state update
        onClose();
      } else {
        console.error('Capture returned null blob');
        setIsCapturing(false);
      }
    } catch (error) {
      console.error('Capture error:', error);
      setIsCapturing(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 ${isFullscreen ? '' : 'p-4'}`}>
      <div className={`${isFullscreen ? 'w-full h-full' : 'w-full max-w-lg rounded-lg overflow-hidden'} bg-black flex flex-col`}>
        {/* Header */}
        <div className="bg-gray-900 px-4 py-3 flex items-center justify-between">
          <h3 className="text-white font-semibold">Capture Photo</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 hover:bg-gray-800 rounded text-white transition-colors"
              title="Toggle fullscreen"
            >
              <Maximize2 className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Camera Feed */}
        <div className="flex-1 relative bg-black">
          {error ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <p className="text-red-500 font-semibold mb-2">Camera Error</p>
                <p className="text-gray-300 text-sm mb-4">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
                >
                  Reload Page
                </button>
              </div>
            </div>
          ) : cameraActive ? (
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                <p className="text-gray-300">Requesting camera access...</p>
              </div>
            </div>
          )}

          {/* Hidden Canvas for Capture */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Overlay Grid */}
          {cameraActive && (
            <div className="absolute inset-0 pointer-events-none">
              {/* Rule of thirds grid */}
              <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="border border-white border-opacity-10" />
                ))}
              </div>

              {/* Center circle guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-48 h-48 rounded-full border-2 border-white border-opacity-30" />
              </div>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="bg-gray-900 px-4 py-4 flex gap-3 justify-center items-center">
          {cameraActive && (
            <>
              <button
                onClick={switchCamera}
                disabled={isCapturing}
                className={`p-2 rounded-full transition-colors ${
                  isCapturing
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-gray-800 hover:bg-gray-700 text-white'
                }`}
                title="Switch camera"
              >
                <RotateCw className="w-5 h-5" />
              </button>

              <button
                onClick={handleCapture}
                disabled={isCapturing}
                className={`px-8 py-3 font-semibold rounded-lg transition-colors flex items-center gap-2 ${
                  isCapturing
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                {isCapturing ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Camera className="w-5 h-5" />
                    Capture
                  </>
                )}
              </button>

              <button
                onClick={stopCamera}
                disabled={isCapturing}
                className={`px-6 py-3 font-semibold rounded-lg transition-colors ${
                  isCapturing
                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                Cancel
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
