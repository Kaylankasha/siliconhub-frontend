import React, { useState } from 'react';
import { Printer, Upload, FileText, Trash2, X, CreditCard } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface PrintingOrderProps {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

const PrintingOrder: React.FC<PrintingOrderProps> = ({ item, onClose, onSuccess }) => {
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryFeeMessage, setDeliveryFeeMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
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
      const totalPrice = (item.sellingPrice || item.basePrice) * quantity + deliveryFee;
      
      const orderData = {
        serviceId: item.id,
        serviceName: item.name,
        serviceType: 'printing',
        customerName,
        customerEmail,
        customerPhone,
        quantity,
        totalPrice,
        unitPrice: item.sellingPrice || item.basePrice,
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
        toast.success('Order placed! Account created automatically.');
      } else {
        toast.success('Order placed successfully!');
      }
      
      onSuccess();
      onClose();
    } catch (error) {
      toast.error('Error placing order');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold">Printing Order: {item.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
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

          {/* File Upload for Print File */}
          <div>
            <label className="block text-sm font-medium mb-1">Upload File to Print *</label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
              {uploadedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-green-600" />
                    <span className="text-sm text-gray-600 truncate max-w-[200px]">{uploadedFile.name}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadedFile(null)}
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
                    {uploading ? 'Uploading...' : 'Upload file to print'}
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
                <span>KES {((item.sellingPrice || item.basePrice) * quantity).toLocaleString()}</span>
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
                  KES {(((item.sellingPrice || item.basePrice) * quantity) + deliveryFee).toLocaleString()}
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
  );
};

export default PrintingOrder;