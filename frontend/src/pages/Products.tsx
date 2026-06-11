import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Plus, Edit, Trash2, Package, AlertCircle, DollarSign, Tag, X, Save } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const Products = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [productToDelete, setProductToDelete] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    categoryId: '',
    buyingPrice: '',
    sellingPrice: '',
    stockQuantity: '',
    isService: false,
    reorderLevel: 10
  });
  const [calculatedPrice, setCalculatedPrice] = useState<number | null>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data)
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/products/categories').then(res => res.data)
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: (data: any) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      resetForm();
      setShowModal(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error creating product');
    }
  });

  // Update product mutation
  const updateProductMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.put(`/products/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      resetForm();
      setShowModal(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error updating product');
    }
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
      setShowDeleteConfirm(false);
      setProductToDelete(null);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error deleting product');
    }
  });

  // Update stock mutation
  const updateStockMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => 
      api.put(`/products/${id}/stock`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Stock updated successfully');
    }
  });

  // Calculate selling price
  const calculateSellingPrice = (buyingPrice: number, categoryId: string) => {
    if (!buyingPrice || !categoryId) return null;
    
    const category = categories?.find((c: any) => c.id === categoryId);
    if (category && !category.isService) {
      const markup = category.markupPercentage || 20;
      const calculated = buyingPrice * (1 + markup / 100);
      setCalculatedPrice(calculated);
      return calculated;
    }
    return null;
  };

  const handleBuyingPriceChange = (value: string) => {
    const price = parseFloat(value);
    setFormData({ ...formData, buyingPrice: value });
    
    if (price && formData.categoryId && !formData.isService) {
      const calculated = calculateSellingPrice(price, formData.categoryId);
      if (calculated) {
        setFormData({ ...formData, sellingPrice: calculated.toFixed(2), buyingPrice: value });
      }
    }
  };

  const handleCategoryChange = (categoryId: string) => {
    const category = categories?.find((c: any) => c.id === categoryId);
    setFormData({ ...formData, categoryId, isService: category?.isService || false });
    
    if (category?.isService) {
      setFormData(prev => ({ ...prev, sellingPrice: '', buyingPrice: '' }));
    } else if (formData.buyingPrice) {
      const calculated = calculateSellingPrice(parseFloat(formData.buyingPrice), categoryId);
      if (calculated) {
        setFormData(prev => ({ ...prev, sellingPrice: calculated.toFixed(2) }));
      }
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      sku: '',
      categoryId: '',
      buyingPrice: '',
      sellingPrice: '',
      stockQuantity: '',
      isService: false,
      reorderLevel: 10
    });
    setCalculatedPrice(null);
    setEditingProduct(null);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      sku: product.sku,
      categoryId: product.categoryId,
      buyingPrice: product.buyingPrice?.toString() || '',
      sellingPrice: product.sellingPrice?.toString() || '',
      stockQuantity: product.stockQuantity?.toString() || '0',
      isService: product.isService || false,
      reorderLevel: product.reorderLevel || 10
    });
    setShowModal(true);
  };

  const handleDelete = (product: any) => {
    setProductToDelete(product);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const productData = {
      name: formData.name,
      sku: formData.sku,
      categoryId: formData.categoryId,
      buyingPrice: formData.buyingPrice ? parseFloat(formData.buyingPrice) : null,
      sellingPrice: formData.isService 
        ? parseFloat(formData.sellingPrice) 
        : (calculatedPrice || parseFloat(formData.sellingPrice)),
      stockQuantity: formData.isService ? 0 : parseInt(formData.stockQuantity) || 0,
      isService: formData.isService,
      reorderLevel: formData.reorderLevel
    };
    
    if (editingProduct) {
      updateProductMutation.mutate({ id: editingProduct.id, data: productData });
    } else {
      createProductMutation.mutate(productData);
    }
  };

  const handleStockUpdate = async (productId: string, type: 'add' | 'subtract', quantity: number) => {
    if (quantity <= 0) {
      toast.error('Please enter a valid quantity');
      return;
    }
    updateStockMutation.mutate({ id: productId, data: { type, quantity } });
  };

  if (productsLoading || categoriesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Products</h1>
          <p className="text-gray-500 mt-1">Manage your inventory and services</p>
        </div>
        {user?.role === 'ADMIN' && (
          <button
            onClick={() => {
              resetForm();
              setShowModal(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Plus className="w-5 h-5" />
            Add Product
          </button>
        )}
      </div>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Buying Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Selling Price</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {products?.map((product: any) => (
                <tr key={product.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{product.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.sku}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{product.category?.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                    {product.buyingPrice ? `KES ${product.buyingPrice.toLocaleString()}` : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-gray-900">
                    KES {product.sellingPrice.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        product.stockQuantity <= product.reorderLevel 
                          ? 'bg-red-100 text-red-700' 
                          : 'bg-green-100 text-green-700'
                      }`}>
                        {product.stockQuantity} {product.unit}s
                      </span>
                      {user?.role === 'ADMIN' && !product.isService && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => handleStockUpdate(product.id, 'add', 1)}
                            className="text-xs bg-green-100 text-green-700 px-1 py-0.5 rounded hover:bg-green-200"
                            title="Add stock"
                          >
                            +1
                          </button>
                          <button
                            onClick={() => handleStockUpdate(product.id, 'subtract', 1)}
                            className="text-xs bg-red-100 text-red-700 px-1 py-0.5 rounded hover:bg-red-200"
                            title="Remove stock"
                          >
                            -1
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    {user?.role === 'ADMIN' && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleEdit(product)}
                          className="text-blue-600 hover:text-blue-800 transition p-1"
                          title="Edit product"
                        >
                          <Edit className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(product)}
                          className="text-red-600 hover:text-red-800 transition p-1"
                          title="Delete product"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {products?.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No products found</p>
            <button
              onClick={() => setShowModal(true)}
              className="mt-2 text-blue-600 hover:text-blue-700"
            >
              Add your first product
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Product Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingProduct ? 'Edit Product' : 'Add New Product'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetForm();
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SKU (Stock Keeping Unit) *
                </label>
                <input
                  type="text"
                  value={formData.sku}
                  onChange={(e) => setFormData({...formData, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <select
                  value={formData.categoryId}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a category</option>
                  {categories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name} {cat.isService ? '(Service)' : `(${cat.markupPercentage}% markup)`}
                    </option>
                  ))}
                </select>
              </div>

              {!formData.isService && formData.categoryId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Buying Price (KES)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.buyingPrice}
                    onChange={(e) => handleBuyingPriceChange(e.target.value)}
                    placeholder="Enter cost price"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {calculatedPrice && (
                    <p className="text-xs text-green-600 mt-1">
                      Selling price will be: KES {calculatedPrice.toFixed(2)} (including markup)
                    </p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Selling Price (KES) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({...formData, sellingPrice: e.target.value})}
                  placeholder={formData.isService ? "Enter service price" : "Auto-calculated or manual"}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                {!formData.isService && formData.buyingPrice && formData.categoryId && !formData.sellingPrice && (
                  <p className="text-xs text-blue-600 mt-1">
                    Leave empty to auto-calculate from buying price
                  </p>
                )}
              </div>

              {!formData.isService && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Initial Stock Quantity
                    </label>
                    <input
                      type="number"
                      value={formData.stockQuantity}
                      onChange={(e) => setFormData({...formData, stockQuantity: e.target.value})}
                      placeholder="Number of units"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Level
                    </label>
                    <input
                      type="number"
                      value={formData.reorderLevel}
                      onChange={(e) => setFormData({...formData, reorderLevel: parseInt(e.target.value)})}
                      placeholder="Alert when stock reaches this level"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}

              {formData.isService && (
                <div className="bg-blue-50 p-3 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <Tag className="w-4 h-4 inline mr-1" />
                    This is a service item (no stock tracking)
                  </p>
                </div>
              )}

              <div className="flex gap-2 pt-4">
                <button
                  type="submit"
                  disabled={createProductMutation.isPending || updateProductMutation.isPending}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {createProductMutation.isPending || updateProductMutation.isPending 
                    ? 'Saving...' 
                    : (editingProduct ? 'Update Product' : 'Create Product')
                  }
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && productToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete <strong>{productToDelete.name}</strong>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={confirmDelete}
                disabled={deleteProductMutation.isPending}
                className="flex-1 bg-red-600 text-white py-2 rounded-lg font-semibold hover:bg-red-700 transition disabled:opacity-50"
              >
                {deleteProductMutation.isPending ? 'Deleting...' : 'Yes, Delete'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setProductToDelete(null);
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;