import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { Send, Loader, Printer, FileText, Shield, Palette, Book, Computer, Truck, MapPin, Home, CreditCard } from 'lucide-react';
import { toast } from 'sonner';

const Services = () => {
  const [services, setServices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  
  // Delivery states
  const [deliverySettings, setDeliverySettings] = useState<any[]>([]);
  const [locationFees, setLocationFees] = useState<any[]>([]);
  const [deliveryMethod, setDeliveryMethod] = useState('pickup');
  const [deliveryLocation, setDeliveryLocation] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [deliveryFee, setDeliveryFee] = useState(0);
  const [selectedDeliveryMethodDetails, setSelectedDeliveryMethodDetails] = useState<any>(null);
  
  // Validation errors
  const [errors, setErrors] = useState({
    name: '',
    email: '',
    phone: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [servicesRes, deliveryRes, locationRes] = await Promise.all([
        api.get('/services/catalog'),
        api.get('/delivery/settings'),
        api.get('/delivery/location-fees')
      ]);
      setServices(servicesRes.data);
      setDeliverySettings(deliveryRes.data);
      setLocationFees(locationRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const calculateServicePrice = () => {
    if (!selectedService) return 0;
    if (selectedService.priceType === 'fixed') {
      return selectedService.basePrice * quantity;
    } else if (selectedService.priceType === 'per_page') {
      return selectedService.basePrice * quantity;
    } else if (selectedService.priceType === 'per_chapter') {
      return selectedService.basePrice * quantity;
    } else {
      return selectedService.basePrice + (selectedService.unitPrice || 0) * quantity;
    }
  };

  const calculateDeliveryFee = async (method: string, location?: string) => {
    try {
      const response = await api.post('/delivery/calculate-fee', { method, location });
      setSelectedDeliveryMethodDetails(response.data);
      setDeliveryFee(response.data.fee);
    } catch (error) {
      console.error('Error calculating delivery fee:', error);
      // Fallback to manual calculation
      if (method === 'pickup') {
        setDeliveryFee(0);
      } else if (method === 'delivery') {
        const locationFee = locationFees.find(f => f.location.toLowerCase() === location?.toLowerCase());
        setDeliveryFee(locationFee?.fee || 300);
      } else if (method === 'courier') {
        setDeliveryFee(250);
      }
    }
  };

  const handleDeliveryMethodChange = async (method: string) => {
    setDeliveryMethod(method);
    if (method === 'pickup') {
      setDeliveryFee(0);
      setSelectedDeliveryMethodDetails(null);
    } else if (method === 'delivery' && deliveryLocation) {
      await calculateDeliveryFee(method, deliveryLocation);
    } else if (method === 'courier') {
      await calculateDeliveryFee(method);
    }
  };

  const handleLocationChange = async (location: string) => {
    setDeliveryLocation(location);
    if (deliveryMethod === 'delivery' && location) {
      await calculateDeliveryFee('delivery', location);
    }
  };

  const validateForm = () => {
    const newErrors = {
      name: '',
      email: '',
      phone: ''
    };
    let isValid = true;

    if (!customerName.trim()) {
      newErrors.name = 'Full name is required';
      isValid = false;
    }

    if (!customerEmail.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(customerEmail)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!customerPhone.trim()) {
      newErrors.phone = 'Phone number is required';
      isValid = false;
    } else if (!/^[0-9]{10,12}$/.test(customerPhone.replace(/\D/g, ''))) {
      newErrors.phone = 'Please enter a valid phone number (e.g., 0712345678)';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const getTotalPrice = () => {
    const serviceTotal = calculateServicePrice();
    return serviceTotal + deliveryFee;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedService) {
      toast.error('Please select a service');
      return;
    }

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    if (deliveryMethod !== 'pickup' && !deliveryAddress) {
      toast.error('Please provide delivery address');
      return;
    }

    if (deliveryMethod === 'delivery' && !deliveryLocation) {
      toast.error('Please provide your location/town for delivery');
      return;
    }

    setSubmitting(true);
    try {
      // Get customer token if logged in
      const customerToken = localStorage.getItem('customerToken');
      const headers: any = {};
      if (customerToken) {
        headers.Authorization = `Bearer ${customerToken}`;
      }

      const orderData = {
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        serviceType: selectedService.category,
        customerName,
        customerEmail,
        customerPhone,
        quantity,
        totalPrice: getTotalPrice(),
        unitPrice: calculateServicePrice() / quantity,
        notes,
        deliveryMethod,
        deliveryLocation: deliveryMethod !== 'pickup' ? deliveryLocation : null,
        deliveryAddress: deliveryMethod !== 'pickup' ? deliveryAddress : null,
        deliveryFee
      };

      const response = await api.post('/services/order', orderData, { headers });
      
      toast.success('Order placed successfully! We will contact you soon.');
      
      // Reset form
      setSelectedService(null);
      setQuantity(1);
      setCustomerName('');
      setCustomerEmail('');
      setCustomerPhone('');
      setNotes('');
      setDeliveryMethod('pickup');
      setDeliveryLocation('');
      setDeliveryAddress('');
      setDeliveryFee(0);
      setErrors({ name: '', email: '', phone: '' });
      
    } catch (error: any) {
      console.error('Order error:', error);
      toast.error(error.response?.data?.message || 'Error placing order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'printing': return <Printer className="w-6 h-6" />;
      case 'editing': return <FileText className="w-6 h-6" />;
      case 'checking': return <Shield className="w-6 h-6" />;
      case 'design': return <Palette className="w-6 h-6" />;
      case 'stationery': return <Book className="w-6 h-6" />;
      default: return <Computer className="w-6 h-6" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'printing': return 'bg-blue-100 text-blue-600';
      case 'editing': return 'bg-purple-100 text-purple-600';
      case 'checking': return 'bg-green-100 text-green-600';
      case 'design': return 'bg-pink-100 text-pink-600';
      default: return 'bg-gray-100 text-gray-600';
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
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Our Services</h1>
          <p className="text-gray-600 mt-2">Select a service and place your order</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Services List */}
          <div className="lg:col-span-1 space-y-3">
            <h2 className="font-semibold text-lg mb-3">Available Services</h2>
            {services.map((service) => (
              <button
                key={service.id}
                onClick={() => setSelectedService(service)}
                className={`w-full text-left p-4 rounded-lg transition-all ${
                  selectedService?.id === service.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-white hover:shadow-md border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${selectedService?.id === service.id ? 'bg-white/20' : getCategoryColor(service.category)}`}>
                    {getCategoryIcon(service.category)}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{service.name}</div>
                    <div className={`text-sm ${selectedService?.id === service.id ? 'text-blue-100' : 'text-gray-500'}`}>
                      {service.priceType === 'fixed' ? `KES ${service.basePrice}` : `${service.basePrice} per unit`}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Order Form */}
          <div className="lg:col-span-2">
            {selectedService ? (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h2 className="text-xl font-bold mb-4">Order: {selectedService.name}</h2>
                <p className="text-gray-600 mb-4">{selectedService.description}</p>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input
                      type="number"
                      value={quantity}
                      onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                      min={selectedService.minQuantity || 1}
                      max={selectedService.maxQuantity || undefined}
                      className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Delivery Options */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3 flex items-center gap-2">
                      <Truck className="w-5 h-5 text-blue-600" />
                      Delivery Options
                    </h3>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {deliverySettings.map((method) => (
                        <button
                          key={method.method}
                          type="button"
                          onClick={() => handleDeliveryMethodChange(method.method)}
                          className={`p-3 rounded-lg text-sm font-medium transition ${
                            deliveryMethod === method.method
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                          }`}
                        >
                          <div>{method.name}</div>
                          <div className="text-xs mt-1 opacity-80">
                            {method.baseFee === 0 ? 'Free' : `KES ${method.baseFee}`}
                          </div>
                        </button>
                      ))}
                    </div>
                    
                    {deliveryMethod !== 'pickup' && (
                      <div className="space-y-3 mt-3">
                        <div>
                          <label className="block text-sm font-medium mb-1">Town/City</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <MapPin className="h-4 w-4 text-gray-400" />
                            </div>
                            <input
                              type="text"
                              value={deliveryLocation}
                              onChange={(e) => handleLocationChange(e.target.value)}
                              placeholder="e.g., Nairobi, Kisumu, Mombasa"
                              className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                              required={deliveryMethod === 'delivery'}
                            />
                          </div>
                          {deliveryLocation && locationFees.find(f => f.location.toLowerCase() === deliveryLocation.toLowerCase()) && (
                            <p className="text-xs text-green-600 mt-1">
                              Delivery fee for {deliveryLocation}: KES {locationFees.find(f => f.location.toLowerCase() === deliveryLocation.toLowerCase())?.fee}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">Full Delivery Address</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <Home className="h-4 w-4 text-gray-400" />
                            </div>
                            <textarea
                              value={deliveryAddress}
                              onChange={(e) => setDeliveryAddress(e.target.value)}
                              placeholder="Street, Building, Apartment number, Landmark"
                              className="w-full pl-10 pr-3 py-2 border rounded focus:ring-2 focus:ring-blue-500"
                              rows={2}
                              required
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {selectedDeliveryMethodDetails && (
                      <div className="mt-2 text-xs text-gray-500">
                        {selectedDeliveryMethodDetails.estimatedDays && (
                          <p>Estimated delivery: {selectedDeliveryMethodDetails.estimatedDays}</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Customer Information */}
                  <div className="border-t pt-4 mt-4">
                    <h3 className="font-semibold mb-3">Your Information</h3>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => {
                          setCustomerName(e.target.value);
                          setErrors({...errors, name: ''});
                        }}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                          errors.name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        Email Address <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={customerEmail}
                        onChange={(e) => {
                          setCustomerEmail(e.target.value);
                          setErrors({...errors, email: ''});
                        }}
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">
                        Phone Number <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={customerPhone}
                        onChange={(e) => {
                          setCustomerPhone(e.target.value);
                          setErrors({...errors, phone: ''});
                        }}
                        placeholder="e.g., 0712345678"
                        className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                    </div>

                    <div className="mt-3">
                      <label className="block text-sm font-medium mb-1">Additional Notes</label>
                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500"
                        rows={2}
                        placeholder="Any special instructions or requirements..."
                      />
                    </div>
                  </div>

                  {/* Price Summary */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span>Service Subtotal:</span>
                        <span>KES {calculateServicePrice().toLocaleString()}</span>
                      </div>
                      {deliveryFee > 0 && (
                        <div className="flex justify-between items-center">
                          <span>Delivery Fee:</span>
                          <span>KES {deliveryFee.toLocaleString()}</span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t font-bold">
                        <span>Total Amount:</span>
                        <span className="text-2xl text-blue-600">KES {getTotalPrice().toLocaleString()}</span>
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
                        <Loader className="w-5 h-5 animate-spin" />
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
            ) : (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <Printer className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500">Select a service from the left to place an order</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Services;