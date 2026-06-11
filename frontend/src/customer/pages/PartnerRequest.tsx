import React, { useState } from 'react';
import { api } from '../../services/api';
import { Handshake, Star, TrendingUp, Send, Loader } from 'lucide-react';
import { toast } from 'sonner';

const PartnerRequest = () => {
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    businessName: '',
    contactPerson: '',
    email: '',
    phone: '',
    businessType: '',
    estimatedVolume: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    try {
      await api.post('/partners/request', formData);
      toast.success('Partner request submitted! We will contact you within 24 hours.');
      setFormData({
        businessName: '',
        contactPerson: '',
        email: '',
        phone: '',
        businessType: '',
        estimatedVolume: '',
        message: ''
      });
    } catch (error) {
      toast.error('Error submitting request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-8 text-white text-center">
            <Handshake className="w-16 h-16 mx-auto mb-4" />
            <h1 className="text-3xl font-bold">Become a Strategic Partner</h1>
            <p className="mt-2 text-blue-100">Join our partner program and grow your business with us</p>
          </div>

          <div className="p-6">
            {/* Benefits */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <Star className="w-8 h-8 text-green-600 mx-auto mb-2" />
                <h3 className="font-semibold">Bulk Discounts</h3>
                <p className="text-sm text-gray-600">Up to 25% off on bulk orders</p>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <h3 className="font-semibold">Priority Support</h3>
                <p className="text-sm text-gray-600">Dedicated account manager</p>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <Handshake className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <h3 className="font-semibold">Revenue Share</h3>
                <p className="text-sm text-gray-600">Earn commissions on referrals</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                value={formData.businessName}
                onChange={(e) => setFormData({...formData, businessName: e.target.value})}
                placeholder="Business Name *"
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="text"
                value={formData.contactPerson}
                onChange={(e) => setFormData({...formData, contactPerson: e.target.value})}
                placeholder="Contact Person *"
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                placeholder="Email Address *"
                className="w-full p-3 border rounded-lg"
                required
              />
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="Phone Number *"
                className="w-full p-3 border rounded-lg"
                required
              />
              <select
                value={formData.businessType}
                onChange={(e) => setFormData({...formData, businessType: e.target.value})}
                className="w-full p-3 border rounded-lg"
                required
              >
                <option value="">Select Business Type</option>
                <option value="printing">Printing Shop</option>
                <option value="stationery">Stationery Store</option>
                <option value="cyber">Cyber Cafe</option>
                <option value="corporate">Corporate</option>
                <option value="other">Other</option>
              </select>
              <select
                value={formData.estimatedVolume}
                onChange={(e) => setFormData({...formData, estimatedVolume: e.target.value})}
                className="w-full p-3 border rounded-lg"
              >
                <option value="">Estimated Monthly Volume</option>
                <option value="1-10k">KES 1,000 - 10,000</option>
                <option value="10-50k">KES 10,000 - 50,000</option>
                <option value="50-100k">KES 50,000 - 100,000</option>
                <option value="100k+">KES 100,000+</option>
              </select>
              <textarea
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                placeholder="Additional information about your business"
                className="w-full p-3 border rounded-lg"
                rows={4}
              />
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Partner Request
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PartnerRequest;