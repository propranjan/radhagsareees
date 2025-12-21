'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, CreditCard, Truck, CheckCircle, Plus, AlertCircle } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import Header from '@/components/Header';
import Image from 'next/image';

interface CartItem {
  id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    slug: string;
    images: string[];
  };
  variant: {
    id: string;
    sku: string;
    color: string;
    size: string;
    price: number;
    mrp: number;
  };
}

interface Address {
  id: string;
  name: string;
  type: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string | null;
  isDefault: boolean;
}

export default function CheckoutPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cod');
  const [subtotal, setSubtotal] = useState(0);
  const [error, setError] = useState('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    type: 'HOME',
    street: '',
    city: '',
    state: '',
    zipCode: '',
    phone: '',
  });

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

    const loadCheckoutData = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        
        if (!authUser) {
          router.push('/auth/login?redirect=/checkout');
          return;
        }

        setUser(authUser);
        await Promise.all([
          fetchCart(authUser.id),
          fetchAddresses(authUser.id),
        ]);
      } catch (err) {
        console.error('Error loading checkout:', err);
        setError('Failed to load checkout data');
      } finally {
        setLoading(false);
      }
    };

    loadCheckoutData();
  }, [supabase, router]);

  const fetchCart = async (userId: string) => {
    try {
      const response = await fetch(`/api/cart/${userId}`);
      if (response.ok) {
        const data = await response.json();
        if (!data.items || data.items.length === 0) {
          router.push('/cart');
          return;
        }
        setCartItems(data.items || []);
        setSubtotal(data.subtotal || 0);
      }
    } catch (err) {
      console.error('Failed to fetch cart:', err);
    }
  };

  const fetchAddresses = async (userId: string) => {
    try {
      const response = await fetch(`/api/user/${userId}/addresses`);
      if (response.ok) {
        const data = await response.json();
        setAddresses(data.addresses || []);
        // Select default address if available
        const defaultAddr = data.addresses?.find((a: Address) => a.isDefault);
        if (defaultAddr) {
          setSelectedAddressId(defaultAddr.id);
        } else if (data.addresses?.length > 0) {
          setSelectedAddressId(data.addresses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch addresses:', err);
    }
  };

  const handleAddAddress = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/user/${user.id}/addresses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAddress),
      });

      if (response.ok) {
        const data = await response.json();
        setAddresses([...addresses, data.address]);
        setSelectedAddressId(data.address.id);
        setShowAddAddress(false);
        setNewAddress({
          name: '',
          type: 'HOME',
          street: '',
          city: '',
          state: '',
          zipCode: '',
          phone: '',
        });
      } else {
        setError('Failed to add address');
      }
    } catch (err) {
      console.error('Failed to add address:', err);
      setError('Failed to add address');
    }
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId) {
      setError('Please select a delivery address');
      return;
    }

    if (cartItems.length === 0) {
      setError('Your cart is empty');
      return;
    }

    setProcessing(true);
    setError('');

    try {
      const response = await fetch('/api/checkout/place-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          shippingAddressId: selectedAddressId,
          paymentMethod,
          items: cartItems.map(item => ({
            variantId: item.variant.id,
            productId: item.product.id,
            quantity: item.quantity,
            price: Number(item.variant.price),
          })),
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Trigger cart update in header
        window.dispatchEvent(new CustomEvent('cartUpdated'));
        // Redirect to order confirmation
        router.push(`/checkout/success?orderId=${data.orderId}`);
      } else {
        setError(data.error || 'Failed to place order');
      }
    } catch (err) {
      console.error('Failed to place order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

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

  const shipping = subtotal > 2999 ? 0 : 99;
  const tax = subtotal * 0.18;
  const total = subtotal + shipping + tax;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/cart"
            className="inline-flex items-center text-gray-600 hover:text-primary-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
          </Link>
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-8">Checkout</h1>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-600" />
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Address & Payment */}
          <div className="lg:col-span-2 space-y-6">
            {/* Delivery Address */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Delivery Address
                </h2>
                <button
                  onClick={() => setShowAddAddress(!showAddAddress)}
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1"
                >
                  <Plus className="w-4 h-4" />
                  Add New
                </button>
              </div>

              {showAddAddress && (
                <div className="mb-4 p-4 border border-gray-200 rounded-lg space-y-3">
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={newAddress.name}
                    onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <input
                    type="text"
                    placeholder="Street Address"
                    value={newAddress.street}
                    onChange={(e) => setNewAddress({ ...newAddress, street: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="City"
                      value={newAddress.city}
                      onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="State"
                      value={newAddress.state}
                      onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="PIN Code"
                      value={newAddress.zipCode}
                      onChange={(e) => setNewAddress({ ...newAddress, zipCode: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                    <input
                      type="text"
                      placeholder="Phone Number"
                      value={newAddress.phone}
                      onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                    />
                  </div>
                  <select
                    value={newAddress.type}
                    onChange={(e) => setNewAddress({ ...newAddress, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="HOME">Home</option>
                    <option value="OFFICE">Office</option>
                  </select>
                  <div className="flex gap-2">
                    <button
                      onClick={handleAddAddress}
                      className="flex-1 bg-primary-600 text-white py-2 rounded-lg hover:bg-primary-700"
                    >
                      Save Address
                    </button>
                    <button
                      onClick={() => setShowAddAddress(false)}
                      className="flex-1 border border-gray-300 py-2 rounded-lg hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {addresses.length === 0 ? (
                <p className="text-gray-600">No addresses found. Please add a delivery address.</p>
              ) : (
                <div className="space-y-3">
                  {addresses.map((address) => (
                    <label
                      key={address.id}
                      className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === address.id
                          ? 'border-primary-600 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(e.target.value)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">{address.name}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                              {address.type}
                            </span>
                            {address.isDefault && (
                              <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {address.street}, {address.city}, {address.state} - {address.zipCode}
                          </p>
                          {address.phone && (
                            <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                          )}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h2>

              <div className="space-y-3">
                <label
                  className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'cod'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div>
                      <span className="font-medium text-gray-900">Cash on Delivery</span>
                      <p className="text-sm text-gray-600">Pay when your order arrives</p>
                    </div>
                  </div>
                </label>

                <label
                  className={`block p-4 border rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'prepaid'
                      ? 'border-primary-600 bg-primary-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="payment"
                      value="prepaid"
                      checked={paymentMethod === 'prepaid'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <div>
                      <span className="font-medium text-gray-900">Pay Now (Demo)</span>
                      <p className="text-sm text-gray-600">Simulated online payment - no actual charge</p>
                    </div>
                  </div>
                </label>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-4">
                <Truck className="w-5 h-5" />
                Order Items ({cartItems.length})
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex gap-4 p-3 border-b last:border-b-0">
                    <div className="flex-shrink-0 w-16 h-16 bg-gray-100 rounded overflow-hidden">
                      {item.product.images[0] ? (
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.title}
                          width={64}
                          height={64}
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
                        ₹{(Number(item.variant.price) * item.quantity).toFixed(2)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal ({cartItems.reduce((s, i) => s + i.quantity, 0)} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'FREE' : `₹${shipping.toFixed(2)}`}</span>
                </div>
                {shipping === 0 && (
                  <p className="text-xs text-green-600">🎉 Free shipping applied!</p>
                )}
                <div className="flex justify-between text-gray-600">
                  <span>Tax (GST 18%)</span>
                  <span>₹{tax.toFixed(2)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total</span>
                    <span>₹{total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing || !selectedAddressId || cartItems.length === 0}
                className="w-full bg-primary-600 text-white py-3 rounded-lg hover:bg-primary-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>

              <p className="text-xs text-gray-500 text-center mt-4">
                By placing this order, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
