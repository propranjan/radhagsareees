'use client';

import React, { useState, useCallback, useOptimistic, useEffect } from 'react';
import { Star, Camera, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { type ReviewResponse } from '@/lib/review-validations';

interface ProductReviewsProps {
  productId: string;
  initialReviews: ReviewResponse[];
  initialAverageRating: number;
  initialRatingDistribution: Record<number, number>;
  userToken?: string;
}

// OptimisticReview type with all required fields including those from ReviewResponse
interface OptimisticReview {
  id: string;
  productId: string;
  userId: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls: string[];
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  isVerified: boolean;
  helpfulCount: number;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email?: string;
  };
  isOptimistic?: boolean;
  submissionStatus?: 'submitting' | 'success' | 'error';
  errorMessage?: string;
}

interface ReviewFormData {
  rating: number;
  title: string;
  comment: string;
  photos: File[]; // Files for upload, sent as imageUrls after upload
}

export function ProductReviews({
  productId,
  initialReviews,
  initialAverageRating,
  initialRatingDistribution,
  userToken,
}: ProductReviewsProps) {
  const [reviews, setReviews] = useState<OptimisticReview[]>(initialReviews as OptimisticReview[]);
  const [averageRating, setAverageRating] = useState(initialAverageRating);
  const [ratingDistribution, setRatingDistribution] = useState(initialRatingDistribution);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [isLoading, setIsLoading] = useState(initialReviews.length === 0);

  // Fetch reviews on mount if not provided
  useEffect(() => {
    if (initialReviews.length === 0) {
      fetchReviews();
    }
  }, [productId]);

  const fetchReviews = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/reviews?productId=${productId}&status=APPROVED`);
      const data = await response.json();
      
      if (data.success && data.reviews) {
        setReviews(data.reviews as OptimisticReview[]);
        
        // Calculate average rating and distribution
        if (data.reviews.length > 0) {
          const totalRating = data.reviews.reduce((sum: number, r: OptimisticReview) => sum + r.rating, 0);
          setAverageRating(Math.round((totalRating / data.reviews.length) * 10) / 10);
          
          const distribution: Record<number, number> = {};
          data.reviews.forEach((r: OptimisticReview) => {
            distribution[r.rating] = (distribution[r.rating] || 0) + 1;
          });
          setRatingDistribution(distribution);
        }
      }
    } catch (error) {
      console.error('Failed to fetch reviews:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Form state
  const [formData, setFormData] = useState<ReviewFormData>({
    rating: 5,
    title: '',
    comment: '',
    photos: [],
  });

  // Optimistic updates
  const [optimisticReviews, addOptimisticReview] = useOptimistic(
    reviews,
    (state: OptimisticReview[], newReview: OptimisticReview) => [newReview, ...state]
  );

  const handleRatingClick = (rating: number) => {
    setFormData(prev => ({ ...prev, rating }));
  };

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validate file constraints
    const validFiles = files.slice(0, 3).filter(file => {
      if (file.size > 2 * 1024 * 1024) {
        setSubmitMessage({ type: 'error', text: 'Photos must be 2MB or smaller' });
        return false;
      }
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
        setSubmitMessage({ type: 'error', text: 'Only JPEG, PNG, and WebP images are allowed' });
        return false;
      }
      return true;
    });

    setFormData(prev => ({ ...prev, photos: validFiles }));
  };

  const submitReview = useCallback(async () => {
    if (!userToken) {
      setSubmitMessage({ type: 'error', text: 'Please log in to submit a review' });
      return;
    }

    if (!formData.title.trim() || !formData.comment.trim()) {
      setSubmitMessage({ type: 'error', text: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    setSubmitMessage(null);

    // Create optimistic review
    const optimisticReview: OptimisticReview = {
      id: `temp-${Date.now()}`,
      productId,
      userId: 'current-user',
      rating: formData.rating,
      title: formData.title,
      comment: formData.comment,
      imageUrls: [], // Will be populated after upload
      status: 'PENDING',
      isVerified: false,
      helpfulCount: 0,
      reportCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      user: {
        id: 'current-user',
        name: 'You',
      },
      isOptimistic: true,
      submissionStatus: 'submitting',
    };

    // Add optimistic review immediately
    addOptimisticReview(optimisticReview);

    try {
      // Upload photos first if any
      let photoUrls: string[] = [];
      if (formData.photos.length > 0) {
        photoUrls = await uploadPhotos(formData.photos);
      }

      // Submit review
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify({
          productId,
          rating: formData.rating,
          title: formData.title,
          comment: formData.comment,
          imageUrls: photoUrls,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Update with actual review data
        setReviews(prev => [result.review, ...prev.filter(r => r.id !== optimisticReview.id)]);
        
        // Update rating statistics optimistically
        const newTotal = reviews.length + 1;
        const newAverage = ((averageRating * reviews.length) + formData.rating) / newTotal;
        setAverageRating(Math.round(newAverage * 10) / 10);
        
        const newDistribution = { ...ratingDistribution };
        newDistribution[formData.rating] = (newDistribution[formData.rating] || 0) + 1;
        setRatingDistribution(newDistribution);

        // Reset form
        setFormData({ rating: 5, title: '', comment: '', photos: [] });
        setShowForm(false);
        setSubmitMessage({ 
          type: 'success', 
          text: result.review.status === 'PENDING' 
            ? 'Review submitted successfully! It will be published after moderation.'
            : 'Review published successfully!'
        });
      } else {
        // Remove optimistic review on error
        setReviews(prev => prev.filter(r => r.id !== optimisticReview.id));
        setSubmitMessage({ 
          type: 'error', 
          text: result.message || 'Failed to submit review. Please try again.' 
        });
      }
    } catch (error) {
      // Remove optimistic review on error
      setReviews(prev => prev.filter(r => r.id !== optimisticReview.id));
      setSubmitMessage({ 
        type: 'error', 
        text: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [userToken, formData, productId, reviews, averageRating, ratingDistribution, addOptimisticReview]);

  const uploadPhotos = async (photos: File[]): Promise<string[]> => {
    // In a real implementation, this would upload to a cloud service
    // For now, we'll simulate the upload
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(photos.map((_, index) => `https://example.com/photo-${Date.now()}-${index}.jpg`));
      }, 1000);
    });
  };

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
    <div className="max-w-4xl mx-auto p-6">
      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-lg shadow-sm p-8 text-center">
          <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading reviews...</p>
        </div>
      )}

      {!isLoading && (
        <>
      {/* Review Summary */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Customer Reviews</h2>
          {userToken && (
            <button
              onClick={() => setShowForm(!showForm)}
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
            <div className="text-sm text-gray-600">{optimisticReviews.length} reviews</div>
          </div>

          <div className="flex-1">
            {[5, 4, 3, 2, 1].map(star => (
              <div key={star} className="flex items-center gap-2 mb-1">
                <span className="text-sm w-6">{star}</span>
                <Star className="w-4 h-4 text-yellow-400 fill-current" />
                <div className="flex-1 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-yellow-400 rounded-full h-2"
                    style={{
                      width: optimisticReviews.length > 0 
                        ? `${((ratingDistribution[star] || 0) / optimisticReviews.length) * 100}%`
                        : '0%'
                    }}
                  />
                </div>
                <span className="text-sm w-8">{ratingDistribution[star] || 0}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Message */}
        {submitMessage && (
          <div className={`p-4 rounded-lg mb-4 flex items-center gap-2 ${
            submitMessage.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {submitMessage.type === 'success' ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            {submitMessage.text}
          </div>
        )}

        {/* Review Form */}
        {showForm && (
          <div className="border-t pt-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Write Your Review</h3>
            
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
                  onClick={submitReview}
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
                  onClick={() => setShowForm(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {optimisticReviews.map((review) => (
          <div key={review.id} className={`bg-white rounded-lg shadow-sm p-6 ${
            review.isOptimistic ? 'opacity-70 animate-pulse' : ''
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
            <p className="text-gray-700 mb-3 leading-relaxed">{review.comment}</p>

            {review.imageUrls && review.imageUrls.length > 0 && (
              <div className="flex gap-2 mb-3">
                {review.imageUrls.map((photo: string, index: number) => (
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
        ))}

        {optimisticReviews.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <div className="text-gray-500 mb-4">No reviews yet</div>
            <p className="text-gray-600 mb-4">Be the first to review this product!</p>
            {userToken && (
              <button
                onClick={() => setShowForm(true)}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Write the First Review
              </button>
            )}
          </div>
        )}
      </div>
        </>
      )}
    </div>
  );
}