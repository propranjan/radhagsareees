'use client';

import { useState } from 'react';

interface ShareButtonProps {
  imageUrl: string;
  title?: string;
  onShare?: (platform: string) => void;
}

export default function ShareButton({
  imageUrl,
  title = 'Check out my Saree Try-On!',
  onShare,
}: ShareButtonProps) {
  const [showOptions, setShowOptions] = useState(false);

  const shareOptions = [
    {
      name: 'WhatsApp',
      icon: '💬',
      onClick: () => {
        const text = encodeURIComponent(`${title}\n${imageUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        onShare?.('whatsapp');
      },
    },
    {
      name: 'Instagram',
      icon: '📷',
      onClick: () => {
        onShare?.('instagram');
        alert('Share the image via Instagram - copy the URL to your clipboard');
        navigator.clipboard.writeText(imageUrl);
      },
    },
    {
      name: 'Facebook',
      icon: '👍',
      onClick: () => {
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(imageUrl)}`,
          '_blank'
        );
        onShare?.('facebook');
      },
    },
    {
      name: 'Download',
      icon: '⬇️',
      onClick: () => {
        const link = document.createElement('a');
        link.href = imageUrl;
        link.download = 'saree-tryon.png';
        link.click();
        onShare?.('download');
      },
    },
    {
      name: 'Copy Link',
      icon: '📋',
      onClick: () => {
        navigator.clipboard.writeText(imageUrl);
        alert('Image URL copied to clipboard!');
        onShare?.('copy');
      },
    },
  ];

  return (
    <div className="relative">
      <button
        onClick={() => setShowOptions(!showOptions)}
        className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition-colors"
      >
        Share Try-On
      </button>

      {showOptions && (
        <div className="absolute top-full mt-2 right-0 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-max">
          {shareOptions.map((option) => (
            <button
              key={option.name}
              onClick={() => {
                option.onClick();
                setShowOptions(false);
              }}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2"
            >
              <span>{option.icon}</span>
              {option.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}