import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Plus, Edit, Trash2, Eye, EyeOff, Package, DollarSign, Tag } from 'lucide-react';
import { toast } from 'sonner';

const AdminServices = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'printing',
    priceType: 'fixed',
    basePrice: 0,
    unitPrice: null as number | null,
    minQuantity: 1,
    maxQuantity: null as number | null
  });

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      // Use admin endpoint with authentication
      const response = await api.get('/services/admin/catalog');
      setServices(response.data);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingService) {
        await api.put(`/services/admin/services/${editingService.id}`, formData);
        toast.success('Service updated successfully');
      } else {
        await api.post('/services/admin/services', formData);
        toast.success('Service created successfully');
      }
      setShowModal(false);
      setEditingService(null);
      resetForm();
      fetchServices();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error(error.response?.data?.message || 'Error saving service');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Delete "${name}"? This cannot be undone.`)) {
      try {
        await api.delete(`/services/admin/services/${id}`);
        toast.success('Service deleted');
        fetchServices();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Cannot delete service with orders');
      }
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await api.put(`/services/admin/services/${id}`, { isActive: !currentStatus });
      toast.success(`Service ${!currentStatus ? 'activated' : 'deactivated'}`);
      fetchServices();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      category: 'printing',
      priceType: 'fixed',
      basePrice: 0,
      unitPrice: null,
      minQuantity: 1,
      maxQuantity: null
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const categories = [
    { value: 'printing', label: '🖨️ Printing', color: 'blue' },
    { value: 'editing', label: '📝 Editing', color: 'purple' },
    { value: 'checking', label: '🔍 Plagiarism/AI Check', color: 'green' },
    { value: 'design', label: '🎨 Design', color: 'pink' },
    { value: 'stationery', label: '📚 Stationery', color: 'orange' },
    { value: 'electronics', label: '💻 Electronics', color: 'cyan' }
  ];

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Service Management</h1>
          <p className="text-gray-500 mt-1">Manage all services, prices, and categories</p>
        </div>
        <button
          onClick={() => {
            setEditingService(null);
            resetForm();
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          Add New Service
        </button>
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
            <div className={`p-4 ${
              !service.isActive ? 'bg-gray-100' : 
              service.category === 'printing' ? 'bg-blue-50' :
              service.category === 'editing' ? 'bg-purple-50' :
              service.category === 'checking' ? 'bg-green-50' : 'bg-gray-50'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{service.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{service.description}</p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => toggleActive(service.id, service.isActive)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                    title={service.isActive ? 'Deactivate' : 'Activate'}
                  >
                    {service.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => {
                      setEditingService(service);
                      setFormData({
                        name: service.name,
                        description: service.description || '',
                        category: service.category,
                        priceType: service.priceType,
                        basePrice: service.basePrice,
                        unitPrice: service.unitPrice,
                        minQuantity: service.minQuantity,
                        maxQuantity: service.maxQuantity
                      });
                      setShowModal(true);
                    }}
                    className="p-1 text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(service.id, service.name)}
                    className="p-1 text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">Price:</span>
                <span className="font-bold text-blue-600">
                  {service.priceType === 'fixed' ? `KES ${service.basePrice}` :
                   service.priceType === 'per_page' ? `KES ${service.basePrice}/page` :
                   service.priceType === 'per_chapter' ? `KES ${service.basePrice}/chapter` :
                   `KES ${service.basePrice} + ${service.unitPrice}/unit`}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Status:</span>
                <span className={`text-xs px-2 py-1 rounded-full ${service.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No services created yet</p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 text-blue-600 hover:text-blue-700"
          >
            Create your first service
          </button>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingService ? 'Edit Service' : 'Add New Service'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Service Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  className="w-full p-2 border rounded"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Price Type *</label>
                <select
                  value={formData.priceType}
                  onChange={(e) => setFormData({...formData, priceType: e.target.value})}
                  className="w-full p-2 border rounded"
                >
                  <option value="fixed">Fixed Price</option>
                  <option value="per_page">Per Page</option>
                  <option value="per_chapter">Per Chapter</option>
                  <option value="variable">Base + Variable</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Base Price (KES) *</label>
                <input
                  type="number"
                  value={formData.basePrice}
                  onChange={(e) => setFormData({...formData, basePrice: parseFloat(e.target.value)})}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              {formData.priceType === 'variable' && (
                <div>
                  <label className="block text-sm font-medium mb-1">Unit Price (KES)</label>
                  <input
                    type="number"
                    value={formData.unitPrice || ''}
                    onChange={(e) => setFormData({...formData, unitPrice: parseFloat(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Min Quantity</label>
                  <input
                    type="number"
                    value={formData.minQuantity}
                    onChange={(e) => setFormData({...formData, minQuantity: parseInt(e.target.value)})}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Max Quantity</label>
                  <input
                    type="number"
                    value={formData.maxQuantity || ''}
                    onChange={(e) => setFormData({...formData, maxQuantity: parseInt(e.target.value) || null})}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                  {editingService ? 'Update' : 'Create'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
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

export default AdminServices;