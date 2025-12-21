'use client';

import { useState, useEffect } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { 
  Package, 
  Search, 
  AlertTriangle, 
  XCircle, 
  CheckCircle,
  Edit3,
  Save,
  X,
  RefreshCw,
} from 'lucide-react';

interface InventoryItem {
  id: string;
  variantId: string;
  sku: string;
  qtyAvailable: number;
  qtyReserved: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  product: {
    id: string;
    title: string;
    slug: string;
    image: string | null;
  };
  variant: {
    color: string | null;
    size: string | null;
    price: number;
  };
  updatedAt: string;
}

interface InventorySummary {
  total: number;
  lowStock: number;
  outOfStock: number;
  inStock: number;
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [summary, setSummary] = useState<InventorySummary>({
    total: 0,
    lowStock: 0,
    outOfStock: 0,
    inStock: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ qty: number; threshold: number }>({ qty: 0, threshold: 5 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchInventory();
  }, [filter]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filter !== 'all') params.set('filter', filter);
      if (search) params.set('search', search);

      const response = await fetch(`/api/admin/inventory?${params}`);
      if (response.ok) {
        const data = await response.json();
        setInventory(data.items || []);
        setSummary(data.summary || { total: 0, lowStock: 0, outOfStock: 0, inStock: 0 });
      }
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchInventory();
  };

  const startEditing = (item: InventoryItem) => {
    setEditingId(item.id);
    setEditValues({
      qty: item.qtyAvailable,
      threshold: item.lowStockThreshold,
    });
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValues({ qty: 0, threshold: 5 });
  };

  const saveInventory = async (inventoryId: string) => {
    try {
      setSaving(true);
      const response = await fetch('/api/admin/inventory', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inventoryId,
          qtyAvailable: editValues.qty,
          lowStockThreshold: editValues.threshold,
        }),
      });

      if (response.ok) {
        // Update local state
        setInventory((prev) =>
          prev.map((item) =>
            item.id === inventoryId
              ? {
                  ...item,
                  qtyAvailable: editValues.qty,
                  lowStockThreshold: editValues.threshold,
                  isLowStock: editValues.qty <= editValues.threshold && editValues.qty > 0,
                  isOutOfStock: editValues.qty === 0,
                }
              : item
          )
        );
        setEditingId(null);
      }
    } catch (error) {
      console.error('Failed to save inventory:', error);
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (item: InventoryItem) => {
    if (item.isOutOfStock) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
          <XCircle className="w-3 h-3 mr-1" />
          Out of Stock
        </span>
      );
    }
    if (item.isLowStock) {
      return (
        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
          <AlertTriangle className="w-3 h-3 mr-1" />
          Low Stock
        </span>
      );
    }
    return (
      <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        In Stock
      </span>
    );
  };

  // Filter inventory based on search
  const filteredInventory = inventory.filter((item) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      item.product.title.toLowerCase().includes(searchLower) ||
      item.sku.toLowerCase().includes(searchLower) ||
      item.variant.color?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Inventory Management</h1>
            <p className="text-gray-600 mt-1">Manage stock levels and thresholds</p>
          </div>
          <button
            onClick={fetchInventory}
            className="inline-flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-gray-600">Total Items</p>
            <p className="text-2xl font-bold text-gray-900">{summary.total}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-green-600">In Stock</p>
            <p className="text-2xl font-bold text-green-600">{summary.inStock}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-yellow-600">Low Stock</p>
            <p className="text-2xl font-bold text-yellow-600">{summary.lowStock}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <p className="text-sm text-red-600">Out of Stock</p>
            <p className="text-2xl font-bold text-red-600">{summary.outOfStock}</p>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Filter Tabs */}
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'All' },
                { value: 'low-stock', label: 'Low Stock' },
                { value: 'out-of-stock', label: 'Out of Stock' },
              ].map((tab) => (
                <button
                  key={tab.value}
                  onClick={() => setFilter(tab.value)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    filter === tab.value
                      ? 'bg-primary-100 text-primary-700'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by product, SKU, or color..."
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

        {/* Inventory Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
            </div>
          ) : filteredInventory.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Package className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p>No inventory items found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Variant
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Threshold
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredInventory.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {item.product.image ? (
                            <img
                              src={item.product.image}
                              alt={item.product.title}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-gray-200 flex items-center justify-center">
                              <Package className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
                              {item.product.title}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                        {item.sku}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {item.variant.color && <span>{item.variant.color}</span>}
                        {item.variant.size && <span> / {item.variant.size}</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(item)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.qty}
                            onChange={(e) => setEditValues({ ...editValues, qty: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <span className={`text-sm font-medium ${
                            item.isOutOfStock ? 'text-red-600' : item.isLowStock ? 'text-yellow-600' : 'text-gray-900'
                          }`}>
                            {item.qtyAvailable}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === item.id ? (
                          <input
                            type="number"
                            min="0"
                            value={editValues.threshold}
                            onChange={(e) => setEditValues({ ...editValues, threshold: parseInt(e.target.value) || 0 })}
                            className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-primary-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">{item.lowStockThreshold}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === item.id ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => saveInventory(item.id)}
                              disabled={saving}
                              className="p-1 text-green-600 hover:text-green-700 disabled:opacity-50"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="p-1 text-gray-600 hover:text-gray-700"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEditing(item)}
                            className="p-1 text-primary-600 hover:text-primary-700"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
