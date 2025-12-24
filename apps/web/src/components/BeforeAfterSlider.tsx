/**
 * Before/After Slider Component
 * Interactive slider to compare before and after images
 */

'use client';

import React, { useState, useRef } from 'react';
import Image from 'next/image';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
  };

  const handleTouchStart = () => {
    setIsDragging(true);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));

    setSliderPosition(percentage);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden rounded-lg select-none cursor-ew-resize"
      style={{ aspectRatio: '4 / 6' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchMove={handleTouchMove}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Before Image (Background) */}
      <div className="absolute inset-0">
        <Image
          src={beforeImage}
          alt={beforeLabel}
          fill
          className="object-cover"
          priority
        />
        {/* Before Label */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-medium">
          {beforeLabel}
        </div>
      </div>

      {/* After Image (Sliding Part) */}
      <div
        className="absolute inset-0 overflow-hidden"
        style={{ width: `${sliderPosition}%` }}
      >
        <Image
          src={afterImage}
          alt={afterLabel}
          fill
          className="object-cover"
          priority
        />
        {/* After Label */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-60 text-white px-3 py-1 rounded text-sm font-medium">
          {afterLabel}
        </div>
      </div>

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-white shadow-lg transition-none"
        style={{
          left: `${sliderPosition}%`,
          transform: 'translateX(-50%)',
          cursor: isDragging ? 'grabbing' : 'grab',
        }}
      >
        {/* Handle Circle */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center">
          <div className="flex gap-1">
            <div className="w-0.5 h-6 bg-gray-400" />
            <div className="w-0.5 h-6 bg-gray-400" />
            <div className="w-0.5 h-6 bg-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default BeforeAfterSlider;
