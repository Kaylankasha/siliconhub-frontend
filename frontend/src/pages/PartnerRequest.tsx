import React, { useState } from 'react';
import { api } from '../services/api';
import { Printer, ChevronRight, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';

const PartnerRequest = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    businessType: '',
    serviceType: '',
    category: '',
    quantity: 0
  });

  const handleSubmit = async () => {
    try {
      await api.post('/partners/request', {
        name: formData.name,
        phone: formData.phone,
        email: formData.email,
        businessType: formData.businessType
      });
      toast.success('Request submitted successfully! We will contact you soon.');
      setStep(4);
    } catch (error) {
      toast.error('Error submitting request');
    }
  };

  const handleServiceRequest = async () => {
    try {
      const response = await api.post('/partners/service-request', {
        partnerId: localStorage.getItem('partnerId'),
        serviceType: formData.serviceType,
        category: formData.category,
        quantity: formData.quantity
      });
      toast.success(`Request submitted! You get ${response.data.discountPercent}% discount!`);
      setStep(4);
    } catch (error) {
      toast.error('Error submitting service request');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-purple-700">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white rounded-full mb-4">
              <Printer className="w-10 h-10 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-white">Become a Strategic Partner</h1>
            <p className="text-blue-100 mt-2">Join Silicon Hub Technologies partnership program</p>
          </div>

          {/* Progress Steps */}
          <div className="bg-white rounded-lg shadow-xl p-8">
            <div className="flex justify-between mb-8">
              {[1, 2, 3, 4].map((s) => (
                <div key={s} className="flex-1 text-center">
                  <div className={`w-8 h-8 rounded-full mx-auto flex items-center justify-center ${
                    step >= s ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-500'
                  }`}>
                    {step > s ? <CheckCircle className="w-5 h-5" /> : s}
                  </div>
                  <p className="text-xs mt-2 text-gray-600">
                    {s === 1 && 'Details'}
                    {s === 2 && 'Services'}
                    {s === 3 && 'Quantity'}
                    {s === 4 && 'Complete'}
                  </p>
                </div>
              ))}
            </div>

            {/* Step 1: Personal Details */}
            {step === 1 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Your Information</h2>
                <input
                  type="text"
                  placeholder="Full Name *"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone Number *"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email Address *"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <input
                  type="text"
                  placeholder="Business Type (Optional)"
                  value={formData.businessType}
                  onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => setStep(2)}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700"
                >
                  Next <ChevronRight className="w-5 h-5 inline" />
                </button>
              </div>
            )}

            {/* Step 2: Select Service */}
            {step === 2 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">What service do you offer?</h2>
                <div className="grid grid-cols-2 gap-3">
                  {['Printing', 'Photocopy', 'Referral'].map((service) => (
                    <button
                      key={service}
                      onClick={() => setFormData({...formData, serviceType: service.toLowerCase()})}
                      className={`p-4 border rounded-lg text-center ${
                        formData.serviceType === service.toLowerCase()
                          ? 'border-blue-600 bg-blue-50'
                          : 'border-gray-200'
                      }`}
                    >
                      {service}
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => setStep(3)}
                  disabled={!formData.serviceType}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Next <ChevronRight className="w-5 h-5 inline" />
                </button>
              </div>
            )}

            {/* Step 3: Category & Quantity */}
            {step === 3 && (
              <div className="space-y-4">
                <h2 className="text-xl font-semibold mb-4">Select Category</h2>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({...formData, category: e.target.value})}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select category</option>
                  <option value="assignments">Print Assignments</option>
                  <option value="project">Print Project</option>
                  <option value="shirt">Print T-Shirt</option>
                  <option value="mug">Print Mug</option>
                  <option value="cap">Print Cap</option>
                  <option value="bags">Carrier Bags</option>
                </select>
                
                <div>
                  <label className="block text-sm font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value) || 0})}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    min="1"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Discounts start from 100+ pages/items
                  </p>
                </div>
                
                <button
                  onClick={handleServiceRequest}
                  disabled={!formData.category || formData.quantity < 1}
                  className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Submit Request
                </button>
              </div>
            )}

            {/* Step 4: Completion */}
            {step === 4 && (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold">Request Submitted!</h2>
                <p className="text-gray-600">
                  Thank you for your interest in partnering with Silicon Hub Technologies.
                  Our team will review your application and contact you within 24 hours.
                </p>
                <a href="/" className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                  Return to Home
                </a>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRequest;