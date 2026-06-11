import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Users, TrendingUp } from 'lucide-react';

import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  BarChart3, 
  
  Handshake, 
  LogOut, 
  Printer, 
  UserCircle,
  Menu,
  X,
  Tag,
  Truck,
  Settings,
  Percent,
  DollarSign
} from 'lucide-react';

const Layout = () => {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Check authentication on mount and when location changes
  React.useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Don't render anything while checking authentication
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Base menu items for all authenticated users (Admin and Cashier)
  const baseMenuItems = [
    { path: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard', color: 'text-blue-500' },
    { path: '/admin/sales', icon: ShoppingCart, label: 'Point of Sale', color: 'text-green-500' },
    { path: '/admin/products', icon: Package, label: 'Products', color: 'text-purple-500' },
    { path: '/admin/categories', icon: Tag, label: 'Categories', color: 'text-yellow-500' },
    { path: '/admin/reports', icon: BarChart3, label: 'Reports', color: 'text-orange-500' },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    { path: '/admin/services', icon: Settings, label: 'Services', color: 'text-teal-500' },
    { path: '/admin/orders', icon: Package, label: 'Orders', color: 'text-cyan-500' },
    { path: '/admin/users', icon: Users, label: 'Users', color: 'text-indigo-500' },
    { path: '/admin/partners', icon: Handshake, label: 'Partners', color: 'text-pink-500' },
    { path: '/admin/delivery', icon: Truck, label: 'Delivery', color: 'text-orange-500' },
    { path: '/admin/vat', icon: Percent, label: 'VAT Settings', color: 'text-purple-500' },
    { path: '/admin/commission', icon: DollarSign, label: 'Commission', color: 'text-green-500' },
    { path: '/admin/walkin-customers', icon: Users, label: 'Walk-in Customers', color: 'text-teal-500' },
    { path: '/admin/walkin-sales', icon: TrendingUp, label: 'Walk-in Sales', color: 'text-teal-500' },


  ];

  // Combine menu items based on role
  const menuItems = [...baseMenuItems];
  if (user?.role === 'ADMIN') {
    menuItems.push(...adminMenuItems);
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-gradient-to-br from-blue-700 via-blue-800 to-blue-900 
        transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-auto
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Logo */}
        <div className="flex items-center justify-between p-6 border-b border-blue-600">
          <div className="flex items-center space-x-3">
            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
              <Printer className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Silicon Hub</h1>
              <p className="text-xs text-blue-200">Admin Portal</p>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden text-white hover:text-blue-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200
                  ${isActive 
                    ? 'bg-white bg-opacity-20 text-white shadow-lg' 
                    : 'text-blue-100 hover:bg-white hover:bg-opacity-10 hover:text-white'
                  }
                `}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : item.color}`} />
                <span className="font-medium">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1 h-8 bg-white rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-blue-600">
          <div className="flex items-center space-x-3 mb-4 p-2 rounded-lg bg-white bg-opacity-10">
            <div className="bg-white bg-opacity-20 p-2 rounded-full">
              <UserCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-white">{user?.fullName || user?.username}</p>
              <p className="text-xs text-blue-200">{user?.role}</p>
            </div>
          </div>
          <Link
            to="/"
            className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg text-blue-200 hover:bg-blue-700 hover:text-white transition-all duration-200 mb-2"
          >
            <Printer className="w-5 h-5" />
            <span>Customer Site</span>
          </Link>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 w-full px-4 py-2 rounded-lg text-red-200 hover:bg-red-600 hover:text-white transition-all duration-200"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden text-gray-600 hover:text-gray-900"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1">
              <h2 className="text-2xl font-semibold text-gray-800">
                {menuItems.find(item => item.path === location.pathname)?.label || 'Dashboard'}
              </h2>
            </div>
            <div className="flex items-center space-x-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium text-gray-700">{user?.fullName || user?.username}</p>
                <p className="text-xs text-gray-500">{user?.role}</p>
              </div>
              <div className="bg-blue-100 p-2 rounded-full">
                <UserCircle className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;