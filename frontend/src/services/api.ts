import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 30000
});

// Request interceptor - Add token to every request
api.interceptors.request.use(
  (config) => {
    // For customer routes, use customer token
    if (config.url?.includes('/customer/') || config.url?.includes('/services/') || config.url?.includes('/delivery/')) {
      const customerToken = localStorage.getItem('customerToken');
      if (customerToken) {
        config.headers.Authorization = `Bearer ${customerToken}`;
      }
    } 
    // For admin routes, use admin token
    else {
      const adminToken = localStorage.getItem('token');
      if (adminToken) {
        config.headers.Authorization = `Bearer ${adminToken}`;
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only redirect to login for 401 on admin routes, not customer routes
    if (error.response?.status === 401) {
      const isCustomerRoute = error.config?.url?.includes('/customer/') || 
                              error.config?.url?.includes('/services/') || 
                              error.config?.url?.includes('/delivery/');
      
      if (!isCustomerRoute) {
        // Only redirect to admin login for admin routes
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;