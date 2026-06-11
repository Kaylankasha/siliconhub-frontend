import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useAuth } from './contexts/AuthContext';

// Admin pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CashierDashboard from './pages/CashierDashboard';
import Sales from './pages/Sales';
import Products from './pages/Products';
import Categories from './pages/Categories';
import Reports from './pages/Reports';
import Users from './pages/Users';
import Partners from './pages/Partners';
import AdminServices from './pages/AdminServices';
import Orders from './pages/Orders';
import DeliverySettings from './pages/DeliverySettings';
import VatSettings from './pages/VatSettings';
import CommissionSettings from './pages/CommissionSettings';
import Layout from './components/Layout';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import WalkInCustomers from './pages/WalkInCustomers';
import WalkInSales from './pages/WalkInSales';

// Customer pages
import CustomerHome from './customer/pages/Home';
import CustomerServices from './customer/pages/Services';
import CustomerPartner from './customer/pages/PartnerRequest';
import MyOrders from './customer/pages/MyOrders';
import CustomerAuth from './customer/pages/CustomerAuth';
import CustomerDashboard from './customer/pages/CustomerDashboard';
import Browse from './customer/pages/Browse';
import CustomerNavbar from './customer/components/Navbar';
import CustomerFooter from './customer/components/Footer';

const queryClient = new QueryClient();

// Component to handle conditional dashboard rendering
const AdminDashboardRouter = () => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  if (user?.role === 'CASHIER') {
    return <CashierDashboard />;
  }
  
  return <Dashboard />;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Toaster position="top-right" richColors />
          <Routes>
            {/* Customer Routes (Public) */}
            <Route path="/" element={
              <>
                <CustomerNavbar />
                <CustomerHome />
                <CustomerFooter />
              </>
            } />
            <Route path="/browse" element={
              <>
                <CustomerNavbar />
                <Browse />
                <CustomerFooter />
              </>
            } />
            <Route path="/services" element={
              <>
                <CustomerNavbar />
                <CustomerServices />
                <CustomerFooter />
              </>
            } />
            <Route path="/my-orders" element={
              <>
                <CustomerNavbar />
                <MyOrders />
                <CustomerFooter />
              </>
            } />
            <Route path="/partner" element={
              <>
                <CustomerNavbar />
                <CustomerPartner />
                <CustomerFooter />
              </>
            } />
            
            {/* Customer Auth Routes */}
            <Route path="/customer/login" element={
              <>
                <CustomerNavbar />
                <CustomerAuth />
                <CustomerFooter />
              </>
            } />
            <Route path="/customer/register" element={
              <>
                <CustomerNavbar />
                <CustomerAuth />
                <CustomerFooter />
              </>
            } />
            <Route path="/customer/dashboard" element={
              <>
                <CustomerNavbar />
                <CustomerDashboard />
                <CustomerFooter />
              </>
            } />
            
            {/* Admin Auth */}
            <Route path="/login" element={<Login />} />
            
            {/* Admin Protected Routes */}
            <Route path="/admin" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="dashboard" element={<AdminDashboardRouter />} />
              <Route path="sales" element={<Sales />} />
              <Route path="products" element={<Products />} />
              <Route path="categories" element={<Categories />} />
              <Route path="reports" element={<Reports />} />
              <Route path="users" element={<Users />} />
              <Route path="partners" element={<Partners />} />
              <Route path="services" element={<AdminServices />} />
              <Route path="orders" element={<Orders />} />
              <Route path="delivery" element={<DeliverySettings />} />
              <Route path="vat" element={<VatSettings />} />
              <Route path="commission" element={<CommissionSettings />} />
              <Route path="walkin-customers" element={<WalkInCustomers />} />
              <Route path="walkin-sales" element={<WalkInSales />} />


            </Route>
            
            {/* Catch all - redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;