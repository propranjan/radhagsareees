'use client';

import { useEffect } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Global error boundary caught:', error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white flex items-center justify-center px-4">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-red-600" />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Application Error
              </h1>
              <p className="text-gray-600 mb-2">
                We encountered a critical error. Please try reloading the page.
              </p>
              {error.digest && (
                <p className="text-sm text-gray-500 font-mono">
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <button
                onClick={reset}
                className="inline-flex items-center justify-center gap-2 w-full bg-purple-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <RefreshCw className="w-5 h-5" />
                Reload Application
              </button>

              <a
                href="/"
                className="inline-flex items-center justify-center gap-2 w-full border border-gray-300 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-50 transition-colors"
              >
                Go to Homepage
              </a>
            </div>

            <div className="mt-8 text-sm text-gray-500">
              If this problem persists, please{' '}
              <a
                href="mailto:support@radhagsarees.com"
                className="text-purple-600 hover:text-purple-700 underline"
              >
                contact support
              </a>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}
