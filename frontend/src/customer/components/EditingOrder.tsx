import React, { useState } from 'react';
import { FileText, Upload, Trash2, X, CreditCard, BookOpen } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface EditingOrderProps {
  item: any;
  onClose: () => void;
  onSuccess: () => void;
}

const EditingOrder: React.FC<EditingOrderProps> = ({ item, onClose, onSuccess }) => {
  const [projectType, setProjectType] = useState('masters');
  const [editType, setEditType] = useState('full');
  const [chapters, setChapters] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ url: string; name: string } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const calculatePrice = () => {
    if (projectType === 'masters') {
      return (editType === 'full' ? 5000 : 1000) * chapters;
    }
    return 400;
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
    
    if (!uploadedFile) {
      toast.error('Please upload your document');
      return;
    }
    
    setSubmitting(true);
    try {
      const totalPrice = calculatePrice();
      
      const orderData = {
        serviceId: item.id,
        serviceName: item.name,
        serviceType: 'editing',
        customerName,
        customerEmail,
        customerPhone,
        quantity: chapters,
        totalPrice,
        unitPrice: projectType === 'masters' ? (editType === 'full' ? 5000 : 1000) : 400,
        notes: `${notes}\nProject Type: ${projectType}\nEdit Type: ${editType}\nChapters: ${chapters}`,
        deliveryMethod: 'pickup',
        deliveryFee: 0,
        fileUrl: uploadedFile?.url,
        specifications: JSON.stringify({ projectType, editType, chapters })
      };
      
      const response = await axios.post(`${API_URL}/services/order`, orderData);
      
      if (response.data.autoCreatedAccount && response.data.token) {
        localStorage.setItem('customerToken', response.data.token);
        localStorage.setItem('customer', JSON.stringify(response.data.customer));
        toast.success('Order placed! Account created automatically.');
      } else {
        toast.success('Editing order placed successfully!');
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
            <BookOpen className="w-5 h-5 text-purple-600" />
            <h2 className="text-xl font-bold">Editing Order: {item.name}</h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Project Type</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setProjectType('masters')}
                className={`p-2 rounded-lg text-sm transition ${
                  projectType === 'masters' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                Masters Project
              </button>
              <button
                type="button"
                onClick={() => setProjectType('class')}
                className={`p-2 rounded-lg text-sm transition ${
                  projectType === 'class' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                }`}
              >
                Class Project
              </button>
            </div>
          </div>

          {projectType === 'masters' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-1">Edit Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditType('full')}
                    className={`p-2 rounded-lg text-sm transition ${
                      editType === 'full' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    Full (KES 5,000/chapter)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditType('partial')}
                    className={`p-2 rounded-lg text-sm transition ${
                      editType === 'partial' ? 'bg-blue-600 text-white' : 'bg-gray-100'
                    }`}
                  >
                    Partial (KES 1,000/chapter)
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Chapters</label>
                <input
                  type="number"
                  value={chapters}
                  onChange={(e) => setChapters(Math.max(1, parseInt(e.target.value) || 1))}
                  min={1}
                  className="w-full p-2 border rounded"
                  required
                />
              </div>
            </>
          )}

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
            <label className="block text-sm font-medium mb-1">Upload Document to Edit *</label>
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
                    accept=".doc,.docx,.pdf,.txt"
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
                    {uploading ? 'Uploading...' : 'Upload document'}
                  </button>
                </>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Additional Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-2 border rounded"
              rows={2}
              placeholder="Any special instructions..."
            />
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex justify-between items-center">
              <span className="font-semibold">Total Price:</span>
              <span className="text-2xl font-bold text-purple-600">KES {calculatePrice().toLocaleString()}</span>
            </div>
            <p className="text-xs text-purple-600 mt-1">Editing service only. Delivery is digital.</p>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Processing...
              </>
            ) : (
              <>
                <CreditCard className="w-5 h-5" />
                Submit for Editing
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditingOrder;