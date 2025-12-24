/**
 * Variant Selector Component
 * Allows selection of different saree variants
 */

'use client';

import React from 'react';
import Image from 'next/image';

interface Variant {
  id: string;
  name: string;
  image: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  selectedVariant: string;
  onSelect: (variantId: string) => void;
  disabled?: boolean;
}

export function VariantSelector({
  variants,
  selectedVariant,
  onSelect,
  disabled = false,
}: VariantSelectorProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {variants.map((variant) => (
        <button
          key={variant.id}
          onClick={() => onSelect(variant.id)}
          disabled={disabled}
          className={`
            relative group rounded-lg overflow-hidden transition-all duration-200
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:shadow-lg'}
            ${
              selectedVariant === variant.id
                ? 'ring-2 ring-blue-500 shadow-md'
                : 'ring-1 ring-gray-200'
            }
          `}
        >
          {/* Variant Image */}
          <div className="relative w-full h-24 bg-gray-100">
            <Image
              src={variant.image}
              alt={variant.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-200"
            />
          </div>

          {/* Checkmark */}
          {selectedVariant === variant.id && (
            <div className="absolute inset-0 flex items-center justify-center bg-blue-500 bg-opacity-10">
              <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
                <svg
                  className="w-4 h-4 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={3}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Variant Name */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white px-2 py-1 text-xs font-medium truncate">
            {variant.name}
          </div>
        </button>
      ))}
    </div>
  );
}

export default VariantSelector;
