import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Truck, MapPin, Plus, Edit, Trash2, Save, X, DollarSign, Navigation } from 'lucide-react';
import { toast } from 'sonner';

const DeliverySettings = () => {
  const [deliveryMethods, setDeliveryMethods] = useState<any[]>([]);
  const [locationFees, setLocationFees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingMethod, setEditingMethod] = useState<any>(null);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [newLocation, setNewLocation] = useState({ location: '', fee: 0 });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [methodsRes, feesRes] = await Promise.all([
        api.get('/delivery/settings'),
        api.get('/delivery/location-fees')
      ]);
      setDeliveryMethods(methodsRes.data);
      setLocationFees(feesRes.data);
    } catch (error: any) {
      console.error('Error fetching delivery settings:', error);
      // Set default values if endpoints don't exist yet
      setDeliveryMethods([
        { method: 'pickup', name: 'Pickup', baseFee: 0, isActive: true, estimatedDays: 'Same day' },
        { method: 'delivery', name: 'Delivery', baseFee: 200, isActive: true, estimatedDays: '1-3 days' },
        { method: 'courier', name: 'Courier', baseFee: 250, isActive: true, estimatedDays: '1-2 days' }
      ]);
      setLocationFees([
        { location: 'Nairobi', fee: 200 },
        { location: 'Kisumu', fee: 500 },
        { location: 'Mombasa', fee: 800 }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const updateDeliveryMethod = async (method: any) => {
    try {
      await api.post('/delivery/admin/settings', method);
      toast.success(`${method.name} updated successfully`);
      fetchData();
      setEditingMethod(null);
    } catch (error) {
      console.error('Error updating delivery method:', error);
      toast.error('Error updating delivery method');
    }
  };

  const addLocationFee = async () => {
    if (!newLocation.location || newLocation.fee <= 0) {
      toast.error('Please enter valid location and fee');
      return;
    }
    try {
      await api.post('/delivery/admin/location-fees', newLocation);
      toast.success(`Location fee added for ${newLocation.location}`);
      setShowLocationModal(false);
      setNewLocation({ location: '', fee: 0 });
      fetchData();
    } catch (error) {
      toast.error('Error adding location fee');
    }
  };

  const deleteLocationFee = async (id: string) => {
    if (confirm('Delete this location fee?')) {
      try {
        await api.delete(`/delivery/admin/location-fees/${id}`);
        toast.success('Location fee deleted');
        fetchData();
      } catch (error) {
        toast.error('Error deleting location fee');
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

  return (
    <div className="p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Delivery Settings</h1>
        <p className="text-gray-500 mt-1">Configure delivery methods and location-based fees</p>
      </div>

      {/* Delivery Methods */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Delivery Methods
          </h2>
        </div>
        <div className="p-6 space-y-4">
          {deliveryMethods.map((method) => (
            <div key={method.method} className="border rounded-lg p-4">
              {editingMethod?.method === method.method ? (
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Method Name</label>
                      <input
                        type="text"
                        value={editingMethod.name}
                        onChange={(e) => setEditingMethod({...editingMethod, name: e.target.value})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Base Fee (KES)</label>
                      <input
                        type="number"
                        value={editingMethod.baseFee}
                        onChange={(e) => setEditingMethod({...editingMethod, baseFee: parseFloat(e.target.value)})}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Est. Delivery Days</label>
                    <input
                      type="text"
                      value={editingMethod.estimatedDays || ''}
                      onChange={(e) => setEditingMethod({...editingMethod, estimatedDays: e.target.value})}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., 1-2 days"
                    />
                  </div>
                  <div className="flex gap-2 pt-2">
                    <button
                      onClick={() => updateDeliveryMethod(editingMethod)}
                      className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700 flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      Save
                    </button>
                    <button
                      onClick={() => setEditingMethod(null)}
                      className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-lg">{method.name}</h3>
                      <span className={`text-xs px-2 py-1 rounded-full ${method.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {method.isActive !== false ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm">
                      <span className="text-blue-600">Base Fee: KES {method.baseFee}</span>
                      {method.estimatedDays && <span>Delivery: {method.estimatedDays}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => setEditingMethod(method)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Location-Based Fees */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 bg-gradient-to-r from-purple-500 to-purple-600 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Location-Based Delivery Fees
          </h2>
          <button
            onClick={() => setShowLocationModal(true)}
            className="bg-white text-purple-600 px-3 py-1 rounded-lg text-sm font-semibold hover:bg-purple-50 flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            Add Location
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Delivery Fee (KES)</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {locationFees.map((fee) => (
                <tr key={fee.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium capitalize">{fee.location}</td>
                  <td className="px-6 py-4 text-right font-semibold text-blue-600">KES {fee.fee}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => deleteLocationFee(fee.id)}
                      className="p-1 text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {locationFees.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <MapPin className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No location-based fees configured</p>
            <p className="text-sm mt-1">Add fees for specific towns/cities</p>
          </div>
        )}
      </div>

      {/* Add Location Modal */}
      {showLocationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Add Location Delivery Fee</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Location/Town</label>
                <input
                  type="text"
                  value={newLocation.location}
                  onChange={(e) => setNewLocation({...newLocation, location: e.target.value})}
                  placeholder="e.g., Nairobi, Kisumu, Mombasa"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Fee (KES)</label>
                <input
                  type="number"
                  value={newLocation.fee}
                  onChange={(e) => setNewLocation({...newLocation, fee: parseFloat(e.target.value)})}
                  placeholder="0"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex gap-2 pt-4">
                <button
                  onClick={addLocationFee}
                  className="flex-1 bg-blue-600 text-white py-2 rounded hover:bg-blue-700"
                >
                  Add Location
                </button>
                <button
                  onClick={() => {
                    setShowLocationModal(false);
                    setNewLocation({ location: '', fee: 0 });
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeliverySettings;