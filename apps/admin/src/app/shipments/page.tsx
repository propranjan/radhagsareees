'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import {
  Truck,
  Search,
  Package,
  MapPin,
  ExternalLink,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from 'lucide-react';

interface Fulfillment {
  id: string;
  awbCode: string;
  courierName: string;
  status: string;
  trackingUrl?: string;
  labelUrl?: string;
  pickupScheduledDate?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  estimatedDelivery?: string;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    amount: number;
    customerName: string;
    shippingCity?: string;
    shippingPincode?: string;
  };
  warehouse?: {
    id: string;
    name: string;
    city: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  'PENDING',
  'CREATED',
  'PICKUP_SCHEDULED',
  'PICKED',
  'IN_TRANSIT',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'RTO_INITIATED',
  'RTO_IN_TRANSIT',
  'RTO_DELIVERED',
  'CANCELLED',
];

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-gray-100 text-gray-800',
  CREATED: 'bg-blue-100 text-blue-800',
  PICKUP_SCHEDULED: 'bg-indigo-100 text-indigo-800',
  PICKED: 'bg-purple-100 text-purple-800',
  IN_TRANSIT: 'bg-orange-100 text-orange-800',
  OUT_FOR_DELIVERY: 'bg-cyan-100 text-cyan-800',
  DELIVERED: 'bg-green-100 text-green-800',
  RTO_INITIATED: 'bg-red-100 text-red-800',
  RTO_IN_TRANSIT: 'bg-red-100 text-red-800',
  RTO_DELIVERED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-gray-100 text-gray-600',
};

export default function ShipmentsPage() {
  const [fulfillments, setFulfillments] = useState<Fulfillment[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [pagination, setPagination] = useState<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  useEffect(() => {
    fetchShipments();
  }, [filter, pagination.page]);

  const fetchShipments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });
      
      if (filter !== 'all') {
        params.append('status', filter);
      }
      
      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/admin/shipments?${params}`);
      const data = await response.json();

      if (response.ok) {
        setFulfillments(data.fulfillments);
        setPagination((prev) => ({
          ...prev,
          total: data.pagination.total,
          totalPages: data.pagination.totalPages,
        }));
      }
    } catch (error) {
      console.error('Failed to fetch shipments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchShipments();
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusIcon = (status: string) => {
    if (status === 'DELIVERED') return <CheckCircle className="w-3 h-3" />;
    if (status === 'CANCELLED' || status.startsWith('RTO')) return <XCircle className="w-3 h-3" />;
    if (status === 'IN_TRANSIT' || status === 'OUT_FOR_DELIVERY') return <Truck className="w-3 h-3" />;
    return <Clock className="w-3 h-3" />;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-600 mt-1">Track and manage Shiprocket shipments</p>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Status Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setFilter('all');
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  filter === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                All
              </button>
              {['IN_TRANSIT', 'PICKUP_SCHEDULED', 'DELIVERED', 'RTO_INITIATED'].map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    setFilter(status);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                  className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                    filter === status
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by AWB, courier, order number..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                />
              </div>
              <button
                onClick={handleSearch}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Search
              </button>
            </div>
          </div>
        </div>

        {/* Shipments Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : fulfillments.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Truck className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No shipments found</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        AWB / Courier
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Order
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Destination
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Pickup
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        EDD
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {fulfillments.map((fulfillment) => (
                      <tr key={fulfillment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{fulfillment.awbCode}</p>
                            <p className="text-xs text-gray-500">{fulfillment.courierName}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Link
                            href={`/orders/${fulfillment.order.id}`}
                            className="text-sm font-medium text-primary-600 hover:text-primary-700"
                          >
                            #{fulfillment.order.orderNumber}
                          </Link>
                          <p className="text-xs text-gray-500">{fulfillment.order.customerName}</p>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-1 text-sm text-gray-600">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <span>
                              {fulfillment.order.shippingCity}
                              {fulfillment.order.shippingPincode && ` - ${fulfillment.order.shippingPincode}`}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${STATUS_COLORS[fulfillment.status] || 'bg-gray-100 text-gray-800'}`}>
                            {getStatusIcon(fulfillment.status)}
                            {fulfillment.status.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fulfillment.pickedUpAt ? (
                            <span className="text-green-600">{formatDate(fulfillment.pickedUpAt)}</span>
                          ) : fulfillment.pickupScheduledDate ? (
                            <span>{formatDate(fulfillment.pickupScheduledDate)}</span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {fulfillment.deliveredAt ? (
                            <span className="text-green-600">Delivered</span>
                          ) : (
                            formatDate(fulfillment.estimatedDelivery)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            {fulfillment.trackingUrl && (
                              <a
                                href={fulfillment.trackingUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-600 hover:text-primary-600"
                                title="Track"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            )}
                            {fulfillment.labelUrl && (
                              <a
                                href={fulfillment.labelUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1 text-gray-600 hover:text-primary-600"
                                title="Print Label"
                              >
                                <FileText className="w-4 h-4" />
                              </a>
                            )}
                            <Link
                              href={`/orders/${fulfillment.order.id}`}
                              className="p-1 text-gray-600 hover:text-primary-600"
                              title="View Order"
                            >
                              <Package className="w-4 h-4" />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                    {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page === 1}
                      className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <button
                      onClick={() => setPagination((p) => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page === pagination.totalPages}
                      className="p-2 border rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
