'use client';

import { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, Truck, Home, ShoppingBag } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';

interface OrderDetails {
  id: string;
  orderNumber: string;
  status: string;
  amount: number;
  tax: number;
  shipping: number;
  createdAt: string;
  items: Array<{
    id: string;
    quantity: number;
    price: number;
    product: {
      title: string;
      images: string[];
    };
    variant: {
      color: string;
      size: string;
    };
  }>;
  shippingAddress: {
    name: string;
    street: string;
    city: string;
    state: string;
    zipCode: string;
    phone: string | null;
  } | null;
  payment: {
    method: string;
    status: string;
  } | null;
}

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams?.get('orderId') || null;
  const [loading, setLoading] = useState(true);
  const [order, setOrder] = useState<OrderDetails | null>(null);
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
    if (!orderId) {
      setError('Order not found');
      setLoading(false);
      return;
    }

    const fetchOrder = async () => {
      if (!supabase) {
        setError('Authentication not configured');
        setLoading(false);
        return;
      }

      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          setError('Please login to view order details');
          setLoading(false);
          return;
        }

        const response = await fetch(`/api/orders/${orderId}`);
        if (response.ok) {
          const data = await response.json();
          setOrder(data.order);
        } else {
          setError('Failed to load order details');
        }
      } catch (err) {
        console.error('Failed to fetch order:', err);
        setError('Failed to load order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId, supabase]);

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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            {error || 'Order not found'}
          </h1>
          <Link href="/" className="text-primary-600 hover:underline">
            Go to Home
          </Link>
        </div>
      </div>
    );
  }

  const total = Number(order.amount) + Number(order.tax) + Number(order.shipping);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Success Banner */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-green-800 mb-2">
            Order Placed Successfully!
          </h1>
          <p className="text-green-700">
            Thank you for your order. We&apos;ll send you an email confirmation shortly.
          </p>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Order Details</h2>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium">
              {order.status}
            </span>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-semibold text-gray-900">{order.orderNumber}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Order Date</p>
              <p className="font-semibold text-gray-900">
                {new Date(order.createdAt).toLocaleDateString('en-IN', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Method</p>
              <p className="font-semibold text-gray-900">
                {order.payment?.method === 'cod' ? 'Cash on Delivery' : 'Prepaid'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Payment Status</p>
              <p className="font-semibold text-gray-900 capitalize">
                {order.payment?.status || 'Pending'}
              </p>
            </div>
          </div>

          {/* Order Timeline */}
          <div className="flex items-center justify-between py-4 border-t border-b">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-gray-600 mt-1">Placed</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2">
              <div className="h-1 bg-green-500 w-1/4"></div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Package className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-600 mt-1">Processing</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-600 mt-1">Shipped</span>
            </div>
            <div className="flex-1 h-1 bg-gray-200 mx-2"></div>
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <Home className="w-5 h-5 text-gray-400" />
              </div>
              <span className="text-xs text-gray-600 mt-1">Delivered</span>
            </div>
          </div>
        </div>

        {/* Shipping Address */}
        {order.shippingAddress && (
          <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">Shipping Address</h2>
            <p className="text-gray-700">{order.shippingAddress.name}</p>
            <p className="text-gray-600">
              {order.shippingAddress.street}, {order.shippingAddress.city}
            </p>
            <p className="text-gray-600">
              {order.shippingAddress.state} - {order.shippingAddress.zipCode}
            </p>
            {order.shippingAddress.phone && (
              <p className="text-gray-600 mt-1">Phone: {order.shippingAddress.phone}</p>
            )}
          </div>
        )}

        {/* Order Items */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Order Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No Image
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{item.product.title}</h3>
                  <p className="text-sm text-gray-600">
                    {item.variant.color} | {item.variant.size} | Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ₹{(Number(item.price) * item.quantity).toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Order Totals */}
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
            <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
              <span>Total</span>
              <span>₹{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/catalog"
            className="flex-1 inline-flex items-center justify-center gap-2 bg-primary-600 text-white py-3 px-6 rounded-lg hover:bg-primary-700 transition-colors font-semibold"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
          <Link
            href="/orders"
            className="flex-1 inline-flex items-center justify-center gap-2 border border-gray-300 text-gray-700 py-3 px-6 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
          >
            <Package className="w-5 h-5" />
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
