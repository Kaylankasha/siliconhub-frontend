import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { 
  Search, Phone, DollarSign, Calendar, Eye, X, 
  TrendingUp, Users, ShoppingBag, CreditCard, 
  Wallet, Download, FileText, Printer, Filter,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';

interface WalkInCustomer {
  id: string;
  name: string;
  phone: string;
  totalSpent: number;
  totalOrders: number;
  outstandingBalance: number;
  lastPurchaseAt: string;
  summary: {
    totalSales: number;
    totalAmount: number;
    totalPaid: number;
    totalOutstanding: number;
    averageOrderValue: number;
  };
  sales: any[];
  transactions: any[];
}

const WalkInSales = () => {
  const [customers, setCustomers] = useState<WalkInCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [salesSummary, setSalesSummary] = useState({
    totalSales: 0,
    totalAmount: 0,
    totalPaid: 0,
    totalOutstanding: 0
  });
  const [viewMode, setViewMode] = useState<'customers' | 'allSales'>('customers');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchCustomers();
  }, [searchTerm]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const url = searchTerm 
        ? `/walkin-customers/all-with-sales?search=${searchTerm}`
        : '/walkin-customers/all-with-sales';
      const response = await api.get(url);
      setCustomers(response.data);
      
      // Calculate overall summary
      const summary = response.data.reduce((acc: any, customer: any) => ({
        totalSales: acc.totalSales + customer.summary.totalSales,
        totalAmount: acc.totalAmount + customer.summary.totalAmount,
        totalPaid: acc.totalPaid + customer.summary.totalPaid,
        totalOutstanding: acc.totalOutstanding + customer.summary.totalOutstanding
      }), { totalSales: 0, totalAmount: 0, totalPaid: 0, totalOutstanding: 0 });
      
      setSalesSummary(summary);
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
    toast.success('Data refreshed');
  };

  const fetchSalesByDate = async () => {
    if (!dateRange.start || !dateRange.end) {
      toast.error('Please select both start and end dates');
      return;
    }
    
    try {
      setLoading(true);
      const response = await api.get(`/walkin-customers/sales-by-date?startDate=${dateRange.start}&endDate=${dateRange.end}`);
      setCustomers([]);
      setSalesSummary(response.data.summary);
      toast.success(`Found ${response.data.sales.length} sales in this period`);
    } catch (error) {
      toast.error('Error fetching sales');
    } finally {
      setLoading(false);
    }
  };

  const viewCustomerDetails = async (id: string) => {
    try {
      const response = await api.get(`/walkin-customers/${id}/sales-details`);
      setSelectedCustomer(response.data);
      setShowCustomerModal(true);
    } catch (error) {
      toast.error('Error fetching customer details');
    }
  };

  const recordPayment = async () => {
    if (paymentAmount <= 0) {
      toast.error('Please enter valid amount');
      return;
    }
    
    if (paymentAmount > selectedCustomer.customer.outstandingBalance) {
      toast.error(`Amount exceeds outstanding balance of KES ${selectedCustomer.customer.outstandingBalance.toLocaleString()}`);
      return;
    }
    
    try {
      await api.post(`/walkin-customers/${selectedCustomer.customer.id}/payment`, {
        amount: paymentAmount,
        paymentMethod,
        reference: paymentReference
      });
      
      toast.success(`Payment of KES ${paymentAmount.toLocaleString()} recorded successfully`);
      setShowPaymentModal(false);
      setPaymentAmount(0);
      setPaymentReference('');
      fetchCustomers(); // Refresh the list
      
      // Refresh the customer details if modal is open
      if (selectedCustomer) {
        const updated = await api.get(`/walkin-customers/${selectedCustomer.customer.id}/sales-details`);
        setSelectedCustomer(updated.data);
      }
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

  const exportToCSV = () => {
    const headers = ['Customer Name', 'Phone', 'Total Orders', 'Total Spent', 'Outstanding Balance', 'Last Purchase'];
    const rows = customers.map(c => [
      c.name,
      c.phone,
      c.totalOrders,
      c.totalSpent,
      c.outstandingBalance,
      formatDate(c.lastPurchaseAt)
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `walkin-customers-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Exported to CSV');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Walk-in Customer Sales</h1>
          <p className="text-gray-500 mt-1">Track and manage all walk-in customer transactions</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Customers</p>
              <p className="text-2xl font-bold">{customers.length}</p>
            </div>
            <Users className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Sales</p>
              <p className="text-2xl font-bold">{salesSummary.totalSales}</p>
            </div>
            <ShoppingBag className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Revenue</p>
              <p className="text-2xl font-bold">{formatCurrency(salesSummary.totalAmount)}</p>
            </div>
            <DollarSign className="w-8 h-8 text-purple-500" />
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-4 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Outstanding Balance</p>
              <p className="text-2xl font-bold text-red-600">{formatCurrency(salesSummary.totalOutstanding)}</p>
            </div>
            <CreditCard className="w-8 h-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search by name or phone number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
              className="px-3 py-2 border rounded-lg"
            />
            <button
              onClick={fetchSalesByDate}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Filter className="w-4 h-4" />
              Filter
            </button>
          </div>
        </div>
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Orders</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Spent</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Outstanding</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Avg Order</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Last Purchase</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {customers.map((customer) => (
                <tr key={customer.id} className="hover:bg-gray-50 transition">
                  <td className="px-6 py-4">
                    <div className="font-medium text-gray-900">{customer.name}</div>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{customer.phone}</td>
                  <td className="px-6 py-4 text-center">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-right font-semibold text-green-600">
                    {formatCurrency(customer.totalSpent)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`font-semibold ${customer.outstandingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                      {formatCurrency(customer.outstandingBalance)}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    {formatCurrency(customer.summary?.averageOrderValue || 0)}
                  </td>
                  <td className="px-6 py-4 text-center text-gray-500">
                    {formatDate(customer.lastPurchaseAt)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => viewCustomerDetails(customer.id)}
                      className="text-blue-600 hover:text-blue-800 transition"
                    >
                      <Eye className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {customers.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>No walk-in customers found</p>
            <p className="text-sm mt-1">Make a sale with a walk-in customer to see them here</p>
          </div>
        )}
      </div>

      {/* Customer Details Modal */}
      {selectedCustomer && showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h2 className="text-xl font-bold">{selectedCustomer.customer.name}</h2>
                <p className="text-sm text-gray-500">{selectedCustomer.customer.phone}</p>
              </div>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="text-2xl font-bold">{selectedCustomer.stats.totalSales}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="text-2xl font-bold text-green-600">{formatCurrency(selectedCustomer.stats.totalAmount)}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Outstanding Balance</p>
                  <p className={`text-2xl font-bold ${selectedCustomer.stats.totalOutstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(selectedCustomer.stats.totalOutstanding)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg text-center">
                  <p className="text-sm text-gray-500">Avg Order Value</p>
                  <p className="text-2xl font-bold">{formatCurrency(selectedCustomer.stats.averageOrderValue)}</p>
                </div>
              </div>

              {selectedCustomer.stats.totalOutstanding > 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg flex justify-between items-center">
                  <div>
                    <p className="font-semibold">Outstanding Balance: {formatCurrency(selectedCustomer.stats.totalOutstanding)}</p>
                    <p className="text-sm text-gray-600">Record payment to clear this balance</p>
                  </div>
                  <button
                    onClick={() => setShowPaymentModal(true)}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
                  >
                    Record Payment
                  </button>
                </div>
              )}

              {/* Sales Table */}
              <div>
                <h3 className="font-semibold text-lg mb-3">Purchase History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Receipt No</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Date</th>
                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Cashier</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Total</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Paid</th>
                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500">Balance</th>
                        <th className="px-4 py-2 text-center text-xs font-medium text-gray-500">Items</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {selectedCustomer.sales.map((sale: any) => (
                        <tr key={sale.id} className="hover:bg-gray-50">
                          <td className="px-4 py-2 text-sm font-mono">{sale.receiptNo}</td>
                          <td className="px-4 py-2 text-sm">{new Date(sale.createdAt).toLocaleDateString()}</td>
                          <td className="px-4 py-2 text-sm">{sale.user?.fullName || sale.user?.username}</td>
                          <td className="px-4 py-2 text-sm text-right font-medium">{formatCurrency(sale.total)}</td>
                          <td className="px-4 py-2 text-sm text-right">{formatCurrency(sale.amountPaid)}</td>
                          <td className={`px-4 py-2 text-sm text-right font-semibold ${sale.remainingBalance > 0 ? 'text-red-600' : 'text-green-600'}`}>
                            {formatCurrency(sale.remainingBalance)}
                          </td>
                          <td className="px-4 py-2 text-sm text-center">
                            <span className="text-xs text-gray-500">{sale.items.length} items</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Transaction History */}
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
                <p className="font-semibold">{selectedCustomer.customer.name}</p>
                <p className="text-sm text-gray-500 mt-2">Outstanding Balance</p>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(selectedCustomer.customer.outstandingBalance)}</p>
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
                  max={selectedCustomer.customer.outstandingBalance}
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

export default WalkInSales;