'use client';

import { useState } from 'react';

interface Variant {
  id: string;
  name: string;
  color: string;
  price: number;
  image: string;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variant: Variant) => void;
  selectedVariant?: Variant;
}

export default function VariantSelector({
  variants,
  onSelect,
  selectedVariant,
}: VariantSelectorProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Select a Variant</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {variants.map((variant) => (
          <div
            key={variant.id}
            onClick={() => onSelect(variant)}
            className={`p-3 border-2 rounded-lg cursor-pointer transition-all ${
              selectedVariant?.id === variant.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <img
              src={variant.image}
              alt={variant.name}
              className="w-full h-32 object-cover rounded mb-2"
            />
            <p className="font-semibold text-sm">{variant.name}</p>
            <p className="text-xs text-gray-600 mb-1">{variant.color}</p>
            <p className="text-sm font-bold text-green-600">₹{variant.price.toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  );
}