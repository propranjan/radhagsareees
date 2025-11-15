'use client';

import { useState } from 'react';
import { TryOnCanvas, useTryOnSynthesis } from '@radhagsareees/ui';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

export default function TryOnDemoPage() {
  const [modelInfo, setModelInfo] = useState<any>(null);
  const [poseState, setPoseState] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // Sample saree image URL - using a reliable CDN image
  const garmentImageUrl = 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=800&auto=format&fit=crop';

  // Try-On Synthesis Hook
  const synthesis = useTryOnSynthesis({
    onComplete: (job) => {
      console.log('✅ Try-on synthesis completed:', job.previewUrl);
      // Could update UI with processed result
    },
    onError: (error) => {
      console.error('❌ Try-on synthesis failed:', error);
      // Could show error notification
    },
    onStatusChange: (job) => {
      console.log('📊 Job status changed:', job.status, job.progress);
    }
  });

  const handleModelReady = (info: any) => {
    setModelInfo(info);
    console.log('Model loaded:', info);
  };

  const handlePoseState = (poseOk: boolean) => {
    setPoseState(poseOk);
  };

  const handleCapture = async (blob: Blob, dataUrl: string) => {
    setCapturedImage(dataUrl);
    console.log('Captured image blob:', blob);
    
    // Upload to synthesis API for enhanced processing
    try {
      await synthesis.uploadImage(blob, 'saree-demo-001', {
        quality: 0.9,
        format: 'png',
        enableAdvancedWarping: true,
        priority: 'high'
      });
    } catch (error) {
      console.error('Failed to start synthesis:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Virtual Saree Try-On
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Experience our cutting-edge AI-powered virtual try-on technology. 
            See how beautiful sarees look on you in real-time with interactive controls.
          </p>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Try-On Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl p-6">
              <h2 className="text-2xl font-semibold mb-4 text-gray-900">
                Live Try-On Experience
              </h2>
              
              <TryOnCanvas
                garmentImageUrl={garmentImageUrl}
                onReady={handleModelReady}
                onPoseState={handlePoseState}
                onCapture={handleCapture}
                width={640}
                height={480}
                debug={false}
                className="w-full max-w-2xl mx-auto"
              />
            </div>
          </div>

          {/* Status Panel */}
          <div className="space-y-6">
            {/* Model Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                AI Model Status
              </h3>
              {modelInfo ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <span className="font-medium text-green-600">
                      {modelInfo.name}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <span className="font-medium">{modelInfo.version}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Resolution:</span>
                    <span className="font-medium">
                      {modelInfo.inputSize[0]}×{modelInfo.inputSize[1]}
                    </span>
                  </div>
                  <div className="mt-3 p-2 bg-green-50 border border-green-200 rounded-lg">
                    <span className="text-green-700 text-sm font-medium">
                      ✓ Model Ready
                    </span>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <span className="text-yellow-700 text-sm">
                    Loading AI model...
                  </span>
                </div>
              )}
            </div>

            {/* Pose Detection Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Pose Detection
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${poseState ? 'text-green-600' : 'text-red-600'}`}>
                    {poseState ? 'Person Detected' : 'No Person'}
                  </span>
                </div>
                <div className={`p-3 rounded-lg ${poseState ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} border`}>
                  <span className={`text-sm font-medium ${poseState ? 'text-green-700' : 'text-red-700'}`}>
                    {poseState ? '✓ Ready for overlay' : '⚠ Position yourself in frame'}
                  </span>
                </div>
              </div>
            </div>

            {/* Synthesis Status */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                AI Synthesis Status
              </h3>
              {synthesis.job ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Job ID:</span>
                    <span className="font-mono text-sm text-gray-500">
                      {synthesis.job.jobId.slice(0, 8)}...
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className={`font-medium capitalize ${
                      synthesis.job.status === 'completed' ? 'text-green-600' :
                      synthesis.job.status === 'failed' ? 'text-red-600' :
                      synthesis.job.status === 'processing' ? 'text-blue-600' :
                      'text-yellow-600'
                    }`}>
                      {synthesis.job.status}
                    </span>
                  </div>
                  
                  {synthesis.job.progress !== undefined && (
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Progress:</span>
                        <span className="font-medium">{synthesis.job.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${synthesis.job.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  
                  {synthesis.job.estimatedTimeRemaining && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">ETA:</span>
                      <span className="font-medium">{synthesis.job.estimatedTimeRemaining}s</span>
                    </div>
                  )}
                  
                  {synthesis.isCompleted && synthesis.job.previewUrl && (
                    <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-green-700 text-sm font-medium">
                          ✓ Processing Complete
                        </span>
                        <button
                          onClick={() => window.open(synthesis.job.previewUrl, '_blank')}
                          className="text-green-600 hover:text-green-700 text-sm underline"
                        >
                          View Result
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {synthesis.isError && (
                    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <div className="flex items-center justify-between">
                        <span className="text-red-700 text-sm font-medium">
                          ❌ Processing Failed
                        </span>
                        <button
                          onClick={synthesis.retry}
                          className="text-red-600 hover:text-red-700 text-sm underline"
                        >
                          Retry
                        </button>
                      </div>
                      {synthesis.error && (
                        <p className="text-red-600 text-xs mt-2">{synthesis.error}</p>
                      )}
                    </div>
                  )}
                  
                  {synthesis.isLoading && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={synthesis.cancelJob}
                        className="flex-1 px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 text-sm font-medium"
                      >
                        Cancel Job
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <span className="text-gray-600 text-sm">
                    No active synthesis job. Capture an image to start processing.
                  </span>
                </div>
              )}
            </div>

            {/* Controls Guide */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-900">
                Keyboard Controls
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">↑↓←→</kbd>
                  <span className="text-gray-600">Move garment</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">+/-</kbd>
                  <span className="text-gray-600">Scale</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">R</kbd>
                  <span className="text-gray-600">Rotate</span>
                </div>
                <div className="flex justify-between">
                  <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Space</kbd>
                  <span className="text-gray-600">Capture</span>
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  Hold Shift for faster adjustments
                </div>
              </div>
            </div>

            {/* Captured Image */}
            {capturedImage && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">
                  Latest Capture
                </h3>
                <img
                  src={capturedImage}
                  alt="Captured try-on"
                  className="w-full rounded-lg border"
                />
                <button
                  onClick={() => {
                    const link = document.createElement('a');
                    link.download = `saree-tryon-${Date.now()}.jpg`;
                    link.href = capturedImage;
                    link.click();
                  }}
                  className="mt-3 w-full px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-colors"
                >
                  Download Image
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Technology Features */}
        <div className="mt-12 bg-white rounded-2xl shadow-xl p-8">
          <h2 className="text-2xl font-bold text-center mb-8 text-gray-900">
            Advanced AI Technology
          </h2>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Real-time Segmentation</h3>
              <p className="text-gray-600 text-sm">
                TensorFlow.js BodyPix accurately identifies your body shape for precise garment fitting
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-secondary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Interactive Controls</h3>
              <p className="text-gray-600 text-sm">
                Adjust position, scale, rotation, and opacity with intuitive sliders and keyboard shortcuts
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">High-Quality Capture</h3>
              <p className="text-gray-600 text-sm">
                Save professional-quality images of your virtual try-on for sharing or purchasing decisions
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}