/**
 * Review Form Component - Extracted from ProductReviews
 */
'use client';

import React, { useState, useCallback } from 'react';
import { Star, Camera, Send, AlertCircle } from 'lucide-react';

interface ReviewFormProps {
  productId: string;
  userToken?: string;
  onSubmit: (formData: ReviewFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  photos: File[];
}

export function ReviewForm({ productId, userToken, onSubmit, onCancel, isSubmitting }: ReviewFormProps) {
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
    photos: [],
  });
  const [error, setError] = useState<string | null>(null);

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file constraints
    const validFiles = files.slice(0, 3).filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        setError('Photos must be 2MB or smaller');
        return false;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setError('Only JPEG, PNG, and WebP images are allowed');
        return false;
      }
      return true;
    });

    setFormData(prev => ({ ...prev, photos: validFiles }));
    setError(null);
  };

  const handleSubmit = useCallback(async () => {
    if (!userToken) {
      setError('Please log in to submit a review');
      return;
    }

    if (!formData.title.trim() || !formData.comment.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setError(null);
    await onSubmit(formData);
  }, [userToken, formData, onSubmit]);

  const renderInteractiveStars = (rating: number, onRate: (rating: number) => void) => {
    return Array.from({ length: 5 }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onRate(i + 1)}
        className="p-1 hover:scale-110 transition-transform"
      >
        <Star
          className={`w-6 h-6 ${
            i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300 hover:text-yellow-200'
          }`}
        />
      </button>
    ));
  };

  return (
    <div className="border-t pt-6 mt-6">
      <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
      
      {error && (
        <div className="p-4 rounded-lg mb-4 flex items-center gap-2 bg-red-50 text-red-800 border border-red-200">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        {/* Rating Selection */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Rating *
          </label>
          <div className="flex items-center gap-1">
            {renderInteractiveStars(formData.rating, handleRatingClick)}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Title *
          </label>
          <input
            type="text"
            value={formData.title}
            onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Summarize your experience"
            maxLength={100}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.title.length}/100
          </div>
        </div>

        {/* Review Body */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Review Details *
          </label>
          <textarea
            value={formData.comment}
            onChange={(e) => setFormData(prev => ({ ...prev, comment: e.target.value }))}
            placeholder="Share your thoughts about this product..."
            rows={4}
            maxLength={2000}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          <div className="text-right text-xs text-gray-500 mt-1">
            {formData.comment.length}/2000
          </div>
        </div>

        {/* Photo Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Photos (Optional)
          </label>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
              <Camera className="w-4 h-4" />
              <span>Add Photos</span>
              <input
                type="file"
                multiple
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
              />
            </label>
            {formData.photos.length > 0 && (
              <span className="text-sm text-gray-600">
                {formData.photos.length} photo(s) selected (max 3, 2MB each)
              </span>
            )}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center gap-3 pt-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !formData.title.trim() || !formData.comment.trim()}
            className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {isSubmitting ? 'Submitting...' : 'Submit Review'}
          </button>

          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export type { ReviewFormData };