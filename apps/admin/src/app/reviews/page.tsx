'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '../../components/AdminLayout';
import {
  Star,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  Trash2,
  Eye,
  MessageSquare,
  Image as ImageIcon,
  User,
  ShoppingBag,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface Review {
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
  riskScore: number | null;
  moderationFlags: string[];
  createdAt: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  product: {
    id: string;
    title: string;
    slug: string;
    images: string[];
  };
}

interface Stats {
  pending: number;
  approved: number;
  rejected: number;
  total: number;
}

export default function ReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState<Stats>({ pending: 0, approved: 0, rejected: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [reviewToReject, setReviewToReject] = useState<string | null>(null);

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
      });

      if (statusFilter) params.append('status', statusFilter);
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/admin/reviews?${params}`);
      const data = await response.json();

      if (data.success) {
        setReviews(data.reviews);
        setTotalPages(data.pagination.totalPages);
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [page, statusFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const handleApprove = async (reviewId: string) => {
    try {
      setActionLoading(reviewId);
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          action: 'APPROVE',
        }),
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error approving review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async () => {
    if (!reviewToReject) return;

    try {
      setActionLoading(reviewToReject);
      const response = await fetch('/api/admin/reviews', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: reviewToReject,
          action: 'REJECT',
          reason: rejectReason,
        }),
      });

      if (response.ok) {
        fetchReviews();
        setShowRejectModal(false);
        setReviewToReject(null);
        setRejectReason('');
      }
    } catch (error) {
      console.error('Error rejecting review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (reviewId: string) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      setActionLoading(reviewId);
      const response = await fetch(`/api/admin/reviews?id=${reviewId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchReviews();
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < rating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-800 rounded-full">
            <XCircle className="w-3 h-3" />
            Rejected
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Management</h1>
            <p className="text-gray-600">Manage customer reviews and ratings</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-amber-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-amber-600">{stats.pending}</p>
              </div>
              <Clock className="w-8 h-8 text-amber-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-green-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Approved</p>
                <p className="text-2xl font-bold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-red-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-400" />
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-blue-500">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Reviews</p>
                <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
              </div>
              <MessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search reviews..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
            </form>

            {/* Status Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reviews List */}
        <div className="bg-white rounded-lg shadow-sm">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-8 text-center">
              <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No reviews found</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {reviews.map((review) => (
                <div key={review.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Product Image */}
                    <div className="w-16 h-16 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                      {review.product.images?.[0] ? (
                        <img
                          src={review.product.images[0]}
                          alt={review.product.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ShoppingBag className="w-6 h-6 text-gray-400" />
                        </div>
                      )}
                    </div>

                    {/* Review Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            {renderStars(review.rating)}
                            {getStatusBadge(review.status)}
                            {review.isVerified && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                                <CheckCircle className="w-3 h-3" />
                                Verified
                              </span>
                            )}
                            {review.reportCount > 0 && (
                              <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-800 rounded-full">
                                <AlertTriangle className="w-3 h-3" />
                                {review.reportCount} Reports
                              </span>
                            )}
                          </div>
                          <h3 className="font-semibold text-gray-900">{review.title}</h3>
                          <p className="text-sm text-gray-600 line-clamp-2 mt-1">{review.comment}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {review.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(review.id)}
                                disabled={actionLoading === review.id}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Approve"
                              >
                                <CheckCircle className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => {
                                  setReviewToReject(review.id);
                                  setShowRejectModal(true);
                                }}
                                disabled={actionLoading === review.id}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                title="Reject"
                              >
                                <XCircle className="w-5 h-5" />
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => setSelectedReview(review)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="View Details"
                          >
                            <Eye className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDelete(review.id)}
                            disabled={actionLoading === review.id}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                            title="Delete"
                          >
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </div>
                      </div>

                      {/* Meta Info */}
                      <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {review.user.name || review.user.email}
                        </span>
                        <span className="flex items-center gap-1">
                          <ShoppingBag className="w-4 h-4" />
                          {review.product.title}
                        </span>
                        {review.imageUrls?.length > 0 && (
                          <span className="flex items-center gap-1">
                            <ImageIcon className="w-4 h-4" />
                            {review.imageUrls.length} photos
                          </span>
                        )}
                        <span>{new Date(review.createdAt).toLocaleDateString()}</span>
                      </div>

                      {/* Risk Score */}
                      {review.riskScore !== null && review.riskScore > 0.3 && (
                        <div className="mt-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          <span className="text-sm text-orange-600">
                            Risk Score: {(review.riskScore * 100).toFixed(0)}%
                          </span>
                          {review.moderationFlags?.length > 0 && (
                            <span className="text-sm text-gray-500">
                              ({review.moderationFlags.join(', ')})
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Review Detail Modal */}
        {selectedReview && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Review Details</h2>
                  <button
                    onClick={() => setSelectedReview(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XCircle className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-4">
                  {/* Product Info */}
                  <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                      {selectedReview.product.images?.[0] && (
                        <img
                          src={selectedReview.product.images[0]}
                          alt={selectedReview.product.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h3 className="font-semibold">{selectedReview.product.title}</h3>
                      <p className="text-sm text-gray-500">Product ID: {selectedReview.product.id}</p>
                    </div>
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                    <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                      <User className="w-5 h-5 text-primary-600" />
                    </div>
                    <div>
                      <p className="font-medium">{selectedReview.user.name || 'Anonymous'}</p>
                      <p className="text-sm text-gray-500">{selectedReview.user.email}</p>
                    </div>
                    {selectedReview.isVerified && (
                      <span className="ml-auto inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        Verified Purchase
                      </span>
                    )}
                  </div>

                  {/* Rating & Status */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {renderStars(selectedReview.rating)}
                      <span className="text-lg font-semibold">{selectedReview.rating}/5</span>
                    </div>
                    {getStatusBadge(selectedReview.status)}
                  </div>

                  {/* Title & Comment */}
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{selectedReview.title}</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedReview.comment}</p>
                  </div>

                  {/* Images */}
                  {selectedReview.imageUrls?.length > 0 && (
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Photos</p>
                      <div className="flex gap-2 flex-wrap">
                        {selectedReview.imageUrls.map((url, index) => (
                          <img
                            key={index}
                            src={url}
                            alt={`Review photo ${index + 1}`}
                            className="w-24 h-24 object-cover rounded-lg border"
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Moderation Info */}
                  {(selectedReview.riskScore !== null || selectedReview.moderationFlags?.length > 0) && (
                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                      <h4 className="font-medium text-orange-800 mb-2">Moderation Info</h4>
                      {selectedReview.riskScore !== null && (
                        <p className="text-sm text-orange-700">
                          Risk Score: {(selectedReview.riskScore * 100).toFixed(0)}%
                        </p>
                      )}
                      {selectedReview.moderationFlags?.length > 0 && (
                        <p className="text-sm text-orange-700">
                          Flags: {selectedReview.moderationFlags.join(', ')}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Stats */}
                  <div className="flex items-center gap-6 text-sm text-gray-500">
                    <span>👍 {selectedReview.helpfulCount} found helpful</span>
                    {selectedReview.reportCount > 0 && (
                      <span className="text-orange-600">
                        ⚠️ {selectedReview.reportCount} reports
                      </span>
                    )}
                    <span>Created: {new Date(selectedReview.createdAt).toLocaleString()}</span>
                  </div>

                  {/* Actions */}
                  {selectedReview.status === 'PENDING' && (
                    <div className="flex items-center gap-3 pt-4 border-t">
                      <button
                        onClick={() => {
                          handleApprove(selectedReview.id);
                          setSelectedReview(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                      >
                        <CheckCircle className="w-5 h-5" />
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setReviewToReject(selectedReview.id);
                          setShowRejectModal(true);
                          setSelectedReview(null);
                        }}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      >
                        <XCircle className="w-5 h-5" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Reject Review</h2>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this review (optional):
              </p>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Reason for rejection..."
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 mb-4"
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(false);
                    setReviewToReject(null);
                    setRejectReason('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading === reviewToReject}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {actionLoading === reviewToReject ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Reject
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
