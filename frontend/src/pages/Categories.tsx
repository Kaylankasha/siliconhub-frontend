import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit, Save, X, Trash2, Package, AlertCircle, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const Categories = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<number>(0);
  const [newCategory, setNewCategory] = useState({
    name: '',
    description: '',
    markupPercentage: 20,
    isService: false
  });

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const response = await api.get('/products/categories');
      setCategories(response.data);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  // Create category
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/products/categories', newCategory);
      toast.success('Category created successfully');
      setShowModal(false);
      setNewCategory({ name: '', description: '', markupPercentage: 20, isService: false });
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error creating category');
    }
  };

  // Update markup
  const handleUpdateMarkup = async (id: string) => {
    try {
      const response = await api.put(`/products/categories/${id}/markup`, { markupPercentage: editValue });
      toast.success(`Markup updated! ${response.data.productsUpdated} products were updated`);
      setEditingId(null);
      fetchCategories();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error updating markup');
    }
  };

  // Delete category
  const handleDeleteCategory = async (id: string, name: string) => {
    if (confirm(`Delete category "${name}"? This cannot be undone.`)) {
      try {
        await api.delete(`/products/categories/${id}`);
        toast.success('Category deleted');
        fetchCategories();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Cannot delete category with products');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const productCategories = categories.filter(c => !c.isService);
  const serviceCategories = categories.filter(c => c.isService);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
          <p className="text-gray-500 mt-1">Manage product and service categories</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          New Category
        </button>
      </div>

      {/* Product Categories */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Package className="w-5 h-5" />
            Product Categories
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Markup %</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Products</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {productCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.description || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    {editingId === cat.id ? (
                      <div className="flex items-center justify-center gap-2">
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(parseInt(e.target.value) || 0)}
                          className="w-24 px-2 py-1 border rounded text-center"
                          step="5"
                        />
                        <button onClick={() => handleUpdateMarkup(cat.id)} className="text-green-600">
                          <Save className="w-4 h-4" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="text-red-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded">
                        <TrendingUp className="w-3 h-3" />
                        {cat.markupPercentage}%
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">{cat.products?.length || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => {
                        setEditingId(cat.id);
                        setEditValue(cat.markupPercentage);
                      }}
                      className="text-blue-600 hover:text-blue-800 mx-1"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="text-red-600 hover:text-red-800 mx-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                   </td>
                 </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Categories */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            Service Categories
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
                <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Description</th>
                <th className="px-6 py-3 text-center text-sm font-medium text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {serviceCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{cat.name}</td>
                  <td className="px-6 py-4 text-gray-500">{cat.description || '-'}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => handleDeleteCategory(cat.id, cat.name)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Category Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Create New Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <input
                type="text"
                placeholder="Category Name *"
                value={newCategory.name}
                onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                className="w-full p-2 border rounded"
                required
              />
              <textarea
                placeholder="Description"
                value={newCategory.description}
                onChange={(e) => setNewCategory({...newCategory, description: e.target.value})}
                className="w-full p-2 border rounded"
                rows={2}
              />
              <select
                value={newCategory.isService ? 'service' : 'product'}
                onChange={(e) => setNewCategory({...newCategory, isService: e.target.value === 'service'})}
                className="w-full p-2 border rounded"
              >
                <option value="product">Product (auto price calculation)</option>
                <option value="service">Service (manual pricing)</option>
              </select>
              {!newCategory.isService && (
                <input
                  type="number"
                  placeholder="Markup Percentage %"
                  value={newCategory.markupPercentage}
                  onChange={(e) => setNewCategory({...newCategory, markupPercentage: parseInt(e.target.value) || 0})}
                  className="w-full p-2 border rounded"
                />
              )}
              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded">
                  Create
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;