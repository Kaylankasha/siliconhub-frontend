import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Percent, Save, AlertCircle, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const CommissionSettings = () => {
  const [commissionRate, setCommissionRate] = useState(5);
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await api.get('/commission/settings');
      setCommissionRate(response.data.commissionRate);
      setIsActive(response.data.isActive);
    } catch (error) {
      console.error('Error fetching commission settings:', error);
      toast.error('Failed to load commission settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (commissionRate < 0 || commissionRate > 100) {
      toast.error('Commission rate must be between 0 and 100');
      return;
    }
    
    setSaving(true);
    try {
      await api.put('/commission/settings', { commissionRate, isActive });
      toast.success(`Commission rate updated to ${commissionRate}%`);
    } catch (error) {
      toast.error('Error updating commission rate');
    } finally {
      setSaving(false);
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
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Commission Settings</h1>
        <p className="text-gray-500 mt-1">Configure cashier commission rates</p>
      </div>

      <div className="max-w-md">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Cashier Commission</h2>
              <p className="text-sm text-gray-500">Commission percentage on sales made by cashiers</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Commission Percentage (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  value={commissionRate}
                  onChange={(e) => setCommissionRate(parseFloat(e.target.value))}
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
                Cashiers earn {commissionRate}% commission on every sale they make
              </p>
            </div>

            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-700">Enable commission for cashiers</span>
              </label>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium mb-2">Example Calculation</h3>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Sale Amount:</span>
                  <span>KES 10,000.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Commission Rate:</span>
                  <span>{commissionRate}%</span>
                </div>
                <div className="flex justify-between font-bold pt-1 border-t">
                  <span>Cashier Commission:</span>
                  <span className="text-green-600">KES {(10000 * commissionRate / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CommissionSettings;