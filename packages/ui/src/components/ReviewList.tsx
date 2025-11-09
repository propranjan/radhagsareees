import React from 'react';
import { MessageCircle, ThumbsUp, User } from 'lucide-react';
import { cn } from '../lib/utils';
import { RatingStars } from './RatingStars';

interface Review {
  id: string;
  userName: string;
  userAvatar?: string;
  rating: number;
  title: string;
  comment: string;
  date: string;
  helpfulCount: number;
  verified: boolean;
}

interface ReviewListProps {
  reviews: Review[];
  isLoading?: boolean;
  onLoadMore?: () => void;
  hasMore?: boolean;
  className?: string;
}

export function ReviewList({
  reviews,
  isLoading = false,
  onLoadMore,
  hasMore = false,
  className,
}: ReviewListProps) {
  if (isLoading && reviews.length === 0) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="animate-pulse">
            <div className="flex gap-4">
              <div className="w-12 h-12 bg-gray-200 rounded-full" />
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-3 bg-gray-200 rounded w-1/3" />
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('space-y-6', className)}>
      {reviews.map((review) => (
        <div key={review.id} className="border-b border-gray-200 pb-6 last:border-b-0">
          {/* Review Header */}
          <div className="flex items-start gap-4">
            {/* User Avatar */}
            <div className="flex-shrink-0">
              {review.userAvatar ? (
                <img
                  src={review.userAvatar}
                  alt={review.userName}
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-gray-400" />
                </div>
              )}
            </div>

            {/* Review Content */}
            <div className="flex-1 min-w-0">
              {/* User Name and Verification */}
              <div className="flex items-center gap-2 mb-1">
                <h4 className="font-medium text-gray-900">{review.userName}</h4>
                {review.verified && (
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Verified Purchase
                  </span>
                )}
              </div>

              {/* Rating and Date */}
              <div className="flex items-center gap-3 mb-2">
                <RatingStars rating={review.rating} size="sm" />
                <span className="text-sm text-gray-500">{review.date}</span>
              </div>

              {/* Review Title */}
              <h5 className="font-semibold text-gray-900 mb-2">{review.title}</h5>

              {/* Review Comment */}
              <p className="text-gray-700 leading-relaxed mb-3">{review.comment}</p>

              {/* Review Actions */}
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
                  <ThumbsUp className="w-4 h-4" />
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
                <button className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors">
                  <MessageCircle className="w-4 h-4" />
                  <span>Reply</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Load More Button */}
      {hasMore && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={isLoading}
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'Load More Reviews'}
          </button>
        </div>
      )}

      {/* Empty State */}
      {reviews.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No reviews yet</h3>
          <p className="text-gray-500">Be the first to review this product!</p>
        </div>
      )}
    </div>
  );
}