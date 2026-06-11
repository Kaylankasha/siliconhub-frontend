import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Trash2, Printer, CreditCard, Wallet, Tag, User, X, 
  Users, RefreshCw, Plus, Minus, ShoppingBag, UserPlus, Phone, 
  History, DollarSign 
} from 'lucide-react';
import { toast } from 'sonner';

interface CartItem {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
  isService: boolean;
  sku?: string;
}

interface WalkInCustomer {
  id: string;
  name: string;
  phone: string;
  outstandingBalance: number;
  totalSpent: number;
  totalOrders: number;
}

const Sales = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [walkInCustomerId, setWalkInCustomerId] = useState<string | null>(null);
  const [customerType, setCustomerType] = useState<'online' | 'walkin' | 'none'>('none');
  const [customerSearch, setCustomerSearch] = useState('');
  const [walkInCustomers, setWalkInCustomers] = useState<WalkInCustomer[]>([]);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [discount, setDiscount] = useState(0);
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'MPESA'>('CASH');
  const [amountPaid, setAmountPaid] = useState(0);
  const [showReceipt, setShowReceipt] = useState(false);
  const [currentSale, setCurrentSale] = useState<any>(null);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [vatRate, setVatRate] = useState<number>(16);
  const [vatLoading, setVatLoading] = useState(true);
  const [showOutstandingAlert, setShowOutstandingAlert] = useState(false);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const receiptRef = useRef<HTMLDivElement>(null);
  const cartItemsRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchVatRate();
  }, []);

  useEffect(() => {
    if (cartItemsRef.current) {
      cartItemsRef.current.scrollTop = cartItemsRef.current.scrollHeight;
    }
  }, [cart]);

  useEffect(() => {
    if (paymentSectionRef.current) {
      paymentSectionRef.current.scrollTop = paymentSectionRef.current.scrollHeight;
    }
  }, [amountPaid]);

  const fetchVatRate = async () => {
    try {
      setVatLoading(true);
      const response = await api.get('/settings/vat');
      setVatRate(response.data.vatRate);
    } catch (error) {
      console.error('Error fetching VAT rate:', error);
      setVatRate(16);
    } finally {
      setVatLoading(false);
    }
  };

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data || []),
  });

  const createSaleMutation = useMutation({
    mutationFn: (saleData: any) => api.post('/sales', saleData),
    onSuccess: (data) => {
      setCurrentSale(data.data);
      setShowReceipt(true);
      toast.success('Sale completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      resetCart();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error processing sale');
    }
  });

  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  const vat = subtotal * (vatRate / 100);
  const discountAmount = discount;
  const total = subtotal + vat - discountAmount;
  const balance = amountPaid - total;
  const remainingBalance = balance < 0 ? Math.abs(balance) : 0;
  const change = balance > 0 ? balance : 0;

  const resetCart = () => {
    setCart([]);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerId(null);
    setWalkInCustomerId(null);
    setCustomerType('none');
    setCustomerSearch('');
    setDiscount(0);
    setAmountPaid(0);
    setShowOutstandingAlert(false);
  };

  const searchWalkInCustomers = async (query: string) => {
    if (query.length < 2) {
      setWalkInCustomers([]);
      return;
    }
    
    setLoadingCustomers(true);
    try {
      const response = await api.get(`/walkin-customers/search?q=${query}`);
      setWalkInCustomers(response.data);
    } catch (error) {
      console.error('Error searching walk-in customers:', error);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const createWalkInCustomer = async () => {
    if (!newCustomerPhone) {
      toast.error('Phone number is required');
      return;
    }
    
    try {
      const response = await api.post('/walkin-customers/get-or-create', {
        phone: newCustomerPhone,
        name: newCustomerName || `Customer ${newCustomerPhone.slice(-4)}`
      });
      
      const customer = response.data;
      setWalkInCustomerId(customer.id);
      setCustomerName(customer.name);
      setCustomerPhone(customer.phone);
      setCustomerType('walkin');
      setShowCustomerModal(false);
      setShowNewCustomerForm(false);
      setNewCustomerName('');
      setNewCustomerPhone('');
      toast.success('Customer added successfully');
      
      if (customer.outstandingBalance > 0) {
        setShowOutstandingAlert(true);
        toast.warning(`Customer has outstanding balance of KES ${customer.outstandingBalance.toLocaleString()}`);
      }
    } catch (error) {
      toast.error('Error creating customer');
    }
  };

  const selectWalkInCustomer = (customer: WalkInCustomer) => {
    setWalkInCustomerId(customer.id);
    setCustomerName(customer.name);
    setCustomerPhone(customer.phone);
    setCustomerType('walkin');
    setCustomerSearch(`${customer.name} (${customer.phone})`);
    setWalkInCustomers([]);
    setShowCustomerModal(false);
    
    if (customer.outstandingBalance > 0) {
      setShowOutstandingAlert(true);
      toast.warning(`Customer has outstanding balance of KES ${customer.outstandingBalance.toLocaleString()}`);
    }
  };

  const clearCustomer = () => {
    setCustomerId(null);
    setWalkInCustomerId(null);
    setCustomerName('');
    setCustomerPhone('');
    setCustomerType('none');
    setCustomerSearch('');
    setShowOutstandingAlert(false);
  };

  const addToCart = (product: any) => {
    if (!product.isService && product.stockQuantity <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }
    
    const existingItem = cart.find(item => item.productId === product.id);
    
    if (existingItem) {
      const newQuantity = existingItem.quantity + 1;
      if (!product.isService && newQuantity > product.stockQuantity) {
        toast.error(`Only ${product.stockQuantity} units available in stock`);
        return;
      }
      setCart(cart.map(item =>
        item.productId === product.id
          ? { ...item, quantity: newQuantity, total: newQuantity * item.price }
          : item
      ));
    } else {
      setCart([...cart, {
        id: Date.now().toString(),
        productId: product.id,
        name: product.name,
        sku: product.sku,
        quantity: 1,
        price: product.sellingPrice,
        total: product.sellingPrice,
        isService: product.isService
      }]);
    }
  };

  const removeFromCart = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    const item = cart.find(i => i.id === id);
    if (!item) return;
    
    const product = products?.find((p: any) => p.id === item.productId);
    
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    
    if (!item.isService && product && quantity > product.stockQuantity) {
      toast.error(`Only ${product.stockQuantity} units available in stock`);
      return;
    }
    
    setCart(cart.map(item =>
      item.id === id
        ? { ...item, quantity, total: quantity * item.price }
        : item
    ));
  };

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName && !walkInCustomerId && !customerId) {
      toast.error('Please add customer information or select a customer');
      return;
    }

    if (amountPaid <= 0 && total > 0) {
      toast.error('Please enter amount paid');
      return;
    }

    const saleData = {
      customerName: customerName || 'Walk-in Customer',
      customerPhone: customerPhone || null,
      customerId: customerType === 'online' ? customerId : null,
      walkInCustomerId: customerType === 'walkin' ? walkInCustomerId : null,
      items: cart.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })),
      paymentMethod,
      discount: discountAmount,
      amountPaid: amountPaid,
      remainingBalance: remainingBalance > 0 ? remainingBalance : 0,
      mpesaReceipt: null,
      customerType: customerType === 'walkin' ? 'WALKIN' : 'ONLINE'
    };

    createSaleMutation.mutate(saleData);
  };

  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) {
      toast.error('Receipt content not found');
      return;
    }
    
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }
    
    const styles = `
      <style>
        body { font-family: 'Courier New', monospace; font-size: 12px; margin: 0; padding: 20px; }
        .receipt { max-width: 80mm; margin: 0 auto; }
        .text-center { text-align: center; }
        .border-bottom { border-bottom: 1px dashed #000; }
        .border-top { border-top: 1px dashed #000; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 4px 0; text-align: left; }
        .text-right { text-align: right; }
        .bold { font-weight: bold; }
        @media print { body { margin: 0; padding: 0; } }
      </style>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Receipt ${currentSale?.receiptNo || 'Sale'}</title>${styles}</head>
        <body><div class="receipt">${printContent.innerHTML}</div>
        <script>window.onload = () => { setTimeout(() => { window.print(); window.onafterprint = () => window.close(); }, 100); };<\/script>
      </html>
    `);
    printWindow.document.close();
  };

  const filteredProducts = products?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (productsLoading || vatLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-white m-2 rounded-xl shadow-lg overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex gap-3 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search products by name or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>
            <button 
              onClick={() => {
                setShowCustomerModal(true);
                setShowNewCustomerForm(false);
              }}
              className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-sm"
            >
              <Users className="w-4 h-4" />
              Add Customer
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredProducts?.map((product: any) => (
              <div key={product.id} onClick={() => addToCart(product)} className={`bg-white rounded-lg shadow-sm p-3 cursor-pointer hover:shadow-md transition border ${!product.isService && product.stockQuantity === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:border-blue-300'}`}>
                <h3 className="font-semibold text-gray-800 text-sm">{product.name}</h3>
                <p className="text-xs text-gray-500 mt-1">SKU: {product.sku}</p>
                <div className="mt-2 flex justify-between items-center">
                  <span className="text-base font-bold text-blue-600">KES {product.sellingPrice.toLocaleString()}</span>
                  {!product.isService && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${product.stockQuantity <= product.reorderLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                      {product.stockQuantity}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col bg-white m-2 rounded-xl shadow-lg" style={{ height: 'calc(100vh - 16px)' }}>
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold">Current Sale</h2>
            <button onClick={fetchVatRate} className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1">
              <RefreshCw className="w-3 h-3" /> Refresh VAT
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">VAT Rate: {vatRate}%</p>
        </div>

        <div className="p-4 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1"><User className="w-3 h-3 inline mr-1" />Customer</label>
              {customerName ? (
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{customerName}</p>
                    {customerPhone && <p className="text-xs text-gray-500">{customerPhone}</p>}
                    {customerType === 'walkin' && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Walk-in</span>}
                  </div>
                  <button onClick={clearCustomer} className="text-red-500 hover:text-red-700 text-xs">Change</button>
                </div>
              ) : (
                <button onClick={() => setShowCustomerModal(true)} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1">
                  <UserPlus className="w-3 h-3" /> Add Customer
                </button>
              )}
            </div>
          </div>
          {showOutstandingAlert && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              <DollarSign className="w-3 h-3 inline mr-1" /> Customer has outstanding balance. Partial payment will be applied to balance.
            </div>
          )}
        </div>

        <div ref={cartItemsRef} className="overflow-y-auto p-4 flex-shrink-0" style={{ maxHeight: '280px', minHeight: '120px' }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
              <ShoppingBag className="w-8 h-8 mb-2" /><p className="text-sm">No items in cart</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                  <div className="flex-1"><p className="font-medium text-sm">{item.name}</p><p className="text-xs text-gray-500">KES {item.price.toLocaleString()}</p></div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="p-1 text-gray-500 hover:text-blue-600"><Minus className="w-3 h-3" /></button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="p-1 text-gray-500 hover:text-blue-600"><Plus className="w-3 h-3" /></button>
                    <button onClick={() => removeFromCart(item.id)} className="p-1 text-red-500 hover:text-red-700"><Trash2 className="w-3 h-3" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={paymentSectionRef} className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ maxHeight: 'calc(100vh - 380px)' }}>
          <div className="space-y-3">
            <div className="space-y-1.5 bg-white p-3 rounded-lg">
              <div className="flex justify-between text-sm"><span className="text-gray-600">Subtotal:</span><span>KES {subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-sm"><span className="text-gray-600">VAT ({vatRate}%):</span><span>KES {vat.toLocaleString()}</span></div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount:</span>
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-gray-400" />
                  <input type="number" value={discount} onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className="w-20 px-2 py-0.5 border rounded text-right text-sm" placeholder="0" min="0" />
                </div>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t"><span>Total:</span><span className="text-blue-600">KES {total.toLocaleString()}</span></div>
            </div>

            <div className="bg-white p-3 rounded-lg">
              <label className="block text-xs font-medium mb-1">Amount Paid (KES)</label>
              <input type="number" value={amountPaid} onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} className="w-full px-3 py-1.5 border rounded-lg text-sm" placeholder="Enter amount paid" min="0" />
              {amountPaid > 0 && (
                <div className={`mt-2 p-2 rounded-lg text-sm ${balance >= 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  {balance >= 0 ? (
                    <div className="flex justify-between"><span>Change:</span><span className="font-bold text-green-600">KES {change.toLocaleString()}</span></div>
                  ) : (
                    <>
                      <div className="flex justify-between"><span>Remaining Balance:</span><span className="font-bold text-yellow-700">KES {remainingBalance.toLocaleString()}</span></div>
                      <p className="text-xs text-yellow-600 mt-1">{customerName ? 'Customer' : 'They'} will need to pay this amount on next visit</p>
                    </>
                  )}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button onClick={() => setPaymentMethod('CASH')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm ${paymentMethod === 'CASH' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <Wallet className="w-4 h-4" /> Cash
              </button>
              <button onClick={() => setPaymentMethod('MPESA')} className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm ${paymentMethod === 'MPESA' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <CreditCard className="w-4 h-4" /> MPESA
              </button>
            </div>

            <button onClick={handleCheckout} disabled={cart.length === 0 || createSaleMutation.isPending || (total > 0 && amountPaid <= 0)} className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm">
              {createSaleMutation.isPending ? 'Processing...' : 'Complete Sale'}
            </button>
          </div>
        </div>
      </div>

      {/* Customer Modal */}
      {showCustomerModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold">Customer Information</h2>
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-500 hover:text-gray-700"><X className="w-6 h-6" /></button>
            </div>
            <div className="p-4">
              {!showNewCustomerForm ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Search by Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input type="tel" value={customerSearch} onChange={(e) => { setCustomerSearch(e.target.value); searchWalkInCustomers(e.target.value); }} placeholder="Enter phone number" className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" />
                      </div>
                    </div>
                  </div>
                  {walkInCustomers.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Existing Customers</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {walkInCustomers.map((customer) => (
                          <div key={customer.id} onClick={() => selectWalkInCustomer(customer)} className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition">
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                            {customer.outstandingBalance > 0 && <div className="text-xs text-red-600 mt-1">Outstanding: KES {customer.outstandingBalance.toLocaleString()}</div>}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button onClick={() => setShowNewCustomerForm(true)} className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2">
                    <UserPlus className="w-4 h-4" /> New Customer
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">New Walk-in Customer</h3>
                  <div><label className="block text-sm font-medium mb-1">Name (Optional)</label><input type="text" value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Customer name" className="w-full px-3 py-2 border rounded-lg text-sm" /></div>
                  <div><label className="block text-sm font-medium mb-1">Phone Number *</label><input type="tel" value={newCustomerPhone} onChange={(e) => setNewCustomerPhone(e.target.value)} placeholder="0712345678" className="w-full px-3 py-2 border rounded-lg text-sm" required /></div>
                  <div className="flex gap-2">
                    <button onClick={createWalkInCustomer} className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700">Create & Continue</button>
                    <button onClick={() => setShowNewCustomerForm(false)} className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300">Back</button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Receipt Modal */}
      {showReceipt && currentSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Hidden Receipt Content for Printing */}
            <div style={{ display: 'none' }}>
              <div ref={receiptRef}>
                <div className="text-center pb-2 mb-2" style={{ borderBottom: '1px dashed #000' }}>
                  <h2 style={{ fontSize: '16px', margin: 0 }}>Silicon Hub Technologies</h2>
                  <p style={{ margin: 2 }}>Nairobi, Kenya</p>
                  <p style={{ margin: 2 }}>Tel: 0721372710</p>
                  <p style={{ margin: 2 }}>Cash Sale No: {currentSale.receiptNo}</p>
                  <p style={{ margin: 2 }}>Date: {new Date(currentSale.createdAt).toLocaleString()}</p>
                </div>
                <div className="mb-2">
                  <p><strong>Customer:</strong> {currentSale.customerName}</p>
                  {currentSale.customerPhone && <p><strong>Phone:</strong> {currentSale.customerPhone}</p>}
                  <p><strong>Cashier:</strong> {currentSale.user.fullName}</p>
                </div>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderTop: '1px dashed #000', borderBottom: '1px dashed #000' }}>
                      <th style={{ textAlign: 'left', padding: '4px 0' }}>#</th>
                      <th style={{ textAlign: 'left' }}>Item</th>
                      <th style={{ textAlign: 'right' }}>Qty</th>
                      <th style={{ textAlign: 'right' }}>Price</th>
                      <th style={{ textAlign: 'right' }}>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentSale.items.map((item: any, index: number) => (
                      <tr key={item.id} style={{ borderBottom: '1px dashed #ccc' }}>
                        <td style={{ padding: '4px 0' }}>{index + 1}</td>
                        <td style={{ padding: '4px 0' }}>{item.product.name}</td>
                        <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.quantity}</td>
                        <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.unitPrice.toFixed(2)}</td>
                        <td style={{ textAlign: 'right', padding: '4px 0' }}>{item.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-2 pt-2" style={{ borderTop: '1px dashed #000' }}>
                  <div className="flex justify-between"><span>Subtotal:</span><span>KES {currentSale.subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span>VAT ({vatRate}%):</span><span>KES {currentSale.vat.toFixed(2)}</span></div>
                  {currentSale.discount > 0 && <div className="flex justify-between" style={{ color: 'red' }}><span>Discount:</span><span>-KES {currentSale.discount.toFixed(2)}</span></div>}
                  <div className="flex justify-between font-bold mt-2 pt-2" style={{ borderTop: '1px dashed #000' }}><span>TOTAL:</span><span>KES {currentSale.total.toFixed(2)}</span></div>
                  {currentSale.amountPaid > 0 && (
                    <>
                      <div className="flex justify-between mt-1"><span>Amount Paid:</span><span>KES {currentSale.amountPaid.toFixed(2)}</span></div>
                      {currentSale.remainingBalance > 0 ? (
                        <div className="flex justify-between" style={{ color: '#b45309' }}><span>Remaining Balance:</span><span>KES {currentSale.remainingBalance.toFixed(2)}</span></div>
                      ) : (
                        <div className="flex justify-between" style={{ color: 'green' }}><span>Change:</span><span>KES {(currentSale.amountPaid - currentSale.total).toFixed(2)}</span></div>
                      )}
                    </>
                  )}
                </div>
                {currentSale.remainingBalance > 0 && (
                  <div className="mt-2 p-2 text-center" style={{ backgroundColor: '#fef3c7', color: '#b45309', borderRadius: '4px' }}>
                    Balance of KES {currentSale.remainingBalance.toFixed(2)} to be paid on next visit
                  </div>
                )}
                <div className="text-center mt-4 pt-2" style={{ borderTop: '1px dashed #000' }}>
                  <p>Payment Method: {currentSale.paymentMethod}</p>
                  <p className="font-bold mt-2">Thank You for shopping with us!</p>
                </div>
              </div>
            </div>

            {/* Visible Receipt Preview */}
            <div className="p-6 border-b" style={{ fontFamily: 'monospace', fontSize: '12px' }}>
              <div className="text-center border-b pb-4">
                <h2 className="text-xl font-bold" style={{ fontSize: '16px' }}>Silicon Hub Technologies</h2>
                <p className="text-sm">Nairobi, Kenya</p>
                <p className="text-sm">Tel: 0721372710</p>
                <p className="text-xs text-gray-500 mt-2">Cash Sale No: {currentSale.receiptNo}</p>
                <p className="text-xs">Date: {new Date(currentSale.createdAt).toLocaleString()}</p>
              </div>
              <div className="mt-4">
                <p><strong>Customer:</strong> {currentSale.customerName}</p>
                {currentSale.customerPhone && <p><strong>Phone:</strong> {currentSale.customerPhone}</p>}
                <p><strong>Cashier:</strong> {currentSale.user.fullName}</p>
              </div>
              <table className="w-full mt-4" style={{ width: '100%' }}>
                <thead className="border-t border-b">
                  <tr>
                    <th className="text-left py-1">#</th>
                    <th className="text-left">Item</th>
                    <th className="text-right">Qty</th>
                    <th className="text-right">Price</th>
                    <th className="text-right">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSale.items.map((item: any, index: number) => (
                    <tr key={item.id} className="border-b">
                      <td className="py-1">{index + 1}</td>
                      <td className="py-1">{item.product.name}</td>
                      <td className="text-right py-1">{item.quantity}</td>
                      <td className="text-right py-1">{item.unitPrice.toFixed(2)}</td>
                      <td className="text-right py-1">{item.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 pt-2 border-t">
                <div className="flex justify-between"><span>Subtotal:</span><span>KES {currentSale.subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>VAT ({vatRate}%):</span><span>KES {currentSale.vat.toFixed(2)}</span></div>
                {currentSale.discount > 0 && <div className="flex justify-between text-red-600"><span>Discount:</span><span>-KES {currentSale.discount.toFixed(2)}</span></div>}
                <div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"><span>TOTAL:</span><span>KES {currentSale.total.toFixed(2)}</span></div>
                {currentSale.amountPaid > 0 && (
                  <>
                    <div className="flex justify-between mt-1"><span>Amount Paid:</span><span>KES {currentSale.amountPaid.toFixed(2)}</span></div>
                    {currentSale.remainingBalance > 0 ? (
                      <div className="flex justify-between text-yellow-600"><span>Remaining Balance:</span><span>KES {currentSale.remainingBalance.toFixed(2)}</span></div>
                    ) : (
                      <div className="flex justify-between text-green-600"><span>Change:</span><span>KES {(currentSale.amountPaid - currentSale.total).toFixed(2)}</span></div>
                    )}
                  </>
                )}
              </div>
              {currentSale.remainingBalance > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 text-center text-sm text-yellow-700 rounded">
                  Balance of KES {currentSale.remainingBalance.toFixed(2)} to be paid on next visit
                </div>
              )}
              <div className="text-center mt-6 pt-4 border-t">
                <p className="text-sm">Payment Method: {currentSale.paymentMethod}</p>
                <p className="text-sm mt-2 font-semibold">Thank You for shopping with us!</p>
                <p className="text-xs text-gray-500 mt-1">Silicon Hub Technologies</p>
              </div>
            </div>
            <div className="p-6 border-t flex gap-3">
              <button onClick={handlePrint} className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><Printer className="w-5 h-5" /> Print Receipt</button>
              <button onClick={() => { setShowReceipt(false); resetCart(); }} className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;