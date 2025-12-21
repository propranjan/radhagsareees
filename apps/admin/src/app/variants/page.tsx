'use client';

import { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';

interface Variant {
  id: string;
  productId: string;
  productName: string;
  productSlug: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface EditData {
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
}

interface NewVariant {
  productId: string;
  sku: string;
  color: string;
  size: string;
  price: number;
  mrp: number;
  stock: number;
}

const emptyNewVariant: NewVariant = {
  productId: '',
  sku: '',
  color: '',
  size: '',
  price: 0,
  mrp: 0,
  stock: 0,
};

export default function VariantsPage() {
  const [variants, setVariants] = useState<Variant[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<EditData | null>(null);
  const [saving, setSaving] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newVariant, setNewVariant] = useState<NewVariant>(emptyNewVariant);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetchVariants();
  }, [selectedProduct]);

  const fetchVariants = async (page = 1, searchQuery = search) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ page: String(page) });
      if (selectedProduct) params.append('productId', selectedProduct);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/admin/variants?${params}`);
      if (!res.ok) throw new Error('Failed to fetch variants');

      const data = await res.json();
      setVariants(data.variants);
      setProducts(data.products);
      setPagination(data.pagination);
    } catch (error) {
      console.error('Error fetching variants:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchVariants(1, search);
  };

  const startEdit = (variant: Variant) => {
    setEditingId(variant.id);
    setEditData({
      sku: variant.sku,
      color: variant.color,
      size: variant.size,
      price: variant.price,
      mrp: variant.mrp,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditData(null);
  };

  const saveVariant = async (variantId: string) => {
    if (!editData) return;

    try {
      setSaving(true);
      const res = await fetch('/api/admin/variants', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantId,
          ...editData,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to update variant');
      }

      fetchVariants(pagination?.page || 1);
      cancelEdit();
    } catch (error: any) {
      alert(error.message || 'Failed to update variant');
    } finally {
      setSaving(false);
    }
  };

  const createVariant = async () => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newVariant),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to create variant');
      }

      fetchVariants();
      setShowAddModal(false);
      setNewVariant(emptyNewVariant);
    } catch (error: any) {
      alert(error.message || 'Failed to create variant');
    } finally {
      setSaving(false);
    }
  };

  const deleteVariant = async (variantId: string) => {
    try {
      setSaving(true);
      const res = await fetch('/api/admin/variants', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantId }),
      });

      if (!res.ok) throw new Error('Failed to delete variant');

      fetchVariants(pagination?.page || 1);
      setDeleteId(null);
    } catch (error) {
      alert('Failed to delete variant');
    } finally {
      setSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getDiscount = (price: number, mrp: number) => {
    if (mrp <= 0) return 0;
    return Math.round(((mrp - price) / mrp) * 100);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Variants</h1>
            <p className="text-gray-600">Manage product variants (colors, sizes, prices)</p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-rose-600 text-white px-4 py-2 rounded-lg hover:bg-rose-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Variant
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex flex-wrap gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search by SKU, color, size, or product..."
                  className="w-full border border-gray-300 rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
                />
                <svg
                  className="absolute left-3 top-2.5 w-5 h-5 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>

            {/* Product Filter */}
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500 focus:border-rose-500"
            >
              <option value="">All Products</option>
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </select>

            <button
              onClick={handleSearch}
              className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Search
            </button>
          </div>
        </div>

        {/* Variants Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-600 mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading variants...</p>
            </div>
          ) : variants.length === 0 ? (
            <div className="p-8 text-center">
              <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A2 2 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p className="mt-2 text-gray-500">No variants found</p>
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 text-rose-600 hover:text-rose-800"
              >
                Add your first variant
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Color
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Size
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      MRP
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Discount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {variants.map((variant) => (
                    <tr key={variant.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">
                          {variant.productName}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === variant.id ? (
                          <input
                            type="text"
                            value={editData?.sku || ''}
                            onChange={(e) => setEditData({ ...editData!, sku: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-28 focus:ring-2 focus:ring-rose-500"
                          />
                        ) : (
                          <span className="text-sm font-mono text-gray-600">{variant.sku}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === variant.id ? (
                          <input
                            type="text"
                            value={editData?.color || ''}
                            onChange={(e) => setEditData({ ...editData!, color: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:ring-2 focus:ring-rose-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{variant.color}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === variant.id ? (
                          <input
                            type="text"
                            value={editData?.size || ''}
                            onChange={(e) => setEditData({ ...editData!, size: e.target.value })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-20 focus:ring-2 focus:ring-rose-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-900">{variant.size}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === variant.id ? (
                          <input
                            type="number"
                            value={editData?.price || 0}
                            onChange={(e) => setEditData({ ...editData!, price: Number(e.target.value) })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:ring-2 focus:ring-rose-500"
                          />
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">
                            {formatCurrency(variant.price)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {editingId === variant.id ? (
                          <input
                            type="number"
                            value={editData?.mrp || 0}
                            onChange={(e) => setEditData({ ...editData!, mrp: Number(e.target.value) })}
                            className="border border-gray-300 rounded px-2 py-1 text-sm w-24 focus:ring-2 focus:ring-rose-500"
                          />
                        ) : (
                          <span className="text-sm text-gray-500 line-through">
                            {formatCurrency(variant.mrp)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-green-600 font-medium">
                          {editingId === variant.id
                            ? `${getDiscount(editData?.price || 0, editData?.mrp || 0)}%`
                            : `${getDiscount(variant.price, variant.mrp)}%`}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            variant.stock === 0
                              ? 'bg-red-100 text-red-800'
                              : variant.stock <= 10
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-green-100 text-green-800'
                          }`}
                        >
                          {variant.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {editingId === variant.id ? (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => saveVariant(variant.id)}
                              disabled={saving}
                              className="text-green-600 hover:text-green-800 disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save'}
                            </button>
                            <button
                              onClick={cancelEdit}
                              className="text-gray-600 hover:text-gray-800"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-3">
                            <button
                              onClick={() => startEdit(variant)}
                              className="text-rose-600 hover:text-rose-800"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => setDeleteId(variant.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} variants
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => fetchVariants(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <button
                  onClick={() => fetchVariants(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-3 py-1 text-sm border rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Add Variant Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Variant</h2>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product</label>
                    <select
                      value={newVariant.productId}
                      onChange={(e) => setNewVariant({ ...newVariant, productId: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU</label>
                    <input
                      type="text"
                      value={newVariant.sku}
                      onChange={(e) => setNewVariant({ ...newVariant, sku: e.target.value })}
                      placeholder="e.g., SAR-RED-M-001"
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                      <input
                        type="text"
                        value={newVariant.color}
                        onChange={(e) => setNewVariant({ ...newVariant, color: e.target.value })}
                        placeholder="e.g., Red"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Size</label>
                      <input
                        type="text"
                        value={newVariant.size}
                        onChange={(e) => setNewVariant({ ...newVariant, size: e.target.value })}
                        placeholder="e.g., Free Size"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                      <input
                        type="number"
                        value={newVariant.price}
                        onChange={(e) => setNewVariant({ ...newVariant, price: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹)</label>
                      <input
                        type="number"
                        value={newVariant.mrp}
                        onChange={(e) => setNewVariant({ ...newVariant, mrp: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
                      <input
                        type="number"
                        value={newVariant.stock}
                        onChange={(e) => setNewVariant({ ...newVariant, stock: Number(e.target.value) })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                </div>
                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowAddModal(false);
                      setNewVariant(emptyNewVariant);
                    }}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={createVariant}
                    disabled={saving || !newVariant.productId || !newVariant.sku}
                    className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 disabled:opacity-50"
                  >
                    {saving ? 'Creating...' : 'Create Variant'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deleteId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full mx-4 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Delete Variant</h2>
              <p className="text-gray-600 mb-6">
                Are you sure you want to delete this variant? This action cannot be undone.
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setDeleteId(null)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={() => deleteVariant(deleteId)}
                  disabled={saving}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                >
                  {saving ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
