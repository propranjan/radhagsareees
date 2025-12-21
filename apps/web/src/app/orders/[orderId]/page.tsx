'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, Package, Truck, Home, CheckCircle, Clock, 
  XCircle, RefreshCw, MapPin, CreditCard, Phone, HelpCircle
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Image from 'next/image';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: string[];
  };
  variant: {
    id: string;
    color: string;
    size: string;
    sku: string;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  amount: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  shippingAddress: {
    id: string;
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
  } | null;
  payment: {
    id: string;
    method: string;
    status: string;
    amount: number;
  } | null;
}

const STATUS_STEPS = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { key: 'PROCESSING', label: 'Processing', icon: Package },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Home },
];

const STATUS_CONFIG: Record<string, { color: string; bgColor: string; label: string }> = {
  PENDING: { color: 'text-yellow-600', bgColor: 'bg-yellow-100', label: 'Pending' },
  CONFIRMED: { color: 'text-blue-600', bgColor: 'bg-blue-100', label: 'Confirmed' },
  PROCESSING: { color: 'text-purple-600', bgColor: 'bg-purple-100', label: 'Processing' },
  SHIPPED: { color: 'text-indigo-600', bgColor: 'bg-indigo-100', label: 'Shipped' },
  DELIVERED: { color: 'text-green-600', bgColor: 'bg-green-100', label: 'Delivered' },
  CANCELLED: { color: 'text-red-600', bgColor: 'bg-red-100', label: 'Cancelled' },
  REFUNDED: { color: 'text-gray-600', bgColor: 'bg-gray-100', label: 'Refunded' },
};

export default function OrderDetailPage({ params }: { params: { orderId: string } }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<Order | null>(null);
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

    const fetchOrder = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          router.push('/auth/login');
          return;
        }

        const response = await fetch(`/api/orders/${params.orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
        } else {
          setError('Order not found');
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [supabase, router, params.orderId]);

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

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-20 text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Order not found'}
          </h1>
          <Link href="/orders" className="text-primary-600 hover:underline">
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
  const currentStepIndex = STATUS_STEPS.findIndex(step => step.key === order.status);
  const isCancelled = order.status === 'CANCELLED' || order.status === 'REFUNDED';
  const total = Number(order.amount) + Number(order.tax) + Number(order.shipping) - Number(order.discount || 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Back Button */}
        <div className="mb-6">
          <Link
            href="/orders"
            className="inline-flex items-center text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Link>
        </div>

        {/* Order Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">{order.orderNumber}</h1>
              <p className="text-gray-600">
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
            <div className={`mt-4 md:mt-0 inline-flex items-center gap-2 px-4 py-2 rounded-full ${statusConfig.bgColor} ${statusConfig.color}`}>
              {isCancelled ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
              <span className="font-medium">{statusConfig.label}</span>
            </div>
          </div>
        </div>

        {/* Order Progress */}
        {!isCancelled && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Order Progress</h2>
            <div className="relative">
              <div className="flex justify-between">
                {STATUS_STEPS.map((step, index) => {
                  const isCompleted = index <= currentStepIndex;
                  const isCurrent = index === currentStepIndex;
                  const StepIcon = step.icon;

                  return (
                    <div key={step.key} className="flex flex-col items-center relative z-10">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isCompleted
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-green-100' : ''}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs mt-2 text-center ${
                        isCompleted ? 'text-green-600 font-medium' : 'text-gray-500'
                      }`}>
                        {step.label}
                      </span>
                    </div>
                  );
                })}
              </div>
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-0">
                <div
                  className="h-full bg-green-500 transition-all duration-500"
                  style={{ width: `${(currentStepIndex / (STATUS_STEPS.length - 1)) * 100}%` }}
                />
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="text-gray-700">
                <p className="font-medium">{order.shippingAddress.name}</p>
                <p>{order.shippingAddress.street}</p>
                <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                <p>{order.shippingAddress.zipCode}</p>
                {order.shippingAddress.phone && (
                  <p className="flex items-center gap-1 mt-2 text-gray-600">
                    <Phone className="w-4 h-4" />
                    {order.shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Payment Info */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
              <CreditCard className="w-5 h-5" />
              Payment Information
            </h2>
            <div className="text-gray-700 space-y-2">
              <div className="flex justify-between">
                <span>Method</span>
                <span className="font-medium">
                  {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status</span>
                <span className={`font-medium capitalize ${
                  order.payment?.status === 'COMPLETED' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {order.payment?.status || 'Pending'}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span>Amount</span>
                <span className="font-semibold text-lg">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Order Items ({order.items.length})
          </h2>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex gap-4">
                  <Link
                    href={`/products/${item.product.slug}`}
                    className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden hover:opacity-80 transition-opacity"
                  >
                    {item.product.images?.[0] ? (
                      <Image
                        src={item.product.images[0]}
                        alt={item.product.title}
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                      </div>
                    )}
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/products/${item.product.slug}`}
                      className="font-medium text-gray-900 hover:text-primary-600 line-clamp-1"
                    >
                      {item.product.title}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      Color: {item.variant.color} | Size: {item.variant.size}
                    </p>
                    <p className="text-sm text-gray-500">SKU: {item.variant.sku}</p>
                    <p className="text-sm text-gray-600 mt-1">Qty: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900">
                      ₹{Number(item.total).toFixed(2)}
                    </p>
                    <p className="text-sm text-gray-500">
                      ₹{Number(item.price).toFixed(2)} each
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="mt-4 pt-4 border-t space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(order.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Shipping</span>
              <span>{Number(order.shipping) === 0 ? 'FREE' : `₹${Number(order.shipping).toFixed(2)}`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Tax (GST)</span>
              <span>₹{Number(order.tax).toFixed(2)}</span>
            </div>
            {Number(order.discount) > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount</span>
                <span>-₹{Number(order.discount).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
            <HelpCircle className="w-5 h-5" />
            Need Help?
          </h2>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/contact"
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Contact Support
            </Link>
            {order.status === 'DELIVERED' && (
              <Link
                href={`/orders/${order.id}/return`}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Return Order
              </Link>
            )}
            {['PENDING', 'CONFIRMED'].includes(order.status) && (
              <button
                className="px-4 py-2 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                onClick={() => {
                  if (confirm('Are you sure you want to cancel this order?')) {
                    // TODO: Implement cancel order API
                    alert('Cancel functionality coming soon');
                  }
                }}
              >
                Cancel Order
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
