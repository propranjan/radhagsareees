'use client';

import { useState } from 'react';

interface VariantSelectorProps {
  variants: Array<{
    id: string;
    name: string;
    image: string;
  }>;
  onSelect: (variantId: string) => void;
  selectedVariant?: string;
  disabled?: boolean;
}

export default function VariantSelector({
  variants,
  onSelect,
  selectedVariant,
  disabled = false,
}: VariantSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select a Variant</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <div
            key={variant.id}
            onClick={() => !disabled && onSelect(variant.id)}
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedVariant === variant.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <img
              src={variant.image}
              alt={variant.name}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <p className="font-semibold text-sm">{variant.name}</p>
          </div>
        ))}
      </div>
    </div>
  );
}