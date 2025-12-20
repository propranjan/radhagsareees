'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useEffect } from 'react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams?.get('error') || 'unknown_error';
  const message = searchParams?.get('message') || 'An authentication error occurred';

  useEffect(() => {
    console.error('Auth error page:', { error, message });
  }, [error, message]);

  // User-friendly error messages
  const getErrorMessage = () => {
    if (error.includes('provider') || message.includes('provider')) {
      return 'OAuth provider not configured. Please contact support or try email/password login.';
    }
    if (error === 'access_denied') {
      return 'You denied access to the application. Please try again if you want to sign in.';
    }
    if (error === 'missing_code') {
      return 'Authentication failed. The authorization code was missing.';
    }
    if (error === 'server_error') {
      return 'Server configuration error. Please contact support.';
    }
    return message || 'An unexpected authentication error occurred.';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-red-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Authentication Error
        </h1>
        
        <p className="text-gray-600 mb-4">
          {getErrorMessage()}
        </p>
        
        <details className="text-left mb-6 p-3 bg-gray-50 rounded">
          <summary className="cursor-pointer text-sm font-medium text-gray-700">
            Technical Details
          </summary>
          <div className="mt-2 text-xs text-gray-600 space-y-1">
            <p><span className="font-medium">Error Code:</span> {error}</p>
            {message && <p><span className="font-medium">Message:</span> {message}</p>}
          </div>
        </details>
        
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors"
          >
            Try Again
          </Link>
          
          <Link
            href="/"
            className="block w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}
