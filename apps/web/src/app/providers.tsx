'use client';

import { ReactNode } from 'react';

/**
 * Client-side providers wrapper
 * This component wraps all client-side context providers
 * to prevent prerender errors during build
 */
export function Providers({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
