'use client';

import { useState, useRef, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeImage: string;
  afterImage: string;
  title?: string;
  beforeLabel?: string;
  afterLabel?: string;
}

export default function BeforeAfterSlider({
  beforeImage,
  afterImage,
  title = 'Try-On Result',
  beforeLabel = 'Before',
  afterLabel = 'After',
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const newPosition = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPosition(Math.min(Math.max(newPosition, 0), 100));
  };

  return (
    <div className="w-full">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-lg shadow-lg cursor-col-resize"
        onMouseMove={handleMouseMove}
        style={{ aspectRatio: '1 / 1' }}
      >
        {/* Before Image */}
        <img
          src={beforeImage}
          alt="Before"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* After Image */}
        <div
          className="absolute inset-0 overflow-hidden"
          style={{ width: `${sliderPosition}%` }}
        >
          <img
            src={afterImage}
            alt="After"
            className="absolute inset-0 w-full h-full object-cover"
            style={{ width: `${(100 / sliderPosition) * 100}%` }}
          />
        </div>

        {/* Slider Handle */}
        <div
          className="absolute top-0 bottom-0 w-1 bg-white shadow-lg"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white rounded-full p-2 shadow-lg">
            <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
              <path d="M5 5v14l11-7z" />
            </svg>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-semibold">
          {beforeLabel}
        </div>
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm font-semibold">
          {afterLabel}
        </div>
      </div>
    </div>
  );
}