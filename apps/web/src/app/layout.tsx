// Load and validate environment variables first (only in local dev)
if (!process.env.VERCEL && !process.env.CI) {
  require('../lib/env');
}

import './globals.css';
import type { Metadata, Viewport } from 'next';
import { Inter, Playfair_Display } from 'next/font/google';
import FeatureFlagAppWrapper from '../components/feature-flags/FeatureFlagAppWrapper';

// Optimized font loading with display swap for better LCP
const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
  preload: true,
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-playfair',
  preload: true,
});

// Viewport configuration for mobile optimization
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#7c3aed',
};

export const metadata: Metadata = {
  title: 'Radha G Sarees - Exquisite Collection of Traditional Sarees',
  description: 'Discover the finest collection of traditional and modern sarees at Radha G Sarees. Shop silk sarees, cotton sarees, designer sarees with virtual try-on feature.',
  keywords: 'sarees, silk sarees, cotton sarees, designer sarees, traditional wear, Indian fashion',
  authors: [{ name: 'Radha G Sarees' }],
  creator: 'Radha G Sarees',
  metadataBase: new URL('https://radhagsarees.com'),
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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster resource loading */}
        <link rel="preconnect" href="https://res.cloudinary.com" />
        <link rel="preconnect" href="https://images.unsplash.com" />
        <link rel="dns-prefetch" href="https://res.cloudinary.com" />
        <link rel="dns-prefetch" href="https://images.unsplash.com" />
      </head>
      <body className={`${inter.className} antialiased`} suppressHydrationWarning>
        <FeatureFlagAppWrapper>
          {children}
        </FeatureFlagAppWrapper>
      </body>
    </html>
  );
}