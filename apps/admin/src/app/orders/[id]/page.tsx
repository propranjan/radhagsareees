'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import AdminLayout from '@/components/AdminLayout';
import Link from 'next/link';
import {
  ArrowLeft,
  Package,
  User,
  MapPin,
  CreditCard,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  ExternalLink,
  FileText,
  RefreshCw,
  Warehouse,
} from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  total: number;
  productTitle: string;
  productImage?: string;
  variantSku?: string;
  variantColor?: string;
  variantSize?: string;
}

interface Payment {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionId?: string;
}

interface ShippingAddress {
  name: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone?: string;
}

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
  currentLocation?: string;
}

interface WarehouseOption {
  id: string;
  name: string;
  city: string;
  shiprocketPickupId?: number;
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  tax: number;
  shipping: number;
  discount: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  items: OrderItem[];
  payment?: Payment;
  shippingAddress?: ShippingAddress;
  fulfillments: Fulfillment[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  PROCESSING: 'bg-blue-100 text-blue-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

const FULFILLMENT_STATUS_COLORS: Record<string, string> = {
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

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warehouses, setWarehouses] = useState<WarehouseOption[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [creatingShipment, setCreatingShipment] = useState(false);
  const [showShipmentModal, setShowShipmentModal] = useState(false);

  useEffect(() => {
    fetchOrder();
    fetchWarehouses();
  }, [id]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/orders/${id}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch order');
      }

      setOrder(data.order);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const response = await fetch('/api/admin/warehouses?activeOnly=true');
      const data = await response.json();
      
      if (response.ok) {
        setWarehouses(data.warehouses.filter((w: WarehouseOption) => w.shiprocketPickupId));
        if (data.warehouses.length > 0) {
          setSelectedWarehouse(data.warehouses[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch warehouses:', err);
    }
  };

  const createShipment = async () => {
    if (!selectedWarehouse) {
      setError('Please select a warehouse');
      return;
    }

    setCreatingShipment(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/shipments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: id,
          warehouseId: selectedWarehouse,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create shipment');
      }

      setShowShipmentModal(false);
      await fetchOrder();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreatingShipment(false);
    }
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

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        </div>
      </AdminLayout>
    );
  }

  if (error && !order) {
    return (
      <AdminLayout>
        <div className="text-center py-12">
          <XCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
          <p className="text-red-600">{error}</p>
          <Link href="/orders" className="text-primary-600 hover:underline mt-4 inline-block">
            ← Back to Orders
          </Link>
        </div>
      </AdminLayout>
    );
  }

  if (!order) return null;

  const hasActiveShipment = order.fulfillments.some(
    f => !['CANCELLED', 'RTO_DELIVERED'].includes(f.status)
  );

  const canCreateShipment = 
    !hasActiveShipment &&
    order.status !== 'CANCELLED' &&
    order.status !== 'DELIVERED' &&
    order.shippingAddress &&
    order.payment?.status === 'COMPLETED';

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/orders"
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <p className="text-gray-600">{formatDate(order.createdAt)}</p>
            </div>
          </div>
          <span className={`px-3 py-1 text-sm font-semibold rounded-full ${STATUS_COLORS[order.status]}`}>
            {order.status}
          </span>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
            {error}
            <button
              onClick={() => setError(null)}
              className="float-right text-red-500 hover:text-red-700"
            >
              ×
            </button>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Items */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Items
              </h2>
              <div className="divide-y">
                {order.items.map((item) => (
                  <div key={item.id} className="py-4 flex items-center gap-4">
                    {item.productImage ? (
                      <img
                        src={item.productImage}
                        alt={item.productTitle}
                        className="w-16 h-16 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Package className="w-6 h-6 text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1">
                      <p className="font-medium">{item.productTitle}</p>
                      {item.variantSku && (
                        <p className="text-sm text-gray-500">
                          SKU: {item.variantSku}
                          {item.variantColor && ` • ${item.variantColor}`}
                          {item.variantSize && ` • ${item.variantSize}`}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                    </div>
                    <p className="font-medium">₹{Number(item.total).toLocaleString()}</p>
                  </div>
                ))}
              </div>

              {/* Order Summary */}
              <div className="border-t mt-4 pt-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₹{(order.totalAmount - order.tax - order.shipping + order.discount).toLocaleString()}</span>
                </div>
                {order.discount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount</span>
                    <span>-₹{order.discount.toLocaleString()}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Tax</span>
                  <span>₹{order.tax.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Shipping</span>
                  <span>₹{order.shipping.toLocaleString()}</span>
                </div>
                <div className="flex justify-between font-semibold text-lg border-t pt-2">
                  <span>Total</span>
                  <span>₹{order.totalAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Fulfillments/Shipments */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Shipments
                </h2>
                {canCreateShipment && (
                  <button
                    onClick={() => setShowShipmentModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm"
                  >
                    <Truck className="w-4 h-4" />
                    Create Shipment
                  </button>
                )}
              </div>

              {order.fulfillments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Truck className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No shipments created yet</p>
                  {!canCreateShipment && order.payment?.status !== 'COMPLETED' && (
                    <p className="text-sm mt-2">Payment must be completed before shipping</p>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  {order.fulfillments.map((fulfillment) => (
                    <div
                      key={fulfillment.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{fulfillment.courierName}</p>
                          <p className="text-sm text-gray-500">AWB: {fulfillment.awbCode}</p>
                        </div>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${FULFILLMENT_STATUS_COLORS[fulfillment.status]}`}>
                          {fulfillment.status.replace(/_/g, ' ')}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Pickup Scheduled</p>
                          <p>{formatDate(fulfillment.pickupScheduledDate)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Picked Up</p>
                          <p>{formatDate(fulfillment.pickedUpAt)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Expected Delivery</p>
                          <p>{formatDate(fulfillment.estimatedDelivery)}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Delivered</p>
                          <p>{formatDate(fulfillment.deliveredAt)}</p>
                        </div>
                      </div>

                      {fulfillment.currentLocation && (
                        <div className="text-sm">
                          <p className="text-gray-500">Current Location</p>
                          <p className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {fulfillment.currentLocation}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t">
                        {fulfillment.trackingUrl && (
                          <a
                            href={fulfillment.trackingUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Track Shipment
                          </a>
                        )}
                        {fulfillment.labelUrl && (
                          <a
                            href={fulfillment.labelUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary-600 hover:underline"
                          >
                            <FileText className="w-4 h-4" />
                            Print Label
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Info */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer
              </h2>
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-sm text-gray-500">{order.customerEmail}</p>
              </div>
            </div>

            {/* Shipping Address */}
            {order.shippingAddress && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Shipping Address
                </h2>
                <div className="text-sm space-y-1">
                  <p className="font-medium">{order.shippingAddress.name}</p>
                  <p>{order.shippingAddress.street}</p>
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} -{' '}
                    {order.shippingAddress.zipCode}
                  </p>
                  <p>{order.shippingAddress.country}</p>
                  {order.shippingAddress.phone && (
                    <p className="text-gray-500">Phone: {order.shippingAddress.phone}</p>
                  )}
                </div>
              </div>
            )}

            {/* Payment Info */}
            {order.payment && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </h2>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Method</span>
                    <span className="font-medium">{order.payment.method}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      order.payment.status === 'COMPLETED' 
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {order.payment.status}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount</span>
                    <span className="font-medium">₹{Number(order.payment.amount).toLocaleString()}</span>
                  </div>
                  {order.payment.transactionId && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="text-sm font-mono">{order.payment.transactionId}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Shipment Modal */}
      {showShipmentModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Create Shipment
              </h2>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Warehouse (Pickup Location)
                </label>
                {warehouses.length === 0 ? (
                  <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                    No warehouses with Shiprocket pickup location configured.
                    <Link href="/warehouses" className="block mt-2 text-primary-600 hover:underline">
                      Configure Warehouses →
                    </Link>
                  </div>
                ) : (
                  <select
                    value={selectedWarehouse}
                    onChange={(e) => setSelectedWarehouse(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  >
                    {warehouses.map((warehouse) => (
                      <option key={warehouse.id} value={warehouse.id}>
                        {warehouse.name} ({warehouse.city})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="bg-gray-50 p-3 rounded-lg text-sm">
                <p className="font-medium mb-2">This will:</p>
                <ul className="list-disc list-inside space-y-1 text-gray-600">
                  <li>Create order in Shiprocket</li>
                  <li>Generate AWB (tracking number)</li>
                  <li>Schedule pickup from warehouse</li>
                  <li>Generate shipping label</li>
                </ul>
              </div>

              {error && (
                <div className="text-sm text-red-600 bg-red-50 p-3 rounded-lg">
                  {error}
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowShipmentModal(false);
                    setError(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={createShipment}
                  disabled={creatingShipment || warehouses.length === 0}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50"
                >
                  {creatingShipment ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Truck className="w-4 h-4" />
                      Create Shipment
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
