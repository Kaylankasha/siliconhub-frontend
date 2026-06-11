import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Printer, Menu, X, Phone, User, LogIn, ShoppingBag, Package, Home as HomeIcon } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    setIsLoggedIn(!!token);
  }, [location]);

  const handleLogout = () => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customer');
    setIsLoggedIn(false);
    navigate('/');
  };

  const navLinks = [
    { path: '/', label: 'Home', icon: HomeIcon },
    { path: '/browse', label: 'Shop', icon: ShoppingBag },
    { path: '/customer/dashboard', label: 'My Orders' },  // Changed from /my-orders
    { path: '/partner', label: 'Partner With Us', icon: null },
  ];

  return (
    <nav className="bg-white shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-2 rounded-lg">
              <Printer className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-xl text-gray-800">Silicon Hub</span>
            <span className="text-sm text-gray-500 hidden sm:inline">Technologies</span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-gray-600 hover:text-blue-600 transition flex items-center gap-1 ${
                  location.pathname === link.path ? 'text-blue-600 font-semibold' : ''
                }`}
              >
                {link.icon && <link.icon className="w-4 h-4" />}
                {link.label}
              </Link>
            ))}
            
            {isLoggedIn ? (
              <>
                <Link
                  to="/customer/dashboard"
                  className="flex items-center gap-2 text-gray-600 hover:text-blue-600"
                >
                  <User className="w-4 h-4" />
                  My Account
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-red-600 hover:text-red-700"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/customer/login"
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
              >
                <LogIn className="w-4 h-4" />
                Customer Login
              </Link>
            )}
            
            <Link
              to="/login"
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              Admin Login
            </Link>
            
            <div className="flex items-center gap-2 ml-4 pl-4 border-l">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">0721 372710</span>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-gray-600"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className="block py-2 text-gray-600 hover:text-blue-600 transition"
              >
                {link.label}
              </Link>
            ))}
            {isLoggedIn ? (
              <>
                <Link
                  to="/customer/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="block py-2 text-gray-600 hover:text-blue-600"
                >
                  My Account
                </Link>
                <button
                  onClick={() => {
                    handleLogout();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-600"
                >
                  Logout
                </button>
              </>
            ) : (
              <Link
                to="/customer/login"
                onClick={() => setIsOpen(false)}
                className="block py-2 text-green-600 font-semibold"
              >
                Customer Login / Register
              </Link>
            )}
            <Link
              to="/login"
              onClick={() => setIsOpen(false)}
              className="block py-2 text-blue-600 font-semibold"
            >
              Admin Login
            </Link>
            <div className="pt-4 mt-4 border-t">
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">0721 372710</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;