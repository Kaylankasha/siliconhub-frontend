import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  Package, ShoppingBag, Star, TrendingUp, LogOut, User, Phone, Mail, 
  MapPin, Home, ArrowLeft, Download, FileText, Clock, CheckCircle, 
  XCircle, RefreshCw, AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const CustomerDashboard = () => {
  const [customer, setCustomer] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('orders');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    if (!token) {
      navigate('/customer/login');
      return;
    }
    fetchCustomerData(token);
  }, []);

  const fetchCustomerData = async (token: string) => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/customer/auth/profile`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      setCustomer(response.data);
      setOrders(response.data.orders || []);
    } catch (error: any) {
      console.error('Error fetching customer data:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customer');
        toast.error('Session expired. Please login again.');
        navigate('/customer/login');
      } else {
        toast.error('Failed to load dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    const token = localStorage.getItem('customerToken');
    if (token) {
      setRefreshing(true);
      await fetchCustomerData(token);
      setRefreshing(false);
      toast.success('Orders refreshed');
    }
  };

  const handleLogout = async () => {
    const token = localStorage.getItem('customerToken');
    try {
      if (token) {
        await axios.post(`${API_URL}/customer/auth/logout`, {}, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customer');
      toast.success('Logged out successfully');
      navigate('/');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, text: 'Pending', color: 'bg-yellow-100 text-yellow-700' };
      case 'PROCESSING':
        return { icon: RefreshCw, text: 'Processing', color: 'bg-blue-100 text-blue-700' };
      case 'COMPLETED':
        return { icon: CheckCircle, text: 'Completed', color: 'bg-green-100 text-green-700' };
      case 'CANCELLED':
        return { icon: XCircle, text: 'Cancelled', color: 'bg-red-100 text-red-700' };
      default:
        return { icon: Package, text: status, color: 'bg-gray-100 text-gray-700' };
    }
  };

  const getServiceTypeIcon = (type: string) => {
    switch (type) {
      case 'editing': return '📝';
      case 'checking': return '🔍';
      case 'printing': return '🖨️';
      case 'product': return '📦';
      default: return '📄';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  let loyaltyTier = 'Bronze';
  let nextTierSpending = 5000;
  let discount = 0;

  if (customer.totalSpent >= 50000) {
    loyaltyTier = 'Platinum';
    nextTierSpending = 100000;
    discount = 15;
  } else if (customer.totalSpent >= 20000) {
    loyaltyTier = 'Gold';
    nextTierSpending = 50000;
    discount = 10;
  } else if (customer.totalSpent >= 5000) {
    loyaltyTier = 'Silver';
    nextTierSpending = 20000;
    discount = 5;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <button
          onClick={() => navigate('/')}
          className="flex items-center gap-2 text-gray-600 hover:text-blue-600 mb-4 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>

        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 mb-8 text-white">
          <div className="flex justify-between items-start flex-wrap gap-4">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {customer.fullName}!</h1>
              <p className="text-blue-100 mt-1">Member since {new Date(customer.createdAt).toLocaleDateString()}</p>
              <div className="mt-2 flex items-center gap-2">
                <span className="bg-white/20 px-2 py-1 rounded-full text-sm">{loyaltyTier} Member</span>
                <span className="bg-green-500/30 px-2 py-1 rounded-full text-sm">{discount}% Discount</span>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Orders</p>
                <p className="text-2xl font-bold">{customer.totalOrders || 0}</p>
              </div>
              <ShoppingBag className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Total Spent</p>
                <p className="text-2xl font-bold">KES {customer.totalSpent?.toLocaleString() || 0}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Your Discount</p>
                <p className="text-2xl font-bold text-green-600">{discount}%</p>
              </div>
              <Star className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">Member Tier</p>
                <p className="text-xl font-bold">{loyaltyTier}</p>
              </div>
              <Package className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>

        {customer.totalSpent < 50000 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <h3 className="font-semibold mb-3">Loyalty Progress</h3>
            <div className="relative pt-1">
              <div className="flex mb-2 items-center justify-between">
                <div>
                  <span className="text-xs font-semibold inline-block text-blue-600">{loyaltyTier}</span>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold inline-block text-blue-600">
                    Next: {nextTierSpending.toLocaleString()} KES
                  </span>
                </div>
              </div>
              <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${Math.min((customer.totalSpent / nextTierSpending) * 100, 100)}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-blue-500 to-purple-500"
                ></div>
              </div>
              <p className="text-sm text-gray-500">
                Spend {nextTierSpending - (customer.totalSpent || 0)} KES more to reach next tier!
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="border-b">
            <div className="flex">
              <button
                onClick={() => setActiveTab('orders')}
                className={`px-6 py-3 text-sm font-medium transition ${
                  activeTab === 'orders'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                My Orders ({orders.length})
              </button>
              <button
                onClick={() => setActiveTab('profile')}
                className={`px-6 py-3 text-sm font-medium transition ${
                  activeTab === 'profile'
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Profile Settings
              </button>
            </div>
          </div>

          {activeTab === 'orders' && (
            <div className="p-6">
              {orders.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                  <p className="text-gray-500">No orders yet</p>
                  <button
                    onClick={() => navigate('/browse')}
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => {
                    const status = getStatusBadge(order.status);
                    const StatusIcon = status.icon;
                    return (
                      <div key={order.id} className="border rounded-lg overflow-hidden hover:shadow-md transition">
                        <div className="p-4 cursor-pointer" onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}>
                          <div className="flex flex-wrap justify-between items-start gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2 flex-wrap">
                                <span className="text-lg">{getServiceTypeIcon(order.serviceType)}</span>
                                <div className="flex items-center gap-1">
                                  <StatusIcon className="w-4 h-4" />
                                  <span className={`text-xs px-2 py-1 rounded-full ${status.color}`}>
                                    {status.text}
                                  </span>
                                </div>
                                <span className="text-xs text-gray-400 font-mono">{order.orderNumber}</span>
                              </div>
                              <h3 className="font-semibold text-lg">{order.serviceName}</h3>
                              <p className="text-gray-500 text-sm mt-1">{order.service?.description}</p>
                              
                              {order.serviceType === 'checking' && (
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {order.plagiarismPercentage !== null && order.plagiarismPercentage > 0 && (
                                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                                      Plagiarism: {order.plagiarismPercentage}%
                                    </span>
                                  )}
                                  {order.aiPercentage !== null && order.aiPercentage > 0 && (
                                    <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                                      AI: {order.aiPercentage}%
                                    </span>
                                  )}
                                  {order.humanizedPercentage !== null && order.humanizedPercentage > 0 && (
                                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                                      Humanized: {order.humanizedPercentage}%
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">KES {order.totalPrice?.toLocaleString() || 0}</div>
                              <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                            </div>
                          </div>
                          
                          <div className="mt-3 pt-3 border-t flex flex-wrap gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="flex items-center gap-1 capitalize">
                              <Package className="w-4 h-4" />
                              Delivery: {order.deliveryMethod}
                            </div>
                          </div>

                          {/* File downloads */}
                          // File downloads - FIXED URL handling
                      <div className="mt-3 flex flex-wrap gap-3">
                        {order.customerFileUrl && (
                          <a
                            href={order.customerFileUrl.startsWith('http') 
                              ? order.customerFileUrl 
                              : `${API_URL.replace('/api', '')}${order.customerFileUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <FileText className="w-4 h-4" />
                            Your Uploaded File
                          </a>
                        )}
                        {order.adminCompletedUrl && (
                          <a
                            href={order.adminCompletedUrl.startsWith('http') 
                              ? order.adminCompletedUrl 
                              : `${API_URL.replace('/api', '')}${order.adminCompletedUrl}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-green-600 hover:text-green-700 flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Download className="w-4 h-4" />
                            Download Completed Work
                          </a>
                        )}
                      </div>
                        </div>

                        {selectedOrder?.id === order.id && (
                          <div className="border-t bg-gray-50 p-4">
                            <h4 className="font-semibold mb-3">Order Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <p className="text-sm text-gray-500">Order Number</p>
                                <p className="font-mono">{order.orderNumber}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Service Type</p>
                                <p className="capitalize">{order.serviceType}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Quantity</p>
                                <p>{order.quantity}</p>
                              </div>
                              <div>
                                <p className="text-sm text-gray-500">Unit Price</p>
                                <p>KES {order.unitPrice?.toLocaleString()}</p>
                              </div>
                              {order.deliveryAddress && (
                                <div className="md:col-span-2">
                                  <p className="text-sm text-gray-500">Delivery Address</p>
                                  <p className="text-gray-700">{order.deliveryAddress}</p>
                                  {order.deliveryLocation && <p className="text-sm text-gray-500 mt-1">Location: {order.deliveryLocation}</p>}
                                  {order.deliveryFee > 0 && <p className="text-sm">Delivery Fee: KES {order.deliveryFee}</p>}
                                </div>
                              )}
                              {order.notes && (
                                <div className="md:col-span-2">
                                  <p className="text-sm text-gray-500">Your Notes</p>
                                  <p className="text-gray-700">{order.notes}</p>
                                </div>
                              )}
                              {order.adminNotes && (
                                <div className="md:col-span-2">
                                  <p className="text-sm text-gray-500">Message from Admin</p>
                                  <p className="text-gray-700 bg-blue-50 p-2 rounded">{order.adminNotes}</p>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="p-6">
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={customer?.fullName || ''}
                    className="w-full p-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={customer?.email || ''}
                    className="w-full p-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={customer?.phone || ''}
                    className="w-full p-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                  <input
                    type="text"
                    value={customer?.location || 'Not specified'}
                    className="w-full p-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Address</label>
                  <input
                    type="text"
                    value={customer?.address || 'Not specified'}
                    className="w-full p-2 border rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CustomerDashboard;