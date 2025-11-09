// Load and validate environment variables first
import '../lib/env';

import './globals.css';
import { Inter, Playfair_Display } from 'next/font/google';
import { Metadata } from 'next';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
});

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
    <html lang="en" className={`${inter.variable} ${playfair.variable}`}>
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {children}
        </div>
      </body>
    </html>
  );
}