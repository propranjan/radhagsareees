/**
 * Review List Component - Extracted from ProductReviews
 */
'use client';

import React from 'react';
import { Star, CheckCircle, Clock } from 'lucide-react';
import { type ReviewResponse } from '../../lib/review-validations';

interface ReviewListProps {
  reviews: ReviewResponse[];
  isOptimistic?: boolean;
}

export function ReviewList({ reviews, isOptimistic = false }: ReviewListProps) {
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

  if (reviews.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 text-center">
        <div className="text-gray-500 mb-4">No reviews yet</div>
        <p className="text-gray-600 mb-4">Be the first to review this product!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <ReviewItem
          key={review.id}
          review={review}
          isOptimistic={isOptimistic && 'isOptimistic' in review && Boolean((review as any).isOptimistic)}
        />
      ))}
    </div>
  );
}

interface ReviewItemProps {
  review: ReviewResponse;
  isOptimistic?: boolean;
}

function ReviewItem({ review, isOptimistic = false }: ReviewItemProps) {
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
    <div className={`bg-white rounded-lg shadow-sm p-6 ${
      isOptimistic ? 'opacity-70 animate-pulse' : ''
    }`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
            <span className="font-semibold text-indigo-700">
              {review.user.name?.charAt(0) || 'A'}
            </span>
          </div>
          <div>
            <div className="font-semibold text-gray-900">{review.user.name}</div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              {renderStars(review.rating)}
              <span>•</span>
              <span>{new Date(review.createdAt).toLocaleDateString()}</span>
              {review.isVerified && (
                <>
                  <span>•</span>
                  <span className="text-green-600 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Verified Purchase
                  </span>
                </>
              )}
              {review.status === 'PENDING' && (
                <>
                  <span>•</span>
                  <span className="text-amber-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    Pending Moderation
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
      <p className="text-gray-700 mb-3 leading-relaxed">{review.body}</p>

      {review.photos && review.photos.length > 0 && (
        <div className="flex gap-2 mb-3">
          {review.photos.map((photo, index) => (
            <img
              key={index}
              src={photo}
              alt={`Review photo ${index + 1}`}
              className="w-16 h-16 object-cover rounded-lg border"
            />
          ))}
        </div>
      )}

      <div className="flex items-center gap-4 text-sm text-gray-600">
        <button className="hover:text-indigo-600 transition-colors">
          👍 Helpful ({review.helpfulCount})
        </button>
        <button className="hover:text-red-600 transition-colors">
          Report
        </button>
      </div>
    </div>
  );
}