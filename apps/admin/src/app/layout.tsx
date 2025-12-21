// Load and validate environment variables first
import '../lib/env';

import './globals.css';
import { Inter } from 'next/font/google';
import { AuthProvider } from '@/components/AuthProvider';

const inter = Inter({ subsets: ['latin'] });

export const metadata = {
  title: 'Radha G Sarees - Admin Dashboard',
  description: 'Manage inventory, orders, and analytics for Radha G Sarees',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <div className="min-h-screen bg-gray-100">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}