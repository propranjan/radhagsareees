// Load and validate environment variables first (only in local dev)
if (!process.env.VERCEL && !process.env.CI) {
  require('../lib/env');
}

import './globals.css';
import type { Metadata } from 'next';

// Force dynamic rendering for the entire app
export const dynamic = 'force-dynamic';
export const dynamicParams = true;

export const metadata: Metadata = {
  title: 'Radha G Sarees - Exquisite Collection of Traditional Sarees',
  description: 'Discover the finest collection of traditional and modern sarees at Radha G Sarees. Shop silk sarees, cotton sarees, designer sarees with virtual try-on feature.',
  keywords: 'sarees, silk sarees, cotton sarees, designer sarees, traditional wear, Indian fashion',
  authors: [{ name: 'Radha G Sarees' }],
  creator: 'Radha G Sarees',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://radhagsarees.com',
    title: 'Radha G Sarees - Exquisite Collection of Traditional Sarees',
    description: 'Discover the finest collection of traditional and modern sarees with virtual try-on feature.',
    siteName: 'Radha G Sarees',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Radha G Sarees - Exquisite Collection of Traditional Sarees',
    description: 'Discover the finest collection of traditional and modern sarees with virtual try-on feature.',
    creator: '@radhagsarees',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}