import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, ShoppingCart, Package, Percent, TrendingUp, 
  Calendar, RefreshCw, Clock, CheckCircle, 
  Award, Target, TrendingDown 
} from 'lucide-react';
import { toast } from 'sonner';

const CashierDashboard = () => {
  const [commissionData, setCommissionData] = useState({
    totalCommission: 0,
    totalSales: 0,
    commissionCount: 0,
    commissionRate: 5,
    commissions: []
  });
  const [period, setPeriod] = useState('today');
  const [loading, setLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchCommissionData();
  }, [period]);

  const fetchCommissionData = async () => {
    try {
      setLoading(true);
      setDebugInfo('Fetching...');
      console.log('Fetching commission data for period:', period);
      
      const response = await api.get(`/commission/my-commission?period=${period}`);
      console.log('Commission data received:', response.data);
      
      setCommissionData(response.data);
      setDebugInfo(`Found ${response.data.commissionCount} records, Total: KES ${response.data.totalCommission}`);
    } catch (error: any) {
      console.error('Error fetching commission:', error);
      setDebugInfo(`Error: ${error.message}`);
      setCommissionData({
        totalCommission: 0,
        totalSales: 0,
        commissionCount: 0,
        commissionRate: 5,
        commissions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return "Today's";
      case 'week': return "This Week's";
      case 'month': return "This Month's";
      default: return "Total";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const stats = [
    {
      title: `${getPeriodLabel()} Commission`,
      value: formatCurrency(commissionData?.totalCommission || 0),
      icon: DollarSign,
      color: 'bg-green-500',
      subtitle: `${commissionData?.commissionCount || 0} sales`
    },
    {
      title: `${getPeriodLabel()} Sales`,
      value: formatCurrency(commissionData?.totalSales || 0),
      icon: ShoppingCart,
      color: 'bg-blue-500',
      subtitle: `${commissionData?.commissionCount || 0} transactions`
    },
    {
      title: 'Commission Rate',
      value: `${commissionData?.commissionRate || 5}%`,
      icon: Percent,
      color: 'bg-orange-500',
      subtitle: 'on every sale'
    },
    {
      title: 'Average per Sale',
      value: formatCurrency(commissionData?.commissionCount > 0 
        ? (commissionData.totalCommission / commissionData.commissionCount) 
        : 0),
      icon: TrendingUp,
      color: 'bg-purple-500',
      subtitle: 'per transaction'
    },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">My Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Welcome back, {user?.fullName || user?.username}
          </p>
          <p className="text-xs text-gray-400 mt-1">{debugInfo}</p>
        </div>
        
        <div className="flex gap-2">
          <select 
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          
          <button 
            onClick={fetchCommissionData}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center gap-2"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-gray-400 text-xs mt-2">{stat.subtitle}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Award className="w-5 h-5 text-yellow-500" />
            Commission Breakdown
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Total Commission Earned</p>
                <p className="text-sm text-gray-500">From {commissionData?.commissionCount || 0} sales</p>
              </div>
              <p className="text-xl font-bold text-green-600">
                {formatCurrency(commissionData?.totalCommission || 0)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium">Total Sales Value</p>
                <p className="text-sm text-gray-500">All sales combined</p>
              </div>
              <p className="text-xl font-bold text-blue-600">
                {formatCurrency(commissionData?.totalSales || 0)}
              </p>
            </div>
            <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
              <div>
                <p className="font-medium">Next Target</p>
                <p className="text-sm text-gray-600">Earn more to increase commission</p>
              </div>
              <p className="text-lg font-bold text-blue-600">
                +{formatCurrency(10000 - (commissionData?.totalSales || 0))}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Performance Tips
          </h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-green-50 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Complete more sales</p>
                <p className="text-sm text-gray-600">Each sale adds {commissionData?.commissionRate || 5}% to your commission</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
              <TrendingUp className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Higher value sales</p>
                <p className="text-sm text-gray-600">Larger sales mean higher commission</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
              <Calendar className="w-5 h-5 text-purple-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Stay consistent</p>
                <p className="text-sm text-gray-600">Regular sales lead to consistent earnings</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Commission Records */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold">Recent Commission Records</h2>
          <p className="text-sm text-gray-500 mt-1">
            Showing {commissionData?.commissions?.length || 0} records for {period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month'}
          </p>
        </div>
        {commissionData?.commissions?.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <DollarSign className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No commission records yet for {period === 'today' ? 'today' : period === 'week' ? 'this week' : 'this month'}</p>
            <p className="text-sm mt-1">Complete sales to start earning commission</p>
            <button
              onClick={() => navigate('/admin/sales')}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Make a Sale
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date & Time</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Receipt No</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Sale Amount</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Commission Rate</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Commission Earned</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {commissionData?.commissions?.map((record: any) => (
                  <tr key={record.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {new Date(record.createdAt).toLocaleDateString()}
                      <br />
                      <span className="text-xs text-gray-400">
                        {new Date(record.createdAt).toLocaleTimeString()}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-mono text-gray-500">
                      {record.sale?.receiptNo || 'N/A'}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium text-right">
                      KES {record.saleAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-sm text-center">
                      {record.commissionRate}%
                    </td>
                    <td className="px-6 py-4 text-sm text-right font-semibold text-green-600">
                      KES {record.commissionAmount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        record.status === 'PAID' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-yellow-100 text-yellow-700'
                      }`}>
                        {record.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h3 className="font-semibold text-lg">💡 Pro Tip</h3>
            <p className="text-gray-600 text-sm mt-1">
              You earn {commissionData?.commissionRate || 5}% commission on every sale you make. 
              Focus on providing excellent customer service to increase repeat business!
            </p>
          </div>
          <button
            onClick={() => navigate('/admin/sales')}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
          >
            Make a Sale
          </button>
        </div>
      </div>
    </div>
  );
};

export default CashierDashboard;