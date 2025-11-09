"use client";

import { useState, useEffect } from "react";

interface ReviewForModeration {
  id: string;
  productId: string;
  productName: string;
  rating: number;
  title: string;
  comment: string;
  imageUrls?: string[];
  userEmail: string;
  userId: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  riskScore?: number;
  moderationFlags?: string[];
  createdAt: string;
  moderationHistory?: Array<{
    action: string;
    reason?: string;
    timestamp: string;
    moderatorId: string;
  }>;
}

interface ModerationStats {
  totalPending: number;
  totalApproved: number;
  totalRejected: number;
  averageProcessingTime: number;
}

export default function ModerationPage() {
  const [reviews, setReviews] = useState<ReviewForModeration[]>([]);
  const [stats, setStats] = useState<ModerationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'HIGH_RISK' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [selectedReview, setSelectedReview] = useState<ReviewForModeration | null>(null);
  const [moderationReason, setModerationReason] = useState("");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Fetch reviews for moderation
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ filter });
      const response = await fetch(`/api/admin/moderation/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch reviews');
      }

      const data = await response.json();
      setReviews(data.reviews);
      setStats(data.stats);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      alert('Failed to fetch reviews for moderation');
    } finally {
      setLoading(false);
    }
  };

  // Handle review action (approve/reject)
  const handleReviewAction = async (
    reviewId: string, 
    action: 'APPROVE' | 'REJECT',
    reason?: string
  ) => {
    try {
      setActionLoading(reviewId);
      
      const response = await fetch('/api/admin/moderation/reviews/action', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewId,
          action,
          reason: reason || moderationReason,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to process review action');
      }

      // Refresh reviews list
      await fetchReviews();
      
      // Reset form
      setSelectedReview(null);
      setModerationReason("");
      
      alert(`Review ${action.toLowerCase()}ed successfully`);
    } catch (error) {
      console.error('Error processing review action:', error);
      alert(`Failed to ${action.toLowerCase()} review`);
    } finally {
      setActionLoading(null);
    }
  };

  // Bulk approve low-risk reviews
  const handleBulkApprove = async () => {
    if (!confirm('Are you sure you want to approve all low-risk pending reviews?')) {
      return;
    }

    try {
      setActionLoading('bulk');
      
      const response = await fetch('/api/admin/moderation/reviews/bulk-approve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxRiskScore: 0.3, // Only approve reviews with very low risk
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to bulk approve reviews');
      }

      const result = await response.json();
      alert(`Successfully approved ${result.approvedCount} low-risk reviews`);
      
      await fetchReviews();
    } catch (error) {
      console.error('Error bulk approving reviews:', error);
      alert('Failed to bulk approve reviews');
    } finally {
      setActionLoading(null);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [filter]);

  const getRiskBadge = (riskScore?: number) => {
    if (!riskScore) return <span className="px-2 py-1 bg-gray-200 text-gray-800 text-xs rounded">Unknown</span>;
    
    if (riskScore >= 0.7) return <span className="px-2 py-1 bg-red-200 text-red-800 text-xs rounded">High Risk</span>;
    if (riskScore >= 0.4) return <span className="px-2 py-1 bg-yellow-200 text-yellow-800 text-xs rounded">Medium Risk</span>;
    return <span className="px-2 py-1 bg-green-200 text-green-800 text-xs rounded">Low Risk</span>;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="text-green-500 text-sm">✓</span>;
      case 'REJECTED':
        return <span className="text-red-500 text-sm">✗</span>;
      case 'PENDING':
        return <span className="text-yellow-500 text-sm">⏳</span>;
      default:
        return <span className="text-gray-500 text-sm">👁️</span>;
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading moderation queue...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Review Moderation</h1>
          <p className="text-gray-600 mt-1">
            Review and approve user-submitted content
          </p>
        </div>
        
        {filter === 'PENDING' && (
          <button
            onClick={handleBulkApprove}
            disabled={actionLoading === 'bulk'}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {actionLoading === 'bulk' ? 'Processing...' : 'Bulk Approve Low Risk'}
          </button>
        )}
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-yellow-500">⏳</span>
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold">{stats.totalPending}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-green-500">✓</span>
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold">{stats.totalApproved}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-red-500">✗</span>
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold">{stats.totalRejected}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <div className="flex items-center space-x-2">
              <span className="text-blue-500">⚠️</span>
              <div>
                <p className="text-sm text-gray-600">Avg. Processing</p>
                <p className="text-2xl font-bold">{Math.round(stats.averageProcessingTime)}h</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex space-x-2 mb-6">
        {(['ALL', 'PENDING', 'HIGH_RISK', 'APPROVED', 'REJECTED'] as const).map((filterType) => (
          <button
            key={filterType}
            className={`px-4 py-2 rounded text-sm ${
              filter === filterType 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setFilter(filterType)}
          >
            {filterType.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Reviews Queue</h2>
          
          {reviews.length === 0 ? (
            <div className="bg-white p-6 rounded-lg border shadow-sm text-center">
              <p className="text-gray-500">No reviews found for the selected filter</p>
            </div>
          ) : (
            reviews.map((review) => (
              <div
                key={review.id}
                className={`bg-white p-4 rounded-lg border shadow-sm cursor-pointer transition-colors ${
                  selectedReview?.id === review.id ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                }`}
                onClick={() => setSelectedReview(review)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(review.status)}
                    <span className="font-medium">{review.productName}</span>
                    <div className="flex">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < review.rating ? 'text-yellow-500' : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>
                  {getRiskBadge(review.riskScore)}
                </div>
                
                <h3 className="font-medium mb-1">{review.title}</h3>
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {review.comment}
                </p>
                
                {review.moderationFlags && review.moderationFlags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {review.moderationFlags.slice(0, 3).map((flag, index) => (
                      <span key={index} className="px-1 py-0.5 bg-orange-200 text-orange-800 text-xs rounded">
                        {flag.substring(0, 30)}...
                      </span>
                    ))}
                    {review.moderationFlags.length > 3 && (
                      <span className="px-1 py-0.5 bg-gray-200 text-gray-800 text-xs rounded">
                        +{review.moderationFlags.length - 3} more
                      </span>
                    )}
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>By: {review.userEmail}</span>
                  <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Review Detail Panel */}
        <div className="lg:sticky lg:top-6">
          {selectedReview ? (
            <div className="bg-white p-6 rounded-lg border shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Review Details</h2>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedReview.status)}
                  {getRiskBadge(selectedReview.riskScore)}
                </div>
              </div>
              
              <div className="space-y-4">
                {/* Product Info */}
                <div>
                  <h3 className="font-medium text-sm text-gray-600">Product</h3>
                  <p className="font-medium">{selectedReview.productName}</p>
                </div>

                {/* Rating */}
                <div>
                  <h3 className="font-medium text-sm text-gray-600">Rating</h3>
                  <div className="flex items-center space-x-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <span
                        key={i}
                        className={`text-lg ${
                          i < selectedReview.rating ? 'text-yellow-500' : 'text-gray-300'
                        }`}
                      >
                        ★
                      </span>
                    ))}
                    <span className="ml-2 text-sm text-gray-600">
                      {selectedReview.rating}/5
                    </span>
                  </div>
                </div>

                {/* Review Content */}
                <div>
                  <h3 className="font-medium text-sm text-gray-600">Title</h3>
                  <p className="font-medium">{selectedReview.title}</p>
                </div>

                <div>
                  <h3 className="font-medium text-sm text-gray-600">Comment</h3>
                  <p className="text-sm">{selectedReview.comment}</p>
                </div>

                {/* Images */}
                {selectedReview.imageUrls && selectedReview.imageUrls.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-600 mb-2">Images</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedReview.imageUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Review image ${index + 1}`}
                          className="w-full h-24 object-cover rounded border"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Moderation Flags */}
                {selectedReview.moderationFlags && selectedReview.moderationFlags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-600 mb-2">Moderation Flags</h3>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                      {selectedReview.moderationFlags.map((flag, index) => (
                        <div key={index} className="text-xs bg-orange-100 p-1 rounded">
                          {flag}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* User Info */}
                <div>
                  <h3 className="font-medium text-sm text-gray-600">User</h3>
                  <p className="text-sm">{selectedReview.userEmail}</p>
                  <p className="text-xs text-gray-500">
                    Submitted: {new Date(selectedReview.createdAt).toLocaleString()}
                  </p>
                </div>

                {/* Moderation Actions */}
                {selectedReview.status === 'PENDING' && (
                  <div className="space-y-3 pt-4 border-t">
                    <div>
                      <label className="font-medium text-sm text-gray-600">
                        Moderation Reason (Optional)
                      </label>
                      <textarea
                        value={moderationReason}
                        onChange={(e) => setModerationReason(e.target.value)}
                        placeholder="Enter reason for approval/rejection..."
                        className="mt-1 w-full p-2 border border-gray-300 rounded text-sm"
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleReviewAction(selectedReview.id, 'APPROVE')}
                        disabled={actionLoading === selectedReview.id}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                      >
                        {actionLoading === selectedReview.id ? 'Processing...' : 'Approve'}
                      </button>
                      
                      <button
                        onClick={() => handleReviewAction(selectedReview.id, 'REJECT')}
                        disabled={actionLoading === selectedReview.id}
                        className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        {actionLoading === selectedReview.id ? 'Processing...' : 'Reject'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Moderation History */}
                {selectedReview.moderationHistory && selectedReview.moderationHistory.length > 0 && (
                  <div>
                    <h3 className="font-medium text-sm text-gray-600 mb-2">Moderation History</h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {selectedReview.moderationHistory.map((entry, index) => (
                        <div key={index} className="text-xs p-2 bg-gray-50 rounded">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">{entry.action}</span>
                            <span className="text-gray-500">
                              {new Date(entry.timestamp).toLocaleString()}
                            </span>
                          </div>
                          {entry.reason && (
                            <p className="text-gray-600 mt-1">{entry.reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white p-6 rounded-lg border shadow-sm text-center">
              <p className="text-gray-500">Select a review to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}