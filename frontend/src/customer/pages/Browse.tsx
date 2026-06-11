import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Search, Printer, Package, ShoppingCart, X, CreditCard, AlertCircle, Upload, FileText, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const Browse = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'products' | 'services'>('products');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  // Order form state
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFeeMessage, setDeliveryFeeMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    // Check if customer is logged in and pre-fill form
    const token = localStorage.getItem('customerToken');
    if (token) {
      const customerData = localStorage.getItem('customer');
      if (customerData) {
        try {
          const customer = JSON.parse(customerData);
          setCustomerName(customer.fullName || '');
          setCustomerPhone(customer.phone || '');
          setCustomerEmail(customer.email || '');
          setIsLoggedIn(true);
        } catch (e) {}
      }
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const productsRes = await axios.get(`${API_URL}/products`);
      const servicesRes = await axios.get(`${API_URL}/services/catalog`);
      const categoriesRes = await axios.get(`${API_URL}/products/categories/all`);
      
      setProducts(productsRes.data);
      setServices(servicesRes.data);
      setCategories(categoriesRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError('Failed to load items. Please refresh the page.');
      toast.error('Failed to load items');
    } finally {
      setLoading(false);
    }
  };

  const getFilteredItems = () => {
    const items = activeTab === 'products' ? products : services;
    let filtered = [...items];
    
    if (selectedCategory !== 'all') {
      if (activeTab === 'products') {
        filtered = filtered.filter(item => item.categoryId === selectedCategory);
      } else {
        filtered = filtered.filter(item => item.category === selectedCategory);
      }
    }
    
    if (searchTerm) {
      filtered = filtered.filter(item =>
        item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    
    return filtered;
  };

  const calculateDeliveryFee = async (method: string, location?: string) => {
    if (method === 'pickup') {
      setDeliveryFee(0);
      setDeliveryFeeMessage('');
      return;
    }
    
    if (!location) {
      setDeliveryFee(0);
      setDeliveryFeeMessage('Please enter your location to calculate delivery fee');
      return;
    }
    
    try {
      const response = await axios.post(`${API_URL}/delivery/calculate-fee`, { method, location });
      if (response.data.fee !== undefined && response.data.fee > 0) {
        setDeliveryFee(response.data.fee);
        setDeliveryFeeMessage(`Delivery fee: KES ${response.data.fee.toLocaleString()}`);
      } else {
        setDeliveryFee(0);
        setDeliveryFeeMessage('Delivery fee will be confirmed after order placement');
      }
    } catch (error) {
      setDeliveryFee(0);
      setDeliveryFeeMessage('Delivery fee will be confirmed after order placement');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }
    
    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Only images, PDF, and Word documents are allowed');
      return;
    }
    
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const response = await axios.post(`${API_URL}/upload/file`, formData);
      setUploadedFile({ url: response.data.fileUrl, name: response.data.originalName });
      toast.success('File uploaded successfully');
    } catch (error) {
      toast.error('Error uploading file');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeUploadedFile = () => {
    setUploadedFile(null);
  };

  const handleOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName || !customerPhone) {
      toast.error('Please fill in your name and phone number');
      return;
    }
    
    if (deliveryMethod !== 'pickup' && !deliveryAddress) {
      toast.error('Please provide delivery address');
      return;
    }
    
    setSubmitting(true);
    try {
      const totalPrice = (selectedItem.sellingPrice || selectedItem.basePrice) * quantity + deliveryFee;
      
      const orderData = {
        serviceId: selectedItem.id,
        serviceName: selectedItem.name,
        serviceType: activeTab === 'products' ? 'product' : selectedItem.category,
        customerName,
        customerEmail,
        customerPhone,
        quantity,
        totalPrice,
        unitPrice: selectedItem.sellingPrice || selectedItem.basePrice,
        notes: notes + (deliveryFeeMessage ? `\n${deliveryFeeMessage}` : ''),
        deliveryMethod,
        deliveryLocation: deliveryMethod !== 'pickup' ? deliveryLocation : null,
        deliveryAddress: deliveryMethod !== 'pickup' ? deliveryAddress : null,
        deliveryFee,
        deliveryFeeMessage,
        fileUrl: uploadedFile?.url
      };
      
      const response = await axios.post(`${API_URL}/services/order`, orderData);
      
      if (response.data.autoCreatedAccount && response.data.token) {
        localStorage.setItem('customerToken', response.data.token);
        localStorage.setItem('customer', JSON.stringify(response.data.customer));
        setIsLoggedIn(true);
        toast.success('Order placed! Account created automatically.');
      } else {
        toast.success('Order placed successfully!');
      }
      
      setShowOrderModal(false);
      resetForm();
      
      setTimeout(() => {
        navigate('/customer/dashboard');
      }, 2000);
    } catch (error) {
      console.error('Order error:', error);
      toast.error('Error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setQuantity(1);
    if (!isLoggedIn) {
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
    }
    setDeliveryMethod('pickup');
    setDeliveryLocation('');
    setDeliveryAddress('');
    setDeliveryFee(0);
    setDeliveryFeeMessage('');
    setNotes('');
    setUploadedFile(null);
  };

  const openOrderModal = (item: any) => {
    setSelectedItem(item);
    setShowOrderModal(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading products and services...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => fetchData()} 
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const filteredItems = getFilteredItems();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Browse Our Collection</h1>
          <p className="text-gray-600 mt-2">
            {activeTab === 'products' ? `${products.length} Products` : `${services.length} Services`} available
          </p>
        </div>

        {/* Login Prompt */}
        {!isLoggedIn && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-blue-800 mb-2">
              <button onClick={() => navigate('/customer/login')} className="text-blue-600 font-semibold hover:underline">
                Login
              </button>
              {' '}or{' '}
              <button onClick={() => navigate('/customer/register')} className="text-green-600 font-semibold hover:underline">
                Register
              </button>
              {' '}to track your orders and get discounts!
            </p>
          </div>
        )}

        {/* Search and Filter Bar */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab('products')}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === 'products'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Package className="w-4 h-4 inline mr-2" />
                Products ({products.length})
              </button>
              <button
                onClick={() => setActiveTab('services')}
                className={`px-4 py-2 rounded-lg transition ${
                  activeTab === 'services'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Printer className="w-4 h-4 inline mr-2" />
                Services ({services.length})
              </button>
            </div>
          </div>
        </div>

        {/* Categories */}
        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3 py-1 rounded-full text-sm transition ${
                selectedCategory === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(activeTab === 'products' ? cat.id : cat.name)}
                className={`px-3 py-1 rounded-full text-sm transition ${
                  selectedCategory === (activeTab === 'products' ? cat.id : cat.name)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}

        {/* Items Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-12 text-center">
            <Package className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">No items found</p>
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="mt-2 text-blue-600 hover:text-blue-700"
              >
                Clear search
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredItems.map((item) => (
              <div key={item.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition cursor-pointer" onClick={() => openOrderModal(item)}>
                <div className={`p-4 ${
                  activeTab === 'products' ? 'bg-blue-50' : 'bg-purple-50'
                }`}>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg">{item.name}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{item.description || 'No description'}</p>
                    </div>
                    {activeTab === 'products' && item.stockQuantity !== undefined && item.stockQuantity <= 10 && (
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full ml-2">
                        Low Stock
                      </span>
                    )}
                  </div>
                </div>
                <div className="p-4">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-2xl font-bold text-blue-600">
                      KES {(item.sellingPrice || item.basePrice).toLocaleString()}
                    </span>
                    {activeTab === 'products' && item.stockQuantity !== undefined && (
                      <span className="text-sm text-gray-500">Stock: {item.stockQuantity}</span>
                    )}
                  </div>
                  <button
                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    Order Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order Modal */}
      {showOrderModal && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Order: {selectedItem.name}</h2>
              <button onClick={() => setShowOrderModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <form onSubmit={handleOrder} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Quantity</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Your Name *</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Phone Number *</label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  className="w-full p-2 border rounded"
                />
              </div>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium mb-1">Upload File (Optional)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                  {uploadedFile ? (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-600 truncate max-w-[200px]">{uploadedFile.name}</span>
                      </div>
                      <button
                        type="button"
                        onClick={removeUploadedFile}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                      />
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex items-center justify-center gap-2 w-full py-2 text-blue-600 hover:text-blue-700"
                        disabled={uploading}
                      >
                        {uploading ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        ) : (
                          <Upload className="w-5 h-5" />
                        )}
                        {uploading ? 'Uploading...' : 'Click to upload file'}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Delivery Options */}
              <div>
                <label className="block text-sm font-medium mb-1">Delivery Method</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('pickup');
                      calculateDeliveryFee('pickup');
                    }}
                    className={`p-2 rounded-lg text-sm transition ${
                      deliveryMethod === 'pickup' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    Pickup (Free)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('delivery');
                      calculateDeliveryFee('delivery', deliveryLocation);
                    }}
                    className={`p-2 rounded-lg text-sm transition ${
                      deliveryMethod === 'delivery' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeliveryMethod('courier');
                      calculateDeliveryFee('courier');
                    }}
                    className={`p-2 rounded-lg text-sm transition ${
                      deliveryMethod === 'courier' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    Courier
                  </button>
                </div>
              </div>

              {deliveryMethod !== 'pickup' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">Town/City</label>
                    <input
                      type="text"
                      value={deliveryLocation}
                      onChange={(e) => {
                        setDeliveryLocation(e.target.value);
                        calculateDeliveryFee(deliveryMethod, e.target.value);
                      }}
                      className="w-full p-2 border rounded"
                      placeholder="e.g., Nairobi"
                    />
                    {deliveryFeeMessage && (
                      <p className={`text-xs mt-1 ${deliveryFee > 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                        {deliveryFeeMessage}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Delivery Address</label>
                    <textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      className="w-full p-2 border rounded"
                      rows={2}
                      placeholder="Street, Building, Apartment number"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-medium mb-1">Notes (Optional)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows={2}
                  placeholder="Special instructions..."
                />
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>KES {((selectedItem.sellingPrice || selectedItem.basePrice) * quantity).toLocaleString()}</span>
                  </div>
                  {deliveryFee > 0 && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>KES {deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold pt-2 border-t">
                    <span>Total:</span>
                    <span className="text-xl text-blue-600">
                      KES {(((selectedItem.sellingPrice || selectedItem.basePrice) * quantity) + deliveryFee).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5" />
                    Place Order
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Browse;