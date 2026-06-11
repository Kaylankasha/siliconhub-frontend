import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { 
  TrendingUp, 
  ShoppingCart, 
  Package, 
  DollarSign,
  Printer
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { useAuth } from '../contexts/AuthContext';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

const Dashboard = () => {
  const { user } = useAuth();
  const [period, setPeriod] = useState('today');
  
  const { data: analytics, isLoading: analyticsLoading, error: analyticsError } = useQuery({
    queryKey: ['analytics', period],
    queryFn: () => api.get(`/reports/sales-analytics?period=${period}`).then(res => res.data),
    retry: false,
  });

  const { data: inventory, isLoading: inventoryLoading, error: inventoryError } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/reports/inventory').then(res => res.data),
    retry: false,
  });

  // Handle errors gracefully - don't log out
  useEffect(() => {
    if (analyticsError || inventoryError) {
      console.log('Reports not yet available - this is normal if no sales data exists');
    }
  }, [analyticsError, inventoryError]);

  const isLoading = analyticsLoading || inventoryLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Revenue',
      value: `KES ${analytics?.totalRevenue?.toLocaleString() || 0}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+0%'
    },
    {
      title: 'Total Sales',
      value: analytics?.totalSales || 0,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      change: '+0%'
    },
    {
      title: 'Average Order',
      value: `KES ${Math.round(analytics?.averageOrderValue || 0).toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-purple-500',
      change: '+0%'
    },
    {
      title: 'Products',
      value: inventory?.totalProducts || 0,
      icon: Package,
      color: 'bg-orange-500',
      change: 'In stock'
    }
  ];

  const categoryData = analytics?.categorySales ? 
    Object.entries(analytics.categorySales).map(([name, data]: [string, any]) => ({
      name,
      value: data.revenue
    })) : [];

  const dailySalesData = analytics?.dailySales || [];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, {user?.fullName || user?.username}</p>
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
            <option value="year">This Year</option>
          </select>
          
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
            <Printer className="w-5 h-5 inline mr-2" />
            Print Report
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
                <p className="text-green-600 text-sm mt-2">{stat.change}</p>
              </div>
              <div className={`${stat.color} p-3 rounded-full`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Sales Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Daily Sales Trend</h2>
          {dailySalesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dailySalesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No sales data available
            </div>
          )}
        </div>

        {/* Category Sales Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Sales by Category</h2>
          {categoryData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500">
              No category sales data available
            </div>
          )}
        </div>

        {/* Sales by Staff */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">Sales by Staff</h2>
          {analytics?.userSales && Object.keys(analytics.userSales).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(analytics.userSales).map(([name, data]: [string, any]) => (
                <div key={name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium">{name}</p>
                    <p className="text-sm text-gray-500">{data.count} sales</p>
                  </div>
                  <p className="font-bold text-lg">KES {data.revenue.toLocaleString()}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              No staff sales data available
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4 text-red-600">Low Stock Alert</h2>
          {inventory?.lowStock && inventory.lowStock.length > 0 ? (
            <div className="space-y-3">
              {inventory.lowStock.map((product: any) => (
                <div key={product.id} className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div>
                    <p className="font-medium">{product.name}</p>
                    <p className="text-sm text-gray-600">Reorder at: {product.reorderLevel}</p>
                  </div>
                  <p className="font-bold text-red-600">{product.stockQuantity} left</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-[200px] text-gray-500">
              All products are well stocked!
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;