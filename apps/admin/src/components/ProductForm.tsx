'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Minus, Save, ArrowLeft } from 'lucide-react';
import { ProductCreationData, productCreationSchema } from '../../lib/validations';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductCreationData>;
}

export default function ProductForm({ productId, initialData }: ProductFormProps) {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<ProductCreationData>({
    resolver: zodResolver(productCreationSchema),
    defaultValues: initialData || {
      product: {
        title: '',
        slug: '',
        description: '',
        care: '',
        images: [''],
        categoryId: '',
        isActive: true,
        isNew: false,
        isFeatured: false,
      },
      variants: [
        {
          sku: '',
          color: '',
          size: 'Free Size',
          mrp: 0,
          price: 0,
          inventory: {
            qtyAvailable: 0,
            lowStockThreshold: 5,
          },
        },
      ],
    },
  });

  const { fields: variantFields, append: addVariant, remove: removeVariant } = useFieldArray({
    control,
    name: 'variants',
  });

  const { fields: imageFields, append: addImage, remove: removeImage } = useFieldArray({
    control,
    name: 'product.images',
  });

  const title = watch('product.title');

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !productId) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setValue('product.slug', slug);
    }
  }, [title, setValue, productId]);

  useEffect(() => {
    fetchCategories();
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/admin/categories');
      const data = await response.json();
      setCategories(data);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    }
  };

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/admin/products/${productId}`);
      const product = await response.json();
      
      // Transform the data to match form structure
      const formData: ProductCreationData = {
        product: {
          title: product.title,
          slug: product.slug,
          description: product.description,
          care: product.care,
          images: product.images,
          categoryId: product.categoryId,
          isActive: product.isActive,
          isNew: product.isNew,
          isFeatured: product.isFeatured,
        },
        variants: product.variants.map((variant: any) => ({
          sku: variant.sku,
          color: variant.color,
          size: variant.size,
          mrp: variant.mrp,
          price: variant.price,
          inventory: {
            qtyAvailable: variant.inventory.qtyAvailable,
            lowStockThreshold: variant.inventory.lowStockThreshold,
          },
        })),
      };
      
      // Reset form with fetched data
      Object.entries(formData.product).forEach(([key, value]) => {
        setValue(`product.${key as keyof typeof formData.product}`, value);
      });
      
      // Clear existing variants and set new ones
      while (variantFields.length > 0) {
        removeVariant(0);
      }
      formData.variants.forEach((variant) => {
        addVariant(variant);
      });
      
    } catch (error) {
      console.error('Failed to fetch product:', error);
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: ProductCreationData) => {
    try {
      setSubmitting(true);
      
      const url = productId 
        ? `/api/admin/products/${productId}` 
        : '/api/admin/products';
      
      const method = productId ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Failed to save product');
      }

      const result = await response.json();
      router.push(`/products/${result.id}`);
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Failed to save product. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {productId ? 'Edit Product' : 'Create Product'}
          </h1>
          <p className="text-gray-600">
            {productId ? 'Update product information' : 'Add a new product to your catalog'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Basic Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Product Title *
              </label>
              <input
                {...register('product.title')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product title"
              />
              {errors.product?.title && (
                <p className="text-red-500 text-sm mt-1">{errors.product.title.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug *
              </label>
              <input
                {...register('product.slug')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="product-url-slug"
              />
              {errors.product?.slug && (
                <p className="text-red-500 text-sm mt-1">{errors.product.slug.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                {...register('product.categoryId')}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              {errors.product?.categoryId && (
                <p className="text-red-500 text-sm mt-1">{errors.product.categoryId.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                {...register('product.description')}
                rows={4}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter product description"
              />
              {errors.product?.description && (
                <p className="text-red-500 text-sm mt-1">{errors.product.description.message}</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Care Instructions *
              </label>
              <textarea
                {...register('product.care')}
                rows={3}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter care instructions"
              />
              {errors.product?.care && (
                <p className="text-red-500 text-sm mt-1">{errors.product.care.message}</p>
              )}
            </div>
          </div>

          {/* Product Settings */}
          <div className="mt-6 space-y-4">
            <h3 className="text-md font-medium text-gray-900">Settings</h3>
            <div className="flex flex-wrap gap-6">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('product.isActive')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Active</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('product.isNew')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">New Product</span>
              </label>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  {...register('product.isFeatured')}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">Featured</span>
              </label>
            </div>
          </div>
        </div>

        {/* Product Images */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Product Images</h2>
            <button
              type="button"
              onClick={() => addImage('')}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Image
            </button>
          </div>

          <div className="space-y-4">
            {imageFields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-4">
                <div className="flex-1">
                  <input
                    {...register(`product.images.${index}`)}
                    placeholder="Image URL"
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.product?.images?.[index] && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.product.images[index]?.message}
                    </p>
                  )}
                </div>
                {imageFields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Variants */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-gray-900">Product Variants</h2>
            <button
              type="button"
              onClick={() => addVariant({
                sku: '',
                color: '',
                size: 'Free Size',
                mrp: 0,
                price: 0,
                inventory: {
                  qtyAvailable: 0,
                  lowStockThreshold: 5,
                },
              })}
              className="inline-flex items-center px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1" />
              Add Variant
            </button>
          </div>

          <div className="space-y-6">
            {variantFields.map((field, index) => (
              <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-md font-medium text-gray-900">Variant {index + 1}</h3>
                  {variantFields.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeVariant(index)}
                      className="text-red-600 hover:bg-red-50 p-2 rounded-lg"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                    <input
                      {...register(`variants.${index}.sku`)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="SKU code"
                    />
                    {errors.variants?.[index]?.sku && (
                      <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.sku?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Color *</label>
                    <input
                      {...register(`variants.${index}.color`)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Color name"
                    />
                    {errors.variants?.[index]?.color && (
                      <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.color?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                    <input
                      {...register(`variants.${index}.size`)}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Size"
                    />
                    {errors.variants?.[index]?.size && (
                      <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.size?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">MRP (₹) *</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.mrp`, { valueAsNumber: true })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.variants?.[index]?.mrp && (
                      <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.mrp?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.price`, { valueAsNumber: true })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.variants?.[index]?.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.variants[index]?.price?.message}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Stock Qty *</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.inventory.qtyAvailable`, { valueAsNumber: true })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0"
                    />
                    {errors.variants?.[index]?.inventory?.qtyAvailable && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.variants[index]?.inventory?.qtyAvailable?.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Low Stock Alert</label>
                    <input
                      type="number"
                      {...register(`variants.${index}.inventory.lowStockThreshold`, { valueAsNumber: true })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="5"
                    />
                    {errors.variants?.[index]?.inventory?.lowStockThreshold && (
                      <p className="text-red-500 text-sm mt-1">
                        {errors.variants[index]?.inventory?.lowStockThreshold?.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-4">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {submitting ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            {submitting ? 'Saving...' : 'Save Product'}
          </button>
        </div>
      </form>
    </div>
  );
}