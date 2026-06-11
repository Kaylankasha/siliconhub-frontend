import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Printer, FileText, Shield, Handshake, ArrowRight, Package, Star, Users, ShoppingBag, Truck, CreditCard, LogIn, UserPlus } from 'lucide-react';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const customer = localStorage.getItem('customer');
    if (token && customer) {
      setIsLoggedIn(true);
      try {
        const customerData = JSON.parse(customer);
        setCustomerName(customerData.fullName);
      } catch (e) {}
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-2 rounded-full mb-6">
            <Printer className="w-5 h-5" />
            <span className="text-sm font-medium">Silicon Hub Technologies</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
            Your One-Stop Shop for
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              {" "}Printing & Tech Services
            </span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Professional printing, editing services, stationery, electronics, and more. 
            Quality service at affordable prices.
          </p>
          
          {/* Customer Auth Buttons */}
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {isLoggedIn ? (
              <>
                <Link
                  to="/customer/dashboard"
                  className="bg-gradient-to-r from-green-600 to-teal-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  <ShoppingBag className="w-5 h-5" />
                  My Dashboard
                </Link>
                <button
                  onClick={handleLogout}
                  className="border-2 border-red-600 text-red-600 px-6 py-3 rounded-lg font-semibold hover:bg-red-50 transition"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/customer/login"
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center gap-2"
                >
                  <LogIn className="w-5 h-5" />
                  Customer Login
                </Link>
                <Link
                  to="/customer/register"
                  className="border-2 border-green-600 text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center gap-2"
                >
                  <UserPlus className="w-5 h-5" />
                  Register
                </Link>
              </>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/browse"
              className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-3 rounded-lg font-semibold hover:shadow-lg transition flex items-center justify-center gap-2"
            >
              Browse All Products & Services
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/my-orders"
              className="border-2 border-green-600 text-green-600 px-8 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center justify-center gap-2"
            >
              <Package className="w-5 h-5" />
              Track My Orders
            </Link>
            <Link
              to="/partner"
              className="border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
            >
              Become a Partner
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link to="/browse" className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition group">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition">
              <ShoppingBag className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="font-semibold text-lg">Shop Now</h3>
            <p className="text-gray-500 text-sm mt-1">Browse our products and services</p>
          </Link>
          <Link to="/my-orders" className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition group">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition">
              <Package className="w-8 h-8 text-green-600" />
            </div>
            <h3 className="font-semibold text-lg">Track Orders</h3>
            <p className="text-gray-500 text-sm mt-1">Check your order status</p>
          </Link>
          <Link to="/partner" className="bg-white rounded-xl shadow-sm p-6 text-center hover:shadow-md transition group">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition">
              <Handshake className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="font-semibold text-lg">Partner With Us</h3>
            <p className="text-gray-500 text-sm mt-1">Join our partner program</p>
          </Link>
        </div>
      </div>

      {/* Services Grid */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Services</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            From printing to professional editing, we've got you covered
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Printing Services */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <Printer className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Printing Services</h3>
            <p className="text-gray-600 mb-4">
              Black & white, color, A4, A3, T-shirt, mug, cap, and carrier bag printing
            </p>
            <Link to="/browse?category=printing" className="text-blue-600 font-medium hover:text-blue-700">
              Browse Printing →
            </Link>
          </div>

          {/* Editing Services */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Editing Services</h3>
            <p className="text-gray-600 mb-4">
              Masters projects, class projects, thesis editing, and proofreading
            </p>
            <Link to="/browse?category=editing" className="text-purple-600 font-medium hover:text-purple-700">
              Browse Editing →
            </Link>
          </div>

          {/* Plagiarism Check */}
          <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-lg transition">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <Shield className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Plagiarism & AI Check</h3>
            <p className="text-gray-600 mb-4">
              Turnitin and AI detection services for academic work
            </p>
            <Link to="/browse?category=checking" className="text-green-600 font-medium hover:text-green-700">
              Browse Checks →
            </Link>
          </div>
        </div>
      </div>

      {/* Products Section */}
      <div className="bg-gray-100 py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Our Products</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Quality stationery and electronics for your daily needs
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Package className="w-12 h-12 mx-auto text-blue-500 mb-3" />
              <h3 className="font-semibold">Stationery</h3>
              <p className="text-sm text-gray-500 mt-1">Books, pens, envelopes</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Package className="w-12 h-12 mx-auto text-purple-500 mb-3" />
              <h3 className="font-semibold">Electronics</h3>
              <p className="text-sm text-gray-500 mt-1">USB cables, mice, keyboards</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Package className="w-12 h-12 mx-auto text-green-500 mb-3" />
              <h3 className="font-semibold">Office Supplies</h3>
              <p className="text-sm text-gray-500 mt-1">Everything for your office</p>
            </div>
            <div className="bg-white rounded-xl shadow-sm p-6 text-center">
              <Package className="w-12 h-12 mx-auto text-orange-500 mb-3" />
              <h3 className="font-semibold">Custom Printing</h3>
              <p className="text-sm text-gray-500 mt-1">T-shirts, mugs, caps</p>
            </div>
          </div>
          <div className="text-center mt-8">
            <Link to="/browse" className="inline-flex items-center gap-2 text-blue-600 font-semibold hover:text-blue-700">
              View All Products
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-2">5000+</div>
              <div className="text-blue-100">Happy Customers</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">10000+</div>
              <div className="text-blue-100">Orders Completed</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">50+</div>
              <div className="text-blue-100">Strategic Partners</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-2">24/7</div>
              <div className="text-blue-100">Customer Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to get started?</h2>
        <p className="text-gray-600 mb-8">
          Browse our products and services, place an order, and get it delivered
        </p>
        <div className="flex flex-wrap gap-4 justify-center">
          <Link
            to="/browse"
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
          >
            Start Shopping
            <ArrowRight className="w-5 h-5" />
          </Link>
          <Link
            to="/partner"
            className="inline-flex items-center gap-2 border-2 border-blue-600 text-blue-600 px-8 py-3 rounded-lg font-semibold hover:bg-blue-50 transition"
          >
            Become a Partner
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;