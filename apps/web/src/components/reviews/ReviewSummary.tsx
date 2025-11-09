/**
 * Review Summary Component - Extracted from ProductReviews
 */
'use client';

import React from 'react';
import { Star } from 'lucide-react';

interface ReviewSummaryProps {
  averageRating: number;
  totalReviews: number;
  ratingDistribution: Record<number, number>;
  onWriteReview?: () => void;
  userToken?: string;
}

export function ReviewSummary({ 
  averageRating, 
  totalReviews, 
  ratingDistribution, 
  onWriteReview,
  userToken 
}: ReviewSummaryProps) {
  const renderStars = (rating: number, size = 'w-4 h-4') => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`${size} ${
          i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-semibold">Customer Reviews</h2>
        {userToken && onWriteReview && (
          <button
            onClick={onWriteReview}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Write a Review
          </button>
        )}
      </div>

      <div className="flex items-center gap-6 mb-4">
        <div className="text-center">
          <div className="text-3xl font-bold text-gray-900">{averageRating}</div>
          <div className="flex items-center justify-center mb-1">
            {renderStars(Math.round(averageRating))}
          </div>
          <div className="text-sm text-gray-600">{totalReviews} reviews</div>
        </div>

        <div className="flex-1">
          {[5, 4, 3, 2, 1].map(star => (
            <RatingBar
              key={star}
              star={star}
              count={ratingDistribution[star] || 0}
              totalReviews={totalReviews}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface RatingBarProps {
  star: number;
  count: number;
  totalReviews: number;
}

function RatingBar({ star, count, totalReviews }: RatingBarProps) {
  const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0;

  return (
    <div className="flex items-center gap-2 mb-1">
      <span className="text-sm w-6">{star}</span>
      <Star className="w-4 h-4 text-yellow-400 fill-current" />
      <div className="flex-1 bg-gray-200 rounded-full h-2">
        <div
          className="bg-yellow-400 rounded-full h-2"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm w-8">{count}</span>
    </div>
  );
}