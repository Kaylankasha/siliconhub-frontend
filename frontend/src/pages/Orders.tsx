import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Package, Clock, CheckCircle, XCircle, RefreshCw, Upload, 
  FileText, Download, Percent, X as XIcon,
  AlertCircle 
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Orders = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [serviceTypeFilter, setServiceTypeFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [plagiarismPercent, setPlagiarismPercent] = useState<number | null>(null);
  const [aiPercent, setAiPercent] = useState<number | null>(null);
  const [humanizedPercent, setHumanizedPercent] = useState<number | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    const adminToken = localStorage.getItem('token');
    if (!adminToken) {
      toast.error('Please login as admin');
      window.location.href = '/login';
      return;
    }
    fetchOrders();
  }, [filter, serviceTypeFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      let url = '/services/orders';
      const params = new URLSearchParams();
      if (filter !== 'all') params.append('status', filter);
      if (serviceTypeFilter !== 'all') params.append('serviceType', serviceTypeFilter);
      if (params.toString()) url += `?${params.toString()}`;
      
      const response = await api.get(url);
      setOrders(response.data);
    } catch (error: any) {
      console.error('Error fetching orders:', error);
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please login again.');
        window.location.href = '/login';
      } else {
        toast.error('Failed to load orders');
      }
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/services/orders/${id}/status`, { status });
      toast.success(`Order marked as ${status}`);
      fetchOrders();
    } catch (error) {
      toast.error('Error updating status');
    }
  };

  const handleUploadComplete = async () => {
    if (!selectedOrder) {
      toast.error('No order selected');
      return;
    }
    
    if (!uploadFile) {
      toast.error('Please select a file to upload');
      return;
    }
    
    setUploading(true);
    setUploadProgress(0);
    const formData = new FormData();
    formData.append('file', uploadFile);
    
    try {
      const uploadRes = await axios.post(`${API_URL}/upload/file`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percent);
          }
        }
      });
      
      const fileUrl = uploadRes.data.fileUrl;
      
      const updateData: any = {
        adminCompletedUrl: fileUrl,
        status: 'COMPLETED',
        adminNotes: adminNotes
      };
      
      if (selectedOrder.serviceType === 'checking') {
        if (plagiarismPercent !== null) updateData.plagiarismPercentage = plagiarismPercent;
        if (aiPercent !== null) updateData.aiPercentage = aiPercent;
        if (humanizedPercent !== null) updateData.humanizedPercentage = humanizedPercent;
      }
      
      await api.put(`/services/orders/${selectedOrder.id}/complete`, updateData);
      
      toast.success('Completed work uploaded successfully! Customer can now download it.');
      setShowUploadModal(false);
      resetUploadForm();
      fetchOrders();
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.response?.data?.message || 'Error uploading completed work');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const resetUploadForm = () => {
    setUploadFile(null);
    setPlagiarismPercent(null);
    setAiPercent(null);
    setHumanizedPercent(null);
    setAdminNotes('');
    setUploadProgress(0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs flex items-center gap-1"><Clock className="w-3 h-3" /> Pending</span>;
      case 'PROCESSING':
        return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs flex items-center gap-1"><RefreshCw className="w-3 h-3" /> Processing</span>;
      case 'COMPLETED':
        return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Completed</span>;
      case 'CANCELLED':
        return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Cancelled</span>;
      default:
        return <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">{status}</span>;
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Service Orders</h1>
          <p className="text-gray-500 mt-1">Manage customer service requests</p>
        </div>
        <button onClick={fetchOrders} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex gap-2 flex-wrap">
          {['all', 'PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg transition ${
                filter === status ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {status === 'all' ? 'All Status' : status}
            </button>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          {['all', 'printing', 'editing', 'checking', 'product'].map((type) => (
            <button
              key={type}
              onClick={() => setServiceTypeFilter(type)}
              className={`px-4 py-2 rounded-lg transition ${
                serviceTypeFilter === type ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {type === 'all' ? 'All Types' : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Orders Yet</h3>
          <p className="text-gray-500">Customer orders will appear here once placed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition">
              <div className="p-6">
                <div className="flex flex-wrap justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <span className="text-xl">{getServiceTypeIcon(order.serviceType)}</span>
                      {getStatusBadge(order.status)}
                      <span className="text-xs text-gray-400 font-mono">{order.orderNumber}</span>
                      <span className="text-xs text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
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
                
                <div className="mt-4 pt-4 border-t grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Customer Information</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="font-medium">{order.customer?.fullName || order.customerName}</p>
                      <p>{order.customer?.email || order.customerEmail}</p>
                      <p>{order.customer?.phone || order.customerPhone}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-1">Delivery Information</p>
                    <div className="space-y-1 text-sm text-gray-600">
                      <p className="capitalize">Method: {order.deliveryMethod}</p>
                      {order.deliveryLocation && <p>Location: {order.deliveryLocation}</p>}
                      {order.deliveryAddress && <p className="text-xs text-gray-500">{order.deliveryAddress}</p>}
                      {order.deliveryFee > 0 && <p>Fee: KES {order.deliveryFee}</p>}
                    </div>
                  </div>
                </div>

                              <div className="mt-3 pt-3 border-t flex flex-wrap gap-3">
                {order.customerFileUrl && (
                  <a
                    href={order.customerFileUrl.startsWith('http') 
                      ? order.customerFileUrl 
                      : `${API_URL.replace('/api', '')}${order.customerFileUrl}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    <FileText className="w-4 h-4" />
                    Customer File
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
                  >
                    <Download className="w-4 h-4" />
                    Completed Work
                  </a>
                )}
                  {order.notes && (
                    <span className="text-sm text-gray-500 flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {order.notes.substring(0, 100)}{order.notes.length > 100 ? '...' : ''}
                    </span>
                  )}
                </div>

                {order.adminNotes && (
                  <div className="mt-2 p-2 bg-gray-50 rounded text-sm text-gray-600">
                    <span className="font-medium">Admin Note:</span> {order.adminNotes}
                  </div>
                )}

                <div className="mt-4 pt-4 border-t flex justify-end gap-2">
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order.id, e.target.value)}
                    className="text-sm border rounded-lg px-3 py-2 bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="PENDING">Pending</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                  
                  {order.status !== 'COMPLETED' && (
                    <button
                      onClick={() => {
                        setSelectedOrder(order);
                        setAdminNotes(order.adminNotes || '');
                        setShowUploadModal(true);
                      }}
                      className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
                    >
                      <Upload className="w-4 h-4" />
                      Upload Completed Work
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showUploadModal && selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Upload Completed Work</h2>
              <button 
                onClick={() => {
                  setShowUploadModal(false);
                  resetUploadForm();
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                <XIcon className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="font-medium">Order: {selectedOrder.orderNumber}</p>
                <p className="text-sm text-gray-600">Service: {selectedOrder.serviceName}</p>
                <p className="text-sm text-gray-600">Customer: {selectedOrder.customer?.fullName || selectedOrder.customerName}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Completed File *</label>
                <input
                  type="file"
                  onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                  className="w-full p-2 border rounded"
                  accept=".pdf,.doc,.docx,.jpg,.png,.zip"
                />
                <p className="text-xs text-gray-500 mt-1">Upload the completed work (PDF, DOC, DOCX, ZIP, images)</p>
                {uploading && uploadProgress > 0 && (
                  <div className="mt-2">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 rounded-full h-2 transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{uploadProgress}% uploaded</p>
                  </div>
                )}
              </div>

              {selectedOrder.serviceType === 'checking' && (
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3">Detection Results</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium mb-1">Plagiarism Percentage (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={plagiarismPercent ?? ''}
                          onChange={(e) => setPlagiarismPercent(e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full p-2 border rounded"
                          placeholder="e.g., 15"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <Percent className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">AI Detection Percentage (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={aiPercent ?? ''}
                          onChange={(e) => setAiPercent(e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full p-2 border rounded"
                          placeholder="e.g., 8"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <Percent className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Humanized Content Percentage (%)</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          value={humanizedPercent ?? ''}
                          onChange={(e) => setHumanizedPercent(e.target.value ? parseFloat(e.target.value) : null)}
                          className="w-full p-2 border rounded"
                          placeholder="e.g., 95"
                          step="0.1"
                          min="0"
                          max="100"
                        />
                        <Percent className="w-5 h-5 text-gray-400" />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Admin Notes (Optional)</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={3}
                  placeholder="Add any notes about this order..."
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleUploadComplete}
                  disabled={uploading || !uploadFile}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-5 h-5" />
                      Upload & Complete
                    </>
                  )}
                </button>
                <button
                  onClick={() => {
                    setShowUploadModal(false);
                    resetUploadForm();
                  }}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
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

export default Orders;