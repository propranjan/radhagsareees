'use client';

import { useEffect } from 'react';

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
        <div style={{
          minHeight: '100vh',
          background: 'linear-gradient(to bottom, #f9fafb, white)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1rem'
        }}>
          <div style={{
            maxWidth: '28rem',
            width: '100%',
            textAlign: 'center'
          }}>
            <div style={{ marginBottom: '2rem' }}>
              <h1 style={{
                fontSize: '2rem',
                fontWeight: 'bold',
                color: '#111827',
                marginBottom: '0.5rem'
              }}>
                Application Error
              </h1>
              <p style={{
                color: '#6b7280',
                marginBottom: '0.5rem'
              }}>
                We encountered a critical error. Please try reloading the page.
              </p>
              {error.digest && (
                <p style={{
                  fontSize: '0.875rem',
                  color: '#9ca3af',
                  fontFamily: 'monospace'
                }}>
                  Error ID: {error.digest}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                onClick={reset}
                style={{
                  width: '100%',
                  backgroundColor: '#9333ea',
                  color: 'white',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  border: 'none',
                  cursor: 'pointer'
                }}
              >
                Reload Application
              </button>

              <a
                href="/"
                style={{
                  display: 'block',
                  width: '100%',
                  border: '1px solid #d1d5db',
                  color: '#374151',
                  padding: '0.75rem 1.5rem',
                  borderRadius: '0.5rem',
                  fontWeight: '500',
                  textDecoration: 'none'
                }}
              >
                Go to Homepage
              </a>
            </div>

            <div style={{
              marginTop: '2rem',
              fontSize: '0.875rem',
              color: '#6b7280'
            }}>
              If this problem persists, please{' '}
              <a
                href="mailto:support@radhagsarees.com"
                style={{
                  color: '#9333ea',
                  textDecoration: 'underline'
                }}
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
