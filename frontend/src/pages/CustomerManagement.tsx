import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Search, Users, Phone, Mail, DollarSign, Calendar, Eye, X, CreditCard, Wallet } from 'lucide-react';
import { toast } from 'sonner';

interface Customer {
  id: string;
  fullName: string;
  phone: string;
  email?: string;
  outstandingBalance: number;
  totalSpent: number;
  lastPurchaseAt?: string;
}

const CustomerManagement = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [showBalanceCustomers, setShowBalanceCustomers] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [showBalanceCustomers]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = showBalanceCustomers 
        ? '/customers/with-balance' 
        : '/customers/search?q=' + (searchTerm || ' ');
      
      const response = await api.get(url);
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const searchCustomers = async () => {
    if (searchTerm.length < 2 && !showBalanceCustomers) {
      setCustomers([]);
      return;
    }
    await fetchCustomers();
  };

  const viewCustomerDetails = async (id: string) => {
    try {
      const response = await api.get(`/customers/${id}`);
      setSelectedCustomer(response.data);
    } catch (error) {
      toast.error('Error fetching customer details');
    }
  };

  const recordPayment = async () => {
    if (paymentAmount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }
    
    if (paymentAmount > selectedCustomer.outstandingBalance) {
      toast.error(`Amount exceeds outstanding balance of KES ${selectedCustomer.outstandingBalance}`);
      return;
    }
    
    try {
      const response = await api.post(`/customers/${selectedCustomer.id}/payment`, {
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference
      });
      
      toast.success(`Payment of KES ${paymentAmount} recorded successfully`);
      setShowPaymentModal(false);
      setPaymentAmount(0);
      setPaymentReference('');
      fetchCustomers();
      viewCustomerDetails(selectedCustomer.id);
    } catch (error) {
      toast.error('Error recording payment');
    }
  };

  const formatCurrency = (amount: number) => {
    return `KES ${amount.toLocaleString()}`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customer Management</h1>
          <p className="text-gray-500 mt-1">Manage customers and track outstanding balances</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowBalanceCustomers(!showBalanceCustomers)}
            className={`px-4 py-2 rounded-lg transition ${
              showBalanceCustomers 
                ? 'bg-yellow-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {showBalanceCustomers ? 'Show All Customers' : 'Show Customers with Balance'}
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, phone number, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchCustomers()}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={searchCustomers}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Search
          </button>
        </div>
      </div>

      {/* Customers List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : customers.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm p-12 text-center">
          <Users className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">No customers found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {customers.map((customer) => (
            <div
              key={customer.id}
              className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition cursor-pointer"
              onClick={() => viewCustomerDetails(customer.id)}
            >
              <div className="p-4 border-b bg-gray-50">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{customer.fullName}</h3>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                      <Phone className="w-3 h-3" />
                      {customer.phone}
                    </div>
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                        <Mail className="w-3 h-3" />
                        {customer.email}
                      </div>
                    )}
                  </div>
                  {customer.outstandingBalance > 0 && (
                    <div className="bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-semibold">
                      Balance: {formatCurrency(customer.outstandingBalance)}
                    </div>
                  )}
                </div>
              </div>
              <div className="p-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500">Total Spent:</span>
                  <span className="font-semibold text-green-600">{formatCurrency(customer.totalSpent)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Last Purchase:</span>
                  <span className="text-gray-600">{formatDate(customer.lastPurchaseAt)}</span>
                </div>
                {customer.outstandingBalance > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCustomer(customer);
                      setShowPaymentModal(true);
                    }}
                    className="mt-3 w-full bg-green-600 text-white py-1.5 rounded-lg text-sm hover:bg-green-700 transition"
                  >
                    Record Payment
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Customer Details Modal */}
      {selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Customer Details</h2>
              <button onClick={() => setSelectedCustomer(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-semibold">{selectedCustomer.fullName}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Phone Number</p>
                  <p className="font-semibold">{selectedCustomer.phone}</p>
                </div>
                {selectedCustomer.email && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-semibold">{selectedCustomer.email}</p>
                  </div>
                )}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-semibold">{new Date(selectedCustomer.createdAt).toLocaleDateString()}</p>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Total Spent</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Outstanding Balance</p>
                    <p className={`text-2xl font-bold ${selectedCustomer.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(selectedCustomer.outstandingBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Orders</p>
                    <p className="text-2xl font-bold">{selectedCustomer.sales?.length || 0}</p>
                  </div>
                </div>
              </div>

              {/* Recent Sales */}
              {selectedCustomer.sales && selectedCustomer.sales.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Recent Sales</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Receipt No</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Paid</th>
                          <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Balance</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedCustomer.sales.map((sale: any) => (
                          <tr key={sale.id} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm font-mono">{sale.receiptNo}</td>
                            <td className="px-4 py-2 text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(sale.total)}</td>
                            <td className="px-4 py-2 text-sm text-right">{formatCurrency(sale.amountPaid)}</td>
                            <td className={`px-4 py-2 text-sm text-right font-semibold ${sale.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                              {formatCurrency(sale.remainingBalance)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Transactions */}
              {selectedCustomer.transactions && selectedCustomer.transactions.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">Transaction History</h3>
                  <div className="space-y-2">
                    {selectedCustomer.transactions.map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium capitalize">{tx.type}</p>
                          <p className="text-xs text-gray-500">{new Date(tx.createdAt).toLocaleString()}</p>
                          {tx.reference && <p className="text-xs text-gray-400">Ref: {tx.reference}</p>}
                        </div>
                        <div className="text-right">
                          <p className={`font-semibold ${tx.type === 'sale' ? 'text-red-600' : 'text-green-600'}`}>
                            {tx.type === 'sale' ? '-' : '+'} {formatCurrency(tx.amount)}
                          </p>
                          <p className="text-xs text-gray-500">Balance: {formatCurrency(tx.balanceAfter)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedCustomer && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-xl font-bold">Record Payment</h2>
              <button onClick={() => setShowPaymentModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold">{selectedCustomer.fullName}</p>
                <p className="text-sm text-gray-500 mt-2">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedCustomer.outstandingBalance)}</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount to Pay (KES)</label>
                <input
                  type="number"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Enter amount"
                  min="0"
                  max={selectedCustomer.outstandingBalance}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Payment Method</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('CASH')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg transition ${
                      paymentMethod === 'CASH' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <Wallet className="w-4 h-4" />
                    Cash
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('MPESA')}
                    className={`flex items-center justify-center gap-2 p-2 rounded-lg transition ${
                      paymentMethod === 'MPESA' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    <CreditCard className="w-4 h-4" />
                    MPESA
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Reference (Optional)</label>
                <input
                  type="text"
                  value={paymentReference}
                  onChange={(e) => setPaymentReference(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Receipt number or transaction ID"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={recordPayment}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
                >
                  Record Payment
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;