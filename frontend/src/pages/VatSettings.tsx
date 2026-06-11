import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Percent, Save, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const VatSettings = () => {
  const [vatRate, setVatRate] = useState<number>(16);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if admin is logged in
    const adminToken = localStorage.getItem('token');
    if (!adminToken) {
      toast.error('Please login as admin');
      navigate('/login');
      return;
    }
    fetchVatRate();
  }, [navigate]);

  const fetchVatRate = async () => {
    try {
      setLoading(true);
      console.log('Fetching VAT rate...');
      const response = await api.get('/settings/vat');
      console.log('VAT rate response:', response.data);
      setVatRate(response.data.vatRate);
    } catch (error: any) {
      console.error('Error fetching VAT rate:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error('Failed to load VAT settings');
        // Set default value
        setVatRate(16);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (vatRate < 0 || vatRate > 100) {
      toast.error('VAT rate must be between 0 and 100');
      return;
    }
    
    setSaving(true);
    try {
      await api.put('/settings/vat', { vatRate });
      toast.success(`VAT rate updated to ${vatRate}%`);
    } catch (error: any) {
      console.error('Error updating VAT rate:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        navigate('/login');
      } else {
        toast.error(error.response?.data?.message || 'Error updating VAT rate');
      }
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading VAT settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <button
        onClick={() => navigate('/admin/dashboard')}
        className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Dashboard
      </button>

      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">System Settings</h1>
        <p className="text-gray-500 mt-1">Configure VAT and other system settings</p>
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Percent className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">VAT Rate</h2>
              <p className="text-sm text-gray-500">Configure the VAT percentage applied to all sales</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                VAT Percentage (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={vatRate}
                  onChange={(e) => setVatRate(parseFloat(e.target.value))}
                  className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  step="0.5"
                  min="0"
                  max="100"
                />
                <span className="text-gray-500">%</span>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Current VAT rate: {vatRate}% will be applied to all POS sales
              </p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg mt-4">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Important Note:</p>
                  <p>Changing the VAT rate will affect all future sales. Existing sales will not be updated.</p>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Example Calculation</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>KES 1,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT ({vatRate}%):</span>
                  <span>KES {(1000 * vatRate / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Total:</span>
                  <span>KES {(1000 + (1000 * vatRate / 100)).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VatSettings;