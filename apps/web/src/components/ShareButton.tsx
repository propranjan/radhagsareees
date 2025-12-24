/**
 * Share Button Component
 * Share try-on results on WhatsApp and other platforms
 */

'use client';

import React, { useState } from 'react';
import { Share2, MessageCircle, Mail, Copy, Check } from 'lucide-react';

interface ShareButtonProps {
  imageUrl: string;
  productName: string;
  productPrice: number;
  onShare?: (platform: string) => void;
}

export function ShareButton({
  imageUrl,
  productName,
  productPrice,
  onShare,
}: ShareButtonProps) {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareMessage = `Check out this gorgeous ${productName} on me! 🧵✨ Price: ₹${productPrice.toLocaleString('en-IN')}`;
  const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

  /**
   * Share on WhatsApp
   */
  const shareOnWhatsApp = () => {
    const text = encodeURIComponent(`${shareMessage}\n\nView my try-on: ${shareUrl}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    onShare?.('whatsapp');
    setShowShareMenu(false);
  };

  /**
   * Share on Facebook
   */
  const shareOnFacebook = () => {
    const url = encodeURIComponent(shareUrl);
    window.open(
      `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      '_blank',
      'width=600,height=400'
    );
    onShare?.('facebook');
    setShowShareMenu(false);
  };

  /**
   * Share on Twitter/X
   */
  const shareOnTwitter = () => {
    const text = encodeURIComponent(`${shareMessage} ${shareUrl}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank');
    onShare?.('twitter');
    setShowShareMenu(false);
  };

  /**
   * Copy link to clipboard
   */
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(`${shareMessage}\n\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      onShare?.('copy');
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  /**
   * Share via email
   */
  const shareViaEmail = () => {
    const subject = encodeURIComponent(`Check out my ${productName} try-on!`);
    const body = encodeURIComponent(`${shareMessage}\n\nView my try-on: ${shareUrl}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    onShare?.('email');
    setShowShareMenu(false);
  };

  /**
   * Download image
   */
  const downloadImage = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `saree-tryon-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      onShare?.('download');
      setShowShareMenu(false);
    } catch (error) {
      console.error('Failed to download image:', error);
    }
  };

  return (
    <div className="relative inline-block w-full">
      <button
        onClick={() => setShowShareMenu(!showShareMenu)}
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
      >
        <Share2 className="w-5 h-5" />
        Share Your Try-On
      </button>

      {/* Share Menu */}
      {showShareMenu && (
        <div className="absolute top-full mt-2 right-0 w-64 bg-white rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-4">Share on Social</h3>

            {/* Share Options */}
            <div className="space-y-2">
              {/* WhatsApp */}
              <button
                onClick={shareOnWhatsApp}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-green-50 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <span className="text-gray-700 font-medium">WhatsApp</span>
              </button>

              {/* Facebook */}
              <button
                onClick={shareOnFacebook}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-blue-50 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={shareOnTwitter}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-gray-900 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg
                    className="w-4 h-4"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24h-6.514l-5.106-6.693-5.828 6.693h-3.308l7.73-8.835L2.25 2.25h6.514l4.821 6.38L18.244 2.25zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Twitter</span>
              </button>
            </div>

            {/* Divider */}
            <div className="my-3 border-t border-gray-200" />

            {/* Other Options */}
            <div className="space-y-2">
              {/* Copy Link */}
              <button
                onClick={copyToClipboard}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-gray-400 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </div>
                <span className="text-gray-700 font-medium">
                  {copied ? 'Copied!' : 'Copy Link'}
                </span>
              </button>

              {/* Email */}
              <button
                onClick={shareViaEmail}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <Mail className="w-4 h-4" />
                </div>
                <span className="text-gray-700 font-medium">Email</span>
              </button>

              {/* Download */}
              <button
                onClick={downloadImage}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 transition-colors duration-200 group"
              >
                <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </div>
                <span className="text-gray-700 font-medium">Download</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {showShareMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowShareMenu(false)}
        />
      )}
    </div>
  );
}

export default ShareButton;
