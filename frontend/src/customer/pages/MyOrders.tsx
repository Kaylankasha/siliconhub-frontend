import React, { useState } from 'react';
import { api } from '../../services/api';
import { Search, Package, Clock, CheckCircle, XCircle, RefreshCw, Phone, Mail, Calendar, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

const MyOrders = () => {
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  const searchOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email && !phone) {
      toast.error('Please enter either email or phone number');
      return;
    }

    setLoading(true);
    setSearched(true);
    
    try {
      const response = await api.get('/services/customer/orders', {
        params: { email, phone }
      });
      setOrders(response.data);
      if (response.data.length === 0) {
        toast.info('No orders found with these details');
      }
    } catch (error) {
      toast.error('Error fetching orders');
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return { icon: Clock, text: 'Pending', color: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200' };
      case 'PROCESSING':
        return { icon: RefreshCw, text: 'Processing', color: 'bg-blue-100 text-blue-700', border: 'border-blue-200' };
      case 'COMPLETED':
        return { icon: CheckCircle, text: 'Completed', color: 'bg-green-100 text-green-700', border: 'border-green-200' };
      case 'CANCELLED':
        return { icon: XCircle, text: 'Cancelled', color: 'bg-red-100 text-red-700', border: 'border-red-200' };
      default:
        return { icon: Package, text: status, color: 'bg-gray-100 text-gray-700', border: 'border-gray-200' };
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

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Track Your Orders</h1>
          <p className="text-gray-600 mt-2">Enter your email or phone number to view your orders</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <form onSubmit={searchOrders} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="0712345678"
                  className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Find My Orders
                </>
              )}
            </button>
          </form>
        </div>

        {/* Orders List */}
        {searched && (
          <div className="space-y-4">
            {orders.length > 0 ? (
              <>
                <h2 className="text-xl font-semibold mb-4">Your Orders ({orders.length})</h2>
                {orders.map((order) => {
                  const status = getStatusBadge(order.status);
                  const StatusIcon = status.icon;
                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition cursor-pointer"
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                    >
                      <div className="p-6">
                        <div className="flex flex-wrap justify-between items-start gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <StatusIcon className={`w-5 h-5 ${status.color.split(' ')[2]}`} />
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
                                {status.text}
                              </span>
                              <span className="text-xs text-gray-400">{order.orderNumber}</span>
                            </div>
                            <h3 className="font-semibold text-lg">{order.service.name}</h3>
                            <p className="text-gray-500 text-sm mt-1">{order.service.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-blue-600">KES {order.totalPrice.toLocaleString()}</div>
                            <p className="text-sm text-gray-500">Qty: {order.quantity}</p>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t flex flex-wrap gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(order.createdAt)}
                          </div>
                          {order.customerEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              {order.customerEmail}
                            </div>
                          )}
                          {order.customerPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="w-4 h-4" />
                              {order.customerPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {selectedOrder?.id === order.id && (
                        <div className="border-t bg-gray-50 p-6">
                          <h4 className="font-semibold mb-3">Order Details</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <p className="text-sm text-gray-500">Order Number</p>
                              <p className="font-mono">{order.orderNumber}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Service Category</p>
                              <p className="capitalize">{order.service.category}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Quantity</p>
                              <p>{order.quantity}</p>
                            </div>
                            <div>
                              <p className="text-sm text-gray-500">Unit Price</p>
                              <p>KES {(order.totalPrice / order.quantity).toLocaleString()}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Special Instructions</p>
                              <p className="text-gray-700">{order.notes || 'None'}</p>
                            </div>
                            <div className="md:col-span-2">
                              <p className="text-sm text-gray-500">Amount Due</p>
                              <p className="text-xl font-bold text-blue-600">KES {order.totalPrice.toLocaleString()}</p>
                            </div>
                          </div>
                          
                          {order.status === 'PENDING' && (
                            <div className="mt-4 pt-4 border-t flex gap-3">
                              <button 
                                onClick={() => toast.info('Payment module coming soon!')}
                                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                              >
                                Proceed to Payment
                              </button>
                              <button 
                                onClick={() => toast.info('Cancellation will be available soon')}
                                className="border border-red-600 text-red-600 px-4 py-2 rounded-lg hover:bg-red-50 transition"
                              >
                                Cancel Order
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Found</h3>
                <p className="text-gray-500">
                  We couldn't find any orders with the provided email or phone number.
                </p>
                <button
                  onClick={() => {
                    setEmail('');
                    setPhone('');
                    setSearched(false);
                  }}
                  className="mt-4 text-blue-600 hover:text-blue-700"
                >
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;