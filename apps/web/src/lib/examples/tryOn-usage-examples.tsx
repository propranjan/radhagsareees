/**
 * Example Usage: AI Saree Try-On Integration
 * Shows how to integrate try-on feature across your application
 */

// ============================================
// 1. PRODUCT PAGE INTEGRATION
// ============================================

import { AISareeTryOn } from '@/components/AISareeTryOn';
// import { useAuth } from '@clerk/nextjs'; // Uncomment if using Clerk

// Mock auth hook
const useAuth = () => ({ userId: 'user-123' });

export function SareeProductPage({ params }: { params: { sku: string } }) {
  const { userId } = useAuth();

  const product = {
    sku: 'SAREE-001',
    name: 'Royal Blue Silk Saree with Gold Border',
    price: 4999,
    image: 'https://res.cloudinary.com/your-cloud/image/upload/v1/products/SAREE-001.jpg',
    description: 'Handwoven silk saree with traditional gold zari work...',
    variants: [
      {
        id: 'default',
        name: 'Classic',
        image: 'https://res.cloudinary.com/your-cloud/image/upload/v1/saree-assets/images/SAREE-001/default/thumb.jpg',
      },
      {
        id: 'embroidered',
        name: 'Embroidered',
        image: 'https://res.cloudinary.com/your-cloud/image/upload/v1/saree-assets/images/SAREE-001/embroidered/thumb.jpg',
      },
      {
        id: 'zari-work',
        name: 'Zari Work',
        image: 'https://res.cloudinary.com/your-cloud/image/upload/v1/saree-assets/images/SAREE-001/zari-work/thumb.jpg',
      },
    ],
  };

  return (
    <div className="container mx-auto py-8">
      {/* Product Header */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Gallery */}
        {/* <ProductGallery product={product} /> */}

        {/* Details */}
        {/* <ProductDetails product={product} /> */}
      </div>

      {/* Try-On Section */}
      <div className="mb-12">
        <h2 className="text-3xl font-bold mb-8">Virtual Try-On</h2>
        <AISareeTryOn
          product={product}
          userId={userId || undefined}
          onSuccess={(result) => {
            // Track successful try-on
            // analytics.track('tryon_success', { userId, sku: product.sku, processingTime: result.processingTime });
            // toast.success('Try-on generated! Share with friends.');
            console.log('Try-on generated:', result);
          }}
        />
      </div>

      {/* Reviews & Related */}
      {/* <Reviews productId={product.sku} /> */}
      {/* <RelatedProducts category="sarees" /> */}
    </div>
  );
}

// ============================================
// 2. CHECKOUT FLOW INTEGRATION
// ============================================

// import { useCart } from '@/lib/hooks/useCart';
import { useTryOn } from '@/lib/hooks/useTryOn';

// Mock cart hook
const useCart = () => ({ items: [] });

export function CheckoutFlow() {
  const { items } = useCart();
  const { tryOnImage } = useTryOn();

  return (
    <div className="space-y-8">
      {/* Try-On Summary */}
      {tryOnImage && (
        <div className="bg-blue-50 rounded-lg p-6">
          <h3 className="font-bold text-lg mb-4">Your Try-On Preview</h3>
          <img src={tryOnImage} alt="Your try-on" className="rounded-lg max-h-96" />
          <p className="text-sm text-gray-600 mt-4">
            You can modify or regenerate this try-on before checkout.
          </p>
        </div>
      )}

      {/* Cart Items */}
      {/* <CartSummary items={items} /> */}

      {/* Checkout */}
      {/* <PaymentForm /> */}
    </div>
  );
}

// ============================================
// 3. USER DASHBOARD INTEGRATION
// ============================================

// import { useQuery } from '@tanstack/react-query';

// Mock hook
const useQuery = (config: any) => ({ data: [], isLoading: false });

export function UserTryOnHistory() {
  const { data: tryOns, isLoading } = useQuery({
    queryKey: ['tryon-history'],
    queryFn: async () => {
      const res = await fetch('/api/tryon/history');
      return res.json();
    },
  });

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">Your Try-Ons</h2>

      {isLoading ? (
        <div>Loading...</div>
      ) : tryOns?.length === 0 ? (
        <div>No try-ons yet. Generate your first one!</div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {tryOns?.map((tryOn: any) => (
            <div key={tryOn.id}>
              {/* <TryOnCard {...tryOn} /> */}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// 4. SEARCH & FILTER WITH TRY-ON PREVIEW
// ============================================

import { useState } from 'react';

export function SareeSearchResults() {
  const [selectedSaree, setSelectedSaree] = useState<string | null>(null);
  const { tryOnImage: previewImage } = useTryOn();

  const sarees = [
    {
      sku: 'SAREE-001',
      name: 'Royal Blue Silk',
      price: 4999,
      image: '...',
    },
    // ... more sarees
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Search Filters */}
      {/* <SearchFilters /> */}

      {/* Results */}
      <div className="lg:col-span-2">
        <div className="grid grid-cols-2 gap-4 mb-8">
          {sarees.map((saree) => (
            <div
              key={saree.sku}
              onClick={() => setSelectedSaree(saree.sku)}
              className={selectedSaree === saree.sku ? 'border-2 border-blue-500' : ''}
            >
              {/* <SareeCard {...saree} /> */}
            </div>
          ))}
        </div>

        {/* Quick Try-On Preview */}
        {selectedSaree && previewImage && (
          <div className="mt-8 p-6 bg-white rounded-lg shadow">
            <h3 className="font-bold mb-4">Quick Preview</h3>
            <img src={previewImage} alt="Quick preview" className="rounded" />
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// 5. MOBILE APP INTEGRATION
// ============================================

import { usePoseDetection } from '@/lib/hooks/usePoseDetection';

export function MobileTryOnFlow() {
  const {
    videoRef,
    pose,
    detectPose,
  } = usePoseDetection();

  const [cameraActive, setCameraActive] = useState<boolean>(false);

  const handleStartCamera = async () => {
    setCameraActive(true);
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user' },
    });
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  };

  const handleCapture = async () => {
    if (videoRef.current) {
      // Detect pose from live video
      const detectedPose = await detectPose(videoRef.current);

      if (detectedPose) {
        // Proceed with try-on
        console.log('Pose detected, generating try-on...');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen">
      {/* Camera Feed */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="flex-1 w-full object-cover"
      />

      {/* Controls */}
      <div className="p-4 bg-black bg-opacity-50 flex gap-4">
        {!cameraActive ? (
          <button
            onClick={handleStartCamera}
            className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-bold"
          >
            📷 Start Camera
          </button>
        ) : (
          <>
            <button
              onClick={handleCapture}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg font-bold"
            >
              ✓ Capture
            </button>
            <button
              onClick={() => setCameraActive(false)}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg font-bold"
            >
              ✕ Close
            </button>
          </>
        )}
      </div>

      {/* Pose Status */}
      {pose && (
        <div className="p-4 bg-green-100 text-green-800 text-sm">
          ✓ Pose detected with {pose.keypoints.length} keypoints
        </div>
      )}
    </div>
  );
}

// ============================================
// 6. ADMIN PANEL: MANAGE SAREE ASSETS
// ============================================

import { CloudinaryUploadManager } from '@/lib/services/cloudinary.service';

export function AdminSareeAssetManager() {
  const [uploading, setUploading] = useState<boolean>(false);
  const uploader = new CloudinaryUploadManager();

  const handleUploadSareeAssets = async (sku: string, files: {
    image: File;
    mask: File;
    overlay: File;
  }) => {
    setUploading(true);

    try {
      // Upload image
      const imageId = await uploader.uploadSareeImage(
        Buffer.from(await files.image.arrayBuffer()),
        sku,
        'default',
        'image'
      );

      // Upload mask
      const maskId = await uploader.uploadSareeImage(
        Buffer.from(await files.mask.arrayBuffer()),
        sku,
        'default',
        'mask'
      );

      // Upload overlay
      const overlayId = await uploader.uploadSareeImage(
        Buffer.from(await files.overlay.arrayBuffer()),
        sku,
        'default',
        'overlay'
      );

      // Save to database
      await fetch('/api/admin/saree-assets', {
        method: 'POST',
        body: JSON.stringify({
          sku,
          variant: 'default',
          imageUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${imageId}`,
          maskUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${maskId}`,
          overlayUrl: `https://res.cloudinary.com/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload/v1/${overlayId}`,
        }),
      });

      console.log(`Assets uploaded for SKU: ${sku}`);
      // toast.success(`Assets uploaded for SKU: ${sku}`);
    } catch (error) {
      console.error(`Upload failed:`, error);
      // toast.error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Manage Saree Assets</h2>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          const sku = formData.get('sku') as string;
          const image = formData.get('image') as File;
          const mask = formData.get('mask') as File;
          const overlay = formData.get('overlay') as File;

          handleUploadSareeAssets(sku, { image, mask, overlay });
        }}
        className="space-y-4"
      >
        <div>
          <label className="block font-bold mb-2">SKU</label>
          <input
            type="text"
            name="sku"
            placeholder="e.g., SAREE-001"
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-bold mb-2">Saree Image</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-bold mb-2">Saree Mask</label>
          <input
            type="file"
            name="mask"
            accept="image/*"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <div>
          <label className="block font-bold mb-2">Overlay Template</label>
          <input
            type="file"
            name="overlay"
            accept="image/*"
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>

        <button
          type="submit"
          disabled={uploading}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold disabled:bg-gray-400"
        >
          {uploading ? 'Uploading...' : 'Upload Assets'}
        </button>
      </form>
    </div>
  );
}

// ============================================
// 7. ANALYTICS & TRACKING
// ============================================

export function trackTryOnEvent(event: string, data: Record<string, any>) {
  // Track with your analytics provider
  // analytics.track(`tryon_${event}`, { timestamp: new Date(), ...data });
  console.log(`Event: tryon_${event}`, data);

  // Also log to database for analysis
  fetch('/api/analytics/tryon', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString(),
    }),
  }).catch(console.error);
}

// Usage:
trackTryOnEvent('started', { sku: 'SAREE-001' });
trackTryOnEvent('uploaded', { fileSize: 2048000 });
trackTryOnEvent('generated', { processingTime: 8500 });
trackTryOnEvent('shared', { platform: 'whatsapp' });
trackTryOnEvent('downloaded', { variant: 'default' });

// ============================================
// 8. ERROR HANDLING & FALLBACKS
// ============================================

// import { ErrorBoundary } from 'react-error-boundary';

function TryOnErrorFallback({ error, resetErrorBoundary }: { error: Error; resetErrorBoundary: () => void }) {
  return (
    <div className="p-6 bg-red-50 rounded-lg border border-red-200">
      <h3 className="font-bold text-red-900 mb-2">Try-On Feature Temporarily Unavailable</h3>
      <p className="text-red-700 mb-4">
        {error.message || 'An error occurred while processing your request.'}
      </p>
      <button
        onClick={resetErrorBoundary}
        className="bg-red-600 text-white px-4 py-2 rounded font-bold"
      >
        Try Again
      </button>
      <p className="text-sm text-red-600 mt-4">
        If the problem persists, please contact support or try again later.
      </p>
    </div>
  );
}

export function SafeTryOnComponent(props: any) {
  // Wrap with ErrorBoundary if using react-error-boundary
  // return (
  //   <ErrorBoundary FallbackComponent={TryOnErrorFallback}>
  //     <AISareeTryOn {...props} />
  //   </ErrorBoundary>
  // );
  return <AISareeTryOn {...props} />;
}
