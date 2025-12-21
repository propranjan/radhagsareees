'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Package, ChevronRight, Search, Filter, Clock, CheckCircle, Truck, XCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  amount: number;
  tax: number;
  shipping: number;
  createdAt: string;
  itemCount: number;
  items: Array<{
    id: string;
    quantity: number;
    product: {
      title: string;
      images: string[];
    };
    variant: {
      color: string;
    };
  }>;
}

const STATUS_CONFIG: Record<string, { icon: React.ElementType; color: string; bgColor: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' },
  CONFIRMED: { icon: CheckCircle, color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Confirmed' },
  PROCESSING: { icon: RefreshCw, color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Processing' },
  SHIPPED: { icon: Truck, color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Shipped' },
  DELIVERED: { icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-100', label: 'Delivered' },
  CANCELLED: { icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-100', label: 'Cancelled' },
  REFUNDED: { icon: RefreshCw, color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Refunded' },
};

export default function OrdersPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = useMemo(() => {
    if (supabaseUrl && supabaseAnonKey) {
      return createClient(supabaseUrl, supabaseAnonKey);
    }
    return null;
  }, [supabaseUrl, supabaseAnonKey]);

  useEffect(() => {
    if (!supabase) {
      setError('Authentication not configured');
      setLoading(false);
      return;
    }

    const fetchOrders = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login?redirect=/orders');
          return;
        }

        const response = await fetch(`/api/orders?userId=${user.id}`);
        if (response.ok) {
          const data = await response.json();
          setOrders(data.orders || []);
        } else {
          setError('Failed to load orders');
        }
      } catch (err) {
        console.error('Failed to fetch orders:', err);
        setError('Failed to load orders');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [supabase, router]);

  const filteredOrders = useMemo(() => {
    let result = orders;

    // Filter by status
    if (filter !== 'all') {
      result = result.filter(order => order.status === filter);
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => 
        order.orderNumber.toLowerCase().includes(query) ||
        order.items.some(item => item.product.title.toLowerCase().includes(query))
      );
    }

    return result;
  }, [orders, filter, searchQuery]);

  const currentOrders = useMemo(() => 
    orders.filter(o => ['PENDING', 'CONFIRMED', 'PROCESSING', 'SHIPPED'].includes(o.status)),
    [orders]
  );

  const pastOrders = useMemo(() => 
    orders.filter(o => ['DELIVERED', 'CANCELLED', 'REFUNDED'].includes(o.status)),
    [orders]
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  const getStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || STATUS_CONFIG.PENDING;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600 mt-1">Track and manage your orders</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 w-64"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'all'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            All Orders ({orders.length})
          </button>
          <button
            onClick={() => setFilter('current')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'current'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Active ({currentOrders.length})
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === 'past'
                ? 'bg-primary-600 text-white'
                : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
            }`}
          >
            Past Orders ({pastOrders.length})
          </button>
        </div>

        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {filter === 'all' ? 'No orders yet' : 'No orders found'}
            </h2>
            <p className="text-gray-600 mb-6">
              {filter === 'all' 
                ? "Looks like you haven't placed any orders yet."
                : 'Try adjusting your filters or search query.'}
            </p>
            {filter === 'all' && (
              <Link
                href="/catalog"
                className="inline-block bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {(filter === 'current' ? currentOrders : filter === 'past' ? pastOrders : filteredOrders).map((order) => {
              const statusConfig = getStatusConfig(order.status);
              const StatusIcon = statusConfig.icon;
              const total = Number(order.amount) + Number(order.tax) + Number(order.shipping);

              return (
                <Link
                  key={order.id}
                  href={`/orders/${order.id}`}
                  className="block bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
                      <div className="flex items-center gap-3 mb-2 md:mb-0">
                        <span className="font-semibold text-gray-900">
                          {order.orderNumber}
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-sm font-medium ${statusConfig.bgColor} ${statusConfig.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusConfig.label}
                        </span>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </div>
                    </div>

                    <div className="flex flex-col md:flex-row gap-4">
                      {/* Order Items Preview */}
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {order.items.slice(0, 3).map((item, idx) => (
                              <div
                                key={item.id}
                                className="w-12 h-12 rounded-lg border-2 border-white bg-gray-100 overflow-hidden"
                                style={{ zIndex: 3 - idx }}
                              >
                                {item.product.images?.[0] ? (
                                  <img
                                    src={item.product.images[0]}
                                    alt={item.product.title}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                                    ?
                                  </div>
                                )}
                              </div>
                            ))}
                            {order.items.length > 3 && (
                              <div className="w-12 h-12 rounded-lg border-2 border-white bg-gray-200 flex items-center justify-center text-sm text-gray-600">
                                +{order.items.length - 3}
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-sm text-gray-900 font-medium line-clamp-1">
                              {order.items[0]?.product.title}
                              {order.items.length > 1 && ` +${order.items.length - 1} more`}
                            </p>
                            <p className="text-sm text-gray-500">
                              {order.itemCount} {order.itemCount === 1 ? 'item' : 'items'}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Order Total & Action */}
                      <div className="flex items-center justify-between md:justify-end gap-4">
                        <div className="text-right">
                          <p className="text-lg font-semibold text-gray-900">₹{total.toFixed(2)}</p>
                          <p className="text-xs text-gray-500">Total Amount</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
