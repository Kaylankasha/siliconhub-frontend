import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import { Phone, Mail, Lock, User, ArrowRight, Eye, EyeOff, MapPin, Home, Smartphone } from 'lucide-react';
import { toast } from 'sonner';

const CustomerAuth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tempIdentifier, setTempIdentifier] = useState('');
  const navigate = useNavigate();
  
  const [loginData, setLoginData] = useState({
    identifier: '',
    password: ''
  });
  
  const [registerData, setRegisterData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    location: '',
    address: ''
  });

  // Quick login function - update to verify token
const handleQuickLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!loginData.identifier) {
    toast.error('Please enter your phone number');
    return;
  }
  
  setLoading(true);
  try {
    const response = await api.post('/customer/auth/quick-login', { 
      phone: loginData.identifier 
    });
    
    console.log('Login response:', response.data);
    
    if (response.data.token) {
      localStorage.setItem('customerToken', response.data.token);
      localStorage.setItem('customer', JSON.stringify(response.data.customer));
      
      // Verify token was saved
      const savedToken = localStorage.getItem('customerToken');
      console.log('Token saved successfully:', savedToken ? 'Yes' : 'No');
      
      toast.success('Login successful!');
      window.location.href = '/customer/dashboard';
    } else {
      toast.error('No token received from server');
    }
  } catch (error: any) {
    console.error('Quick login error:', error.response?.status, error.response?.data);
    if (error.response?.status === 404) {
      toast.info('No account found. Please register first.');
      setIsLogin(false);
      setRegisterData({...registerData, phone: loginData.identifier});
    } else {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  } finally {
    setLoading(false);
  }
};

// Password login
const handlePasswordLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!loginData.identifier || !loginData.password) {
    toast.error('Please fill in all fields');
    return;
  }
  
  setLoading(true);
  try {
    const response = await api.post('/customer/auth/login', {
      identifier: loginData.identifier,
      password: loginData.password
    });
    
    console.log('Password login response:', response.data);
    
    localStorage.setItem('customerToken', response.data.token);
    localStorage.setItem('customer', JSON.stringify(response.data.customer));
    
    toast.success(response.data.message);
    window.location.href = '/customer/dashboard';
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};

// Registration
const handleRegister = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!registerData.fullName || !registerData.phone || !registerData.password) {
    toast.error('Please fill in all required fields');
    return;
  }
  if (registerData.password !== registerData.confirmPassword) {
    toast.error('Passwords do not match');
    return;
  }
  if (registerData.password.length < 6) {
    toast.error('Password must be at least 6 characters');
    return;
  }
  
  setLoading(true);
  try {
    const { confirmPassword, ...registerPayload } = registerData;
    const response = await api.post('/customer/auth/register', registerPayload);
    
    console.log('Registration response:', response.data);
    
    localStorage.setItem('customerToken', response.data.token);
    localStorage.setItem('customer', JSON.stringify(response.data.customer));
    
    toast.success('Registration successful!');
    window.location.href = '/customer/dashboard';
  } catch (error: any) {
    toast.error(error.response?.data?.message || 'Registration failed');
  } finally {
    setLoading(false);
  }
};

  // Show OTP screen
  if (showOtp) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Smartphone className="w-8 h-8 text-blue-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Verify Your Number</h1>
              <p className="text-gray-500 mt-2">
                Enter the 6-digit code sent to {tempIdentifier}
              </p>
            </div>
            
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  OTP Code
                </label>
                <input
                  type="text"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value)}
                  placeholder="000000"
                  maxLength={6}
                  className="w-full p-3 border rounded-lg text-center text-2xl font-mono focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
              >
                {loading ? 'Verifying...' : 'Verify & Login'}
              </button>
              
              <button
                type="button"
                onClick={() => {
                  setShowOtp(false);
                  setOtpCode('');
                }}
                className="w-full text-gray-500 text-sm hover:text-gray-600"
              >
                ← Back to login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">
              {isLogin ? 'Welcome Back!' : 'Create Customer Account'}
            </h1>
            <p className="text-gray-500 mt-2">
              {isLogin 
                ? 'Login with your phone number or email' 
                : 'Register to track orders and get discounts'}
            </p>
          </div>

          {isLogin ? (
            <>
              {/* Quick Login with Phone */}
              <div className="mb-6">
                <div className="bg-blue-50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-blue-800 mb-2">Quick Login with Phone Number</p>
                  <form onSubmit={handleQuickLogin} className="flex gap-2">
                    <input
                      type="tel"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                      placeholder="0712345678"
                      className="flex-1 p-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Login
                    </button>
                  </form>
                </div>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-300"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white text-gray-500">Or login with password</span>
                  </div>
                </div>
              </div>

              {/* Password Login */}
              <form onSubmit={handlePasswordLogin} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email or Phone
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={loginData.identifier}
                      onChange={(e) => setLoginData({...loginData, identifier: e.target.value})}
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="email@example.com or 0712345678"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginData.password}
                      onChange={(e) => setLoginData({...loginData, password: e.target.value})}
                      className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gray-600 text-white py-2 rounded-lg font-semibold hover:bg-gray-700 transition"
                >
                  {loading ? 'Logging in...' : 'Login with Password'}
                </button>
              </form>
            </>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={registerData.fullName}
                    onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="John Doe"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData({...registerData, phone: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="0712345678"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email (Optional)</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    value={registerData.email}
                    onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MapPin className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={registerData.location}
                      onChange={(e) => setRegisterData({...registerData, location: e.target.value})}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Nairobi"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address (Optional)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Home className="h-4 w-4 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={registerData.address}
                      onChange={(e) => setRegisterData({...registerData, address: e.target.value})}
                      className="block w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Street, Building"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.password}
                    onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={registerData.confirmPassword}
                    onChange={(e) => setRegisterData({...registerData, confirmPassword: e.target.value})}
                    className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2 rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Register'}
              </button>
            </form>
          )}

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
            </button>
          </div>
          
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate('/my-orders')}
              className="text-sm text-gray-500 hover:text-gray-600"
            >
              Track order without login →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerAuth;