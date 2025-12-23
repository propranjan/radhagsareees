'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the TryOnModal to avoid loading TensorFlow on initial page load
// This significantly improves LCP and TTI metrics
const TryOnModal = dynamic(
  () => import('./TryOnModal').then(mod => ({ default: mod.TryOnModal })),
  {
    loading: () => (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-xl p-8 flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <p className="text-gray-600">Loading Virtual Try-On...</p>
        </div>
      </div>
    ),
    ssr: false, // TensorFlow.js requires browser APIs
  }
);

export { TryOnModal as DynamicTryOnModal };
