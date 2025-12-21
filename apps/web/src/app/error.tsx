"use client";

import { useEffect } from 'react';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // Log the error to the console for debugging
    console.error('App Error:', error);
  }, [error]);

  return (
    <div style={{ display: 'flex', minHeight: '60vh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center', padding: '1.5rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Something went wrong</h1>
        {error?.message && (
          <p style={{ marginTop: '0.5rem', color: '#666', maxWidth: '400px' }}>{error.message}</p>
        )}
        {error?.digest ? (
          <p style={{ marginTop: '0.5rem', color: '#666' }}>Error ID: {error.digest}</p>
        ) : null}
        <button onClick={() => reset()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', borderRadius: 6, background: '#111827', color: '#fff' }}>
          Try again
        </button>
      </div>
    </div>
  );
}
