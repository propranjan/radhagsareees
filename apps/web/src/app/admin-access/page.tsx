'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Lock, Shield, ExternalLink } from 'lucide-react';

export default function AdminAccessPage() {
  const router = useRouter();
  const [showCredentials, setShowCredentials] = useState(false);

  const ADMIN_CREDENTIALS = {
    email: 'propranjan@gmail.com',
    password: 'HCORE721649_of',
  };

  const ADMIN_URL = process.env.NEXT_PUBLIC_ADMIN_URL || 'http://localhost:3001';

  const handleAccessAdmin = () => {
    // Open admin app in new tab
    window.open(ADMIN_URL, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Navigation */}
      <nav className="border-b border-purple-500/20 bg-slate-900/50 backdrop-blur">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
            Radha G Sarees
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/catalog" className="text-slate-300 hover:text-white transition">
              Shop
            </Link>
            <Link href="/" className="text-slate-300 hover:text-white transition">
              Home
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-purple-500/20 rounded-full border border-purple-500/30">
                <Shield className="w-12 h-12 text-purple-400" />
              </div>
            </div>
            <h1 className="text-4xl font-bold text-white">Admin Dashboard</h1>
            <p className="text-lg text-slate-300">
              Access the Radha G Sarees administration panel to manage products, orders, and inventory.
            </p>
          </div>

          {/* Admin Access Card */}
          <div className="bg-slate-800/50 border border-purple-500/30 rounded-xl p-8 space-y-6">
            {/* Status */}
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/30 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <p className="text-green-200 font-medium">Admin Dashboard is Online</p>
            </div>

            {/* Access Button */}
            <button
              onClick={handleAccessAdmin}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white font-semibold rounded-lg transition transform hover:scale-105 flex items-center justify-center gap-2 group"
            >
              <ExternalLink className="w-5 h-5 group-hover:translate-x-1 transition" />
              Access Admin Dashboard
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition" />
            </button>

            {/* Credentials Section */}
            <div className="space-y-3 border-t border-slate-700/50 pt-6">
              <button
                onClick={() => setShowCredentials(!showCredentials)}
                className="w-full flex items-center justify-between p-3 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg transition text-slate-200"
              >
                <span className="flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Admin Credentials
                </span>
                <span className="text-sm">{showCredentials ? '−' : '+'}</span>
              </button>

              {showCredentials && (
                <div className="bg-slate-900/50 border border-orange-500/30 rounded-lg p-4 space-y-3 animate-in fade-in slide-in-from-top-2">
                  <div className="text-sm text-slate-300">
                    <p className="text-orange-300 font-semibold mb-2">⚠️ Development Credentials Only</p>
                    <p className="text-xs text-slate-400 mb-3">
                      These credentials are for local development and testing only. Never share or commit to version control.
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email</label>
                      <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-200 flex items-center justify-between group">
                        <span>{ADMIN_CREDENTIALS.email}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ADMIN_CREDENTIALS.email);
                          }}
                          className="text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition text-xs"
                        >
                          Copy
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Password</label>
                      <div className="bg-slate-800 border border-slate-700 rounded px-3 py-2 font-mono text-sm text-slate-200 flex items-center justify-between group">
                        <span>••••••••••••••••</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(ADMIN_CREDENTIALS.password);
                          }}
                          className="text-slate-400 hover:text-slate-200 opacity-0 group-hover:opacity-100 transition text-xs"
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Email: ${ADMIN_CREDENTIALS.email}\nPassword: ${ADMIN_CREDENTIALS.password}`
                      );
                    }}
                    className="w-full text-xs py-2 bg-slate-700 hover:bg-slate-600 rounded text-slate-200 transition"
                  >
                    Copy Both
                  </button>
                </div>
              )}
            </div>

            {/* Steps */}
            <div className="space-y-3 border-t border-slate-700/50 pt-6">
              <h3 className="font-semibold text-slate-200">How to Access:</h3>
              <ol className="space-y-2 text-sm text-slate-300">
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">1</span>
                  <span>Click the "Access Admin Dashboard" button above</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">2</span>
                  <span>Enter your admin credentials in the login page</span>
                </li>
                <li className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500/30 flex items-center justify-center text-xs font-bold text-purple-300">3</span>
                  <span>Manage products, inventory, orders, and more</span>
                </li>
              </ol>
            </div>
          </div>

          {/* Features */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-purple-400">📦 Inventory Management</h4>
              <p className="text-sm text-slate-400">Track and manage product stock across warehouses</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-purple-400">📊 Order Management</h4>
              <p className="text-sm text-slate-400">View and process customer orders</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-purple-400">🏷️ Product Management</h4>
              <p className="text-sm text-slate-400">Create and edit product listings</p>
            </div>
            <div className="bg-slate-800/30 border border-slate-700/50 rounded-lg p-4 space-y-2">
              <h4 className="font-semibold text-purple-400">⭐ Review Moderation</h4>
              <p className="text-sm text-slate-400">Moderate customer reviews and ratings</p>
            </div>
          </div>

          {/* Info Box */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
            <p className="text-sm text-blue-200">
              💡 <span className="font-semibold">Tip:</span> The admin dashboard opens in a new tab. Make sure pop-ups are enabled in your browser.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
