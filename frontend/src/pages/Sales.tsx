import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  Search, Trash2, Printer, CreditCard, Wallet, Tag, User, X, 
  Users, RefreshCw, Plus, Minus, ShoppingBag, UserPlus, Phone, 
  DollarSign, Copy, PlusCircle, Grid, List, Package, AlertCircle,
  Settings
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
  category?: string;
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
  const [vatRate, setVatRate] = useState<number>(16); // Default fallback
  const [vatLoading, setVatLoading] = useState(true);
  const [showOutstandingAlert, setShowOutstandingAlert] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const receiptRef = useRef<HTMLDivElement>(null);
  const cartItemsRef = useRef<HTMLDivElement>(null);
  const paymentSectionRef = useRef<HTMLDivElement>(null);

  // ==================== FETCH VAT RATE ====================
  const fetchVatRate = async () => {
    try {
      setVatLoading(true);
      console.log('🔄 Fetching VAT rate...');
      const response = await api.get('/settings/vat');
      console.log('📊 VAT API Response:', response.data);
      
      // Try different possible response formats
      let rate = 16; // Default fallback
      
      if (response.data) {
        if (typeof response.data === 'number') {
          rate = response.data;
        } else if (typeof response.data === 'string') {
          rate = parseFloat(response.data);
        } else if (response.data.vatRate !== undefined) {
          rate = parseFloat(response.data.vatRate);
        } else if (response.data.value !== undefined) {
          rate = parseFloat(response.data.value);
        } else if (response.data.rate !== undefined) {
          rate = parseFloat(response.data.rate);
        }
      }
      
      // Validate the rate is a valid number
      if (isNaN(rate) || rate < 0 || rate > 100) {
        console.warn('⚠️ Invalid VAT rate received, using default 16%');
        rate = 16;
      }
      
      setVatRate(rate);
      console.log('✅ VAT Rate set to:', rate);
    } catch (error: any) {
      console.error('❌ Error fetching VAT rate:', error);
      // Keep default 16% on error
      setVatRate(16);
      toast.warning('Using default VAT rate of 16%');
    } finally {
      setVatLoading(false);
    }
  };

  // Fetch VAT on mount
  useEffect(() => {
    fetchVatRate();
  }, []);

  // Auto-scroll cart
  useEffect(() => {
    if (cartItemsRef.current) {
      cartItemsRef.current.scrollTop = cartItemsRef.current.scrollHeight;
    }
  }, [cart]);

  // Auto-scroll payment section
  useEffect(() => {
    if (paymentSectionRef.current) {
      paymentSectionRef.current.scrollTop = paymentSectionRef.current.scrollHeight;
    }
  }, [amountPaid]);

  // ==================== FETCH PRODUCTS ====================
  const { 
    data: products = [], 
    isLoading: productsLoading,
    refetch: refetchProducts 
  } = useQuery({
    queryKey: ['products'],
    queryFn: () => api.get('/products').then(res => res.data || []),
  });

  // ==================== CALCULATE TOTALS ====================
  const subtotal = cart.reduce((sum, item) => sum + item.total, 0);
  // Safely calculate VAT - ensure vatRate is a valid number
  const validVatRate = isNaN(vatRate) ? 16 : vatRate;
  const vat = subtotal * (validVatRate / 100);
  const discountAmount = discount;
  const total = subtotal + vat - discountAmount;
  const balance = amountPaid - total;
  const remainingBalance = balance < 0 ? Math.abs(balance) : 0;
  const change = balance > 0 ? balance : 0;

  // ==================== CATEGORIES ====================
  const getCategories = () => {
    const cats = products?.map((p: any) => p.category?.name || 'Uncategorized') || [];
    return ['all', ...new Set(cats)];
  };
  const categories = getCategories();

  // ==================== FILTER PRODUCTS ====================
  const filteredProducts = products?.filter((p: any) => {
    const categoryMatch = selectedCategory === 'all' || p.category?.name === selectedCategory;
    const searchMatch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        p.sku.toLowerCase().includes(searchTerm.toLowerCase());
    return categoryMatch && searchMatch;
  });

  // ==================== RESET CART ====================
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

  // ==================== CUSTOMER FUNCTIONS ====================
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

  // ==================== CART FUNCTIONS ====================
  const addToCart = (product: any) => {
    if (!product.isService && product.stockQuantity <= 0) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }
    
    setCart([...cart, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: 1,
      price: product.sellingPrice,
      total: product.sellingPrice,
      isService: product.isService,
      category: product.category?.name || 'Uncategorized'
    }]);
    
    toast.success(`Added ${product.name} to cart`);
  };

  const addWithQuantity = (product: any, qty: number = 1) => {
    if (!product.isService && product.stockQuantity < qty) {
      toast.error(`Insufficient stock for ${product.name}. Available: ${product.stockQuantity}`);
      return;
    }
    
    setCart([...cart, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      productId: product.id,
      name: product.name,
      sku: product.sku,
      quantity: qty,
      price: product.sellingPrice,
      total: product.sellingPrice * qty,
      isService: product.isService,
      category: product.category?.name || 'Uncategorized'
    }]);
    
    toast.success(`Added ${qty}x ${product.name} to cart`);
  };

  const duplicateCartItem = (id: string) => {
    const itemToDuplicate = cart.find(item => item.id === id);
    if (!itemToDuplicate) return;

    const product = products?.find((p: any) => p.id === itemToDuplicate.productId);
    if (!product) {
      toast.error('Original product not found');
      return;
    }

    if (!product.isService && product.stockQuantity < 1) {
      toast.error(`${product.name} is out of stock!`);
      return;
    }

    setCart([...cart, {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 4),
      productId: itemToDuplicate.productId,
      name: itemToDuplicate.name,
      sku: itemToDuplicate.sku,
      quantity: 1,
      price: itemToDuplicate.price,
      total: itemToDuplicate.price,
      isService: itemToDuplicate.isService,
      category: itemToDuplicate.category
    }]);
    
    toast.success(`Duplicated ${itemToDuplicate.name}`);
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

  // ==================== CREATE SALE ====================
  const createSaleMutation = useMutation({
    mutationFn: (saleData: any) => api.post('/sales', saleData),
    onSuccess: (data) => {
      setCurrentSale(data.data);
      setShowReceipt(true);
      toast.success('Sale completed successfully!');
      queryClient.invalidateQueries({ queryKey: ['analytics'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['sales'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error processing sale');
    }
  });

  // ==================== CHECKOUT ====================
  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    if (!customerName && !walkInCustomerId && !customerId) {
      toast.error('Please add customer information or select a customer');
      return;
    }

    if (amountPaid === 0) {
      toast.warning('No payment received. This will be recorded as a credit sale.');
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

  // ==================== PRINT RECEIPT ====================
  const handlePrint = () => {
    const printContent = receiptRef.current;
    if (!printContent) {
      toast.error('Receipt content not found');
      return;
    }
    
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      toast.error('Please allow popups to print receipt');
      return;
    }
    
    const styles = `
      <style>
        @page { margin: 0; }
        body { 
          font-family: 'Courier New', monospace; 
          font-size: 11px; 
          margin: 0; 
          padding: 10px; 
          background: white; 
        }
        .receipt { 
          max-width: 80mm; 
          margin: 0 auto; 
          padding: 5px;
        }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-left { text-align: left; }
        .bold { font-weight: bold; }
        .border-bottom { border-bottom: 1px dashed #000; }
        .border-top { border-top: 1px dashed #000; }
        .border-dashed { border-style: dashed; }
        .mt-1 { margin-top: 4px; }
        .mt-2 { margin-top: 8px; }
        .mt-3 { margin-top: 12px; }
        .mb-1 { margin-bottom: 4px; }
        .mb-2 { margin-bottom: 8px; }
        .pt-1 { padding-top: 4px; }
        .pt-2 { padding-top: 8px; }
        .pb-1 { padding-bottom: 4px; }
        .pb-2 { padding-bottom: 8px; }
        .flex { display: flex; }
        .justify-between { justify-content: space-between; }
        .w-40 { width: 40%; }
        .w-15 { width: 15%; }
        .w-20 { width: 20%; }
        .w-25 { width: 25%; }
        .text-yellow-600 { color: #b45309; }
        .text-green-600 { color: #16a34a; }
        .text-gray-500 { color: #6b7280; }
        .bg-yellow-50 { background-color: #fef3c7; }
        .p-1 { padding: 4px; }
        .p-2 { padding: 8px; }
        .rounded { border-radius: 4px; }
        .border-dashed { border-style: dashed; }
        .text-xs { font-size: 10px; }
        .text-sm { font-size: 11px; }
        .text-lg { font-size: 14px; }
        .font-bold { font-weight: bold; }
        .font-mono { font-family: 'Courier New', monospace; }
        .uppercase { text-transform: uppercase; }
        .tracking-wide { letter-spacing: 1px; }
        @media print { 
          body { margin: 0; padding: 0; }
          .no-print { display: none !important; }
        }
      </style>
    `;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head><title>Receipt ${currentSale?.receiptNo || 'Sale'}</title>${styles}</head>
        <body>
          <div class="receipt">${printContent.innerHTML}</div>
          <script>
            window.onload = function() {
              setTimeout(function() {
                window.print();
                window.onafterprint = function() {
                  window.close();
                };
              }, 500);
            };
          <\/script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // ==================== REFRESH ====================
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchProducts(), fetchVatRate()]);
      toast.success('Products and VAT rate refreshed');
    } catch (error) {
      toast.error('Failed to refresh');
    } finally {
      setIsRefreshing(false);
    }
  };

  // ==================== LOADING STATE ====================
  if (productsLoading || vatLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // ==================== RENDER ====================
  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {/* Left Panel - Products */}
      <div className="flex-1 flex flex-col bg-white m-2 rounded-xl shadow-lg overflow-hidden">
        {/* Search and Filter Bar */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex gap-2 items-center">
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
            <div className="flex gap-1">
              {/* Category Filter */}
              <div className="relative">
                <button
                  onClick={() => setShowCategoryFilter(!showCategoryFilter)}
                  className="px-3 py-2 border rounded-lg hover:bg-gray-50 flex items-center gap-1 text-sm"
                >
                  <Tag className="w-4 h-4" />
                  {selectedCategory === 'all' ? 'All' : selectedCategory}
                </button>
                {showCategoryFilter && (
                  <div className="absolute mt-1 right-0 bg-white border rounded-lg shadow-lg z-10 p-1 min-w-40 max-h-60 overflow-y-auto">
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowCategoryFilter(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded hover:bg-gray-100 text-sm ${
                          selectedCategory === cat ? 'bg-blue-50 text-blue-600' : ''
                        }`}
                      >
                        {cat === 'all' ? 'All Categories' : cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {/* View Mode */}
              <div className="flex border rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              {/* Refresh */}
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="p-2 border rounded-lg hover:bg-gray-50"
                title="Refresh products & VAT"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </button>
              {/* Add Customer */}
              <button 
                onClick={() => {
                  setShowCustomerModal(true);
                  setShowNewCustomerForm(false);
                }}
                className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-1 text-sm"
              >
                <UserPlus className="w-4 h-4" />
                Add Customer
              </button>
            </div>
          </div>
        </div>

        {/* Product Grid/List */}
        <div className="flex-1 overflow-y-auto p-4">
          {filteredProducts?.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <Package className="w-12 h-12 mb-2" />
              <p>No products found</p>
            </div>
          ) : (
            <div className={viewMode === 'grid' 
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3'
              : 'space-y-2'
            }>
              {filteredProducts?.map((product: any) => (
                <div 
                  key={product.id} 
                  className={`bg-white rounded-lg shadow-sm border p-3 transition ${!product.isService && product.stockQuantity === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:shadow-md hover:border-blue-300 cursor-pointer'}`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      <div className="flex justify-between items-start">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${product.isService ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                          {product.isService ? 'Service' : 'Product'}
                        </span>
                        {!product.isService && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            product.stockQuantity > 10 ? 'bg-green-100 text-green-700' :
                            product.stockQuantity > 0 ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm mt-1">{product.name}</h3>
                      <p className="text-xs text-gray-500">{product.sku}</p>
                      <p className="text-xs text-gray-500">{product.category?.name || 'Uncategorized'}</p>
                      <div className="mt-2 flex justify-between items-center">
                        <span className="text-lg font-bold text-blue-600">
                          KES {product.sellingPrice.toLocaleString()}
                        </span>
                        <div className="flex gap-1">
                          <button
                            onClick={() => addToCart(product)}
                            disabled={!product.isService && product.stockQuantity === 0}
                            className="px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs disabled:bg-gray-400"
                          >
                            Add
                          </button>
                          <button
                            onClick={() => addWithQuantity(product, 1)}
                            className="p-1 bg-green-600 text-white rounded hover:bg-green-700"
                            title="Add as new independent item"
                          >
                            <PlusCircle className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm">{product.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${product.isService ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                            {product.isService ? 'Service' : 'Product'}
                          </span>
                          {!product.isService && (
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              product.stockQuantity > 10 ? 'bg-green-100 text-green-700' :
                              product.stockQuantity > 0 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-red-100 text-red-700'
                            }`}>
                              {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-gray-500">{product.sku} • {product.category?.name || 'Uncategorized'}</div>
                      </div>
                      <div className="font-bold text-blue-600 mr-2">
                        KES {product.sellingPrice.toLocaleString()}
                      </div>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={!product.isService && product.stockQuantity === 0}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm disabled:bg-gray-400"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => addWithQuantity(product, 1)}
                        className="p-1 ml-1 bg-green-600 text-white rounded hover:bg-green-700"
                      >
                        <PlusCircle className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Panel - Cart */}
      <div className="w-96 flex flex-col bg-white m-2 rounded-xl shadow-lg" style={{ height: 'calc(100vh - 16px)' }}>
        {/* Cart Header */}
        <div className="p-4 border-b bg-gray-50 flex-shrink-0">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <ShoppingBag className="w-5 h-5" />
              Cart ({cart.length})
            </h2>
            <button 
              onClick={fetchVatRate} 
              className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded hover:bg-blue-100 flex items-center gap-1"
              title="Refresh VAT rate"
            >
              <Settings className="w-3 h-3" /> VAT {validVatRate}%
            </button>
          </div>
        </div>

        {/* Customer Info */}
        <div className="p-3 border-b flex-shrink-0">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-600">Customer</label>
              {customerName ? (
                <div className="flex items-center justify-between mt-1">
                  <div>
                    <p className="text-sm font-medium">{customerName}</p>
                    {customerPhone && <p className="text-xs text-gray-500">{customerPhone}</p>}
                    {customerType === 'walkin' && <span className="text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded-full">Walk-in</span>}
                  </div>
                  <button onClick={clearCustomer} className="text-red-500 hover:text-red-700 text-xs">Change</button>
                </div>
              ) : (
                <button onClick={() => setShowCustomerModal(true)} className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1 mt-1">
                  <UserPlus className="w-3 h-3" /> Add Customer
                </button>
              )}
            </div>
          </div>
          {showOutstandingAlert && (
            <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-xs text-yellow-700">
              <DollarSign className="w-3 h-3 inline mr-1" /> Customer has outstanding balance.
            </div>
          )}
        </div>

        {/* Cart Items */}
        <div ref={cartItemsRef} className="overflow-y-auto p-3 flex-shrink-0" style={{ maxHeight: '280px', minHeight: '120px' }}>
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-24 text-gray-400">
              <ShoppingBag className="w-8 h-8 mb-2" />
              <p className="text-sm">No items in cart</p>
            </div>
          ) : (
            <div className="space-y-2">
              {cart.map((item, index) => {
                const occurrences = cart.filter(i => i.name === item.name).length;
                const occurrenceNumber = cart.filter((i, idx) => 
                  i.name === item.name && idx <= index
                ).length;
                
                return (
                  <div key={item.id} className="bg-gray-50 rounded-lg p-2">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <p className="font-medium text-sm truncate">{item.name}</p>
                          {occurrences > 1 && (
                            <span className="text-xs text-gray-500 bg-gray-200 px-1.5 rounded-full">
                              #{occurrenceNumber}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500">KES {item.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                          className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-200"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button 
                          onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                          className="p-1 text-gray-500 hover:text-blue-600 rounded hover:bg-gray-200"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => duplicateCartItem(item.id)} 
                          className="p-1 text-blue-500 hover:text-blue-700 rounded hover:bg-blue-50"
                          title="Duplicate as new item"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => removeFromCart(item.id)} 
                          className="p-1 text-red-500 hover:text-red-700 rounded hover:bg-red-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <div className="text-right text-sm font-semibold text-blue-600">
                      KES {item.total.toLocaleString()}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Payment Section */}
        <div ref={paymentSectionRef} className="flex-1 overflow-y-auto p-4 bg-gray-50" style={{ maxHeight: 'calc(100vh - 380px)' }}>
          <div className="space-y-3">
            {/* Totals */}
            <div className="space-y-1.5 bg-white p-3 rounded-lg">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal:</span>
                <span>KES {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">VAT ({validVatRate}%):</span>
                <span>KES {vat.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Discount:</span>
                <div className="flex items-center gap-2">
                  <Tag className="w-3 h-3 text-gray-400" />
                  <input 
                    type="number" 
                    value={discount} 
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} 
                    className="w-20 px-2 py-0.5 border rounded text-right text-sm" 
                    placeholder="0" 
                    min="0" 
                  />
                </div>
              </div>
              <div className="flex justify-between font-bold text-base pt-1 border-t">
                <span>Total:</span>
                <span className="text-blue-600">KES {total.toLocaleString()}</span>
              </div>
            </div>

            {/* Amount Paid */}
            <div className="bg-white p-3 rounded-lg">
              <label className="block text-sm font-medium mb-1">Amount Paid (KES)</label>
              <input 
                type="number" 
                value={amountPaid} 
                onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} 
                className="w-full px-3 py-2 border rounded-lg text-sm" 
                placeholder="Enter amount paid" 
                min="0" 
              />
              
              {amountPaid > 0 && (
                <div className={`mt-2 p-2 rounded-lg text-sm ${balance >= 0 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                  {balance >= 0 ? (
                    <div className="flex justify-between">
                      <span>Change:</span>
                      <span className="font-bold text-green-600">KES {change.toLocaleString()}</span>
                    </div>
                  ) : (
                    <>
                      <div className="flex justify-between">
                        <span>Remaining Balance:</span>
                        <span className="font-bold text-yellow-700">KES {remainingBalance.toLocaleString()}</span>
                      </div>
                      <p className="text-xs text-yellow-600 mt-1">
                        {customerName ? 'Customer' : 'They'} will need to pay this amount on next visit
                      </p>
                    </>
                  )}
                </div>
              )}
              
              {amountPaid === 0 && total > 0 && (
                <div className="mt-2 p-2 bg-red-50 rounded-lg text-xs text-red-600">
                  <DollarSign className="w-3 h-3 inline mr-1" /> No payment entered. This will be recorded as a credit sale.
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="flex gap-2">
              <button 
                onClick={() => setPaymentMethod('CASH')} 
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm ${
                  paymentMethod === 'CASH' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <Wallet className="w-4 h-4" /> Cash
              </button>
              <button 
                onClick={() => setPaymentMethod('MPESA')} 
                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 transition text-sm ${
                  paymentMethod === 'MPESA' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <CreditCard className="w-4 h-4" /> MPESA
              </button>
            </div>

            {/* Complete Sale Button */}
            <button 
              onClick={handleCheckout} 
              disabled={cart.length === 0 || createSaleMutation.isPending} 
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" />
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
              <button onClick={() => setShowCustomerModal(false)} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-4">
              {!showNewCustomerForm ? (
                <>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1">Search by Phone Number</label>
                    <div className="flex gap-2">
                      <div className="flex-1 relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                          type="tel" 
                          value={customerSearch} 
                          onChange={(e) => { 
                            setCustomerSearch(e.target.value); 
                            searchWalkInCustomers(e.target.value); 
                          }} 
                          placeholder="Enter phone number" 
                          className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm" 
                        />
                      </div>
                    </div>
                  </div>
                  {walkInCustomers.length > 0 && (
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-2">Existing Customers</label>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {walkInCustomers.map((customer) => (
                          <div 
                            key={customer.id} 
                            onClick={() => selectWalkInCustomer(customer)} 
                            className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                          >
                            <div className="font-medium">{customer.name}</div>
                            <div className="text-sm text-gray-500">{customer.phone}</div>
                            {customer.outstandingBalance > 0 && 
                              <div className="text-xs text-red-600 mt-1">Outstanding: KES {customer.outstandingBalance.toLocaleString()}</div>
                            }
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <button 
                    onClick={() => setShowNewCustomerForm(true)} 
                    className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2"
                  >
                    <UserPlus className="w-4 h-4" /> New Customer
                  </button>
                </>
              ) : (
                <div className="space-y-4">
                  <h3 className="font-semibold">New Walk-in Customer</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Name (Optional)</label>
                    <input 
                      type="text" 
                      value={newCustomerName} 
                      onChange={(e) => setNewCustomerName(e.target.value)} 
                      placeholder="Customer name" 
                      className="w-full px-3 py-2 border rounded-lg text-sm" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      value={newCustomerPhone} 
                      onChange={(e) => setNewCustomerPhone(e.target.value)} 
                      placeholder="0712345678" 
                      className="w-full px-3 py-2 border rounded-lg text-sm" 
                      required 
                    />
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={createWalkInCustomer} 
                      className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
                    >
                      Create & Continue
                    </button>
                    <button 
                      onClick={() => setShowNewCustomerForm(false)} 
                      className="flex-1 bg-gray-200 py-2 rounded-lg hover:bg-gray-300"
                    >
                      Back
                    </button>
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
              <div ref={receiptRef} style={{ fontFamily: 'Courier New, monospace', fontSize: '11px', padding: '10px', maxWidth: '80mm', margin: '0 auto' }}>
                {/* Header */}
                <div style={{ textAlign: 'center', borderBottom: '1px dashed #000', paddingBottom: '8px', marginBottom: '8px' }}>
                  <h2 style={{ fontSize: '16px', margin: '0', fontWeight: 'bold', letterSpacing: '1px' }}>SILICON HUB TECH</h2>
                  <p style={{ margin: '2px 0', fontSize: '10px' }}>Cyber Services • Printing • Stationery</p>
                  <p style={{ margin: '2px 0', fontSize: '10px' }}>Nairobi, Kenya</p>
                  <p style={{ margin: '2px 0', fontSize: '10px' }}>Tel: 0721 372710</p>
                  <p style={{ margin: '6px 0 2px 0', fontSize: '10px', borderTop: '1px dashed #000', paddingTop: '6px' }}>
                    Receipt #: <strong>{currentSale?.receiptNo || 'N/A'}</strong>
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '10px' }}>
                    Date: {new Date(currentSale?.createdAt || Date.now()).toLocaleString()}
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '10px' }}>
                    Cashier: {currentSale?.user?.fullName || 'N/A'}
                  </p>
                </div>

                {/* Customer Info */}
                <div style={{ marginBottom: '8px', fontSize: '10px', borderBottom: '1px dashed #000', paddingBottom: '6px' }}>
                  <p style={{ margin: '2px 0' }}>
                    <strong>Customer:</strong> {currentSale?.customerName || 'Walk-in Customer'}
                  </p>
                  {currentSale?.customerPhone && (
                    <p style={{ margin: '2px 0' }}>
                      <strong>Phone:</strong> {currentSale.customerPhone}
                    </p>
                  )}
                </div>

                {/* Items Header */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  borderBottom: '1px dashed #000', 
                  paddingBottom: '4px', 
                  marginBottom: '4px', 
                  fontSize: '10px', 
                  fontWeight: 'bold' 
                }}>
                  <span style={{ width: '40%' }}>Item</span>
                  <span style={{ width: '15%', textAlign: 'center' }}>Qty</span>
                  <span style={{ width: '20%', textAlign: 'right' }}>Price</span>
                  <span style={{ width: '25%', textAlign: 'right' }}>Amount</span>
                </div>

                {/* Items */}
                {currentSale?.items?.map((item: any, index: number) => (
                  <div key={item.id} style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    padding: '2px 0', 
                    fontSize: '10px',
                    borderBottom: index === currentSale.items.length - 1 ? 'none' : '1px dotted #ccc'
                  }}>
                    <span style={{ width: '40%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.product?.name || 'Unknown'}
                    </span>
                    <span style={{ width: '15%', textAlign: 'center' }}>{item.quantity}</span>
                    <span style={{ width: '20%', textAlign: 'right' }}>{item.unitPrice?.toFixed(2) || '0.00'}</span>
                    <span style={{ width: '25%', textAlign: 'right' }}>{item.total?.toFixed(2) || '0.00'}</span>
                  </div>
                ))}

                {/* Totals */}
                <div style={{ borderTop: '1px dashed #000', paddingTop: '6px', marginTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0' }}>
                    <span>Subtotal:</span>
                    <span>KES {currentSale?.subtotal?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0' }}>
                    <span>VAT ({validVatRate}%):</span>
                    <span>KES {currentSale?.vat?.toFixed(2) || '0.00'}</span>
                  </div>
                  {currentSale?.discount > 0 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0', color: 'red' }}>
                      <span>Discount:</span>
                      <span>-KES {currentSale?.discount?.toFixed(2) || '0.00'}</span>
                    </div>
                  )}
                  <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    fontSize: '14px', 
                    fontWeight: 'bold', 
                    padding: '4px 0', 
                    borderTop: '1px dashed #000', 
                    marginTop: '4px' 
                  }}>
                    <span>TOTAL:</span>
                    <span>KES {currentSale?.total?.toFixed(2) || '0.00'}</span>
                  </div>
                </div>

                {/* Payment Details */}
                <div style={{ borderTop: '1px dashed #000', marginTop: '8px', paddingTop: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0' }}>
                    <span>Amount Paid:</span>
                    <span>KES {currentSale?.amountPaid?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0' }}>
                    <span>Payment Method:</span>
                    <span>{currentSale?.paymentMethod || 'CASH'}</span>
                  </div>
                  {currentSale?.remainingBalance > 0 ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0', color: '#b45309', fontWeight: 'bold' }}>
                      <span>Remaining Balance:</span>
                      <span>KES {currentSale?.remainingBalance?.toFixed(2) || '0.00'}</span>
                    </div>
                  ) : currentSale?.amountPaid > currentSale?.total ? (
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', padding: '2px 0', color: 'green', fontWeight: 'bold' }}>
                      <span>Change:</span>
                      <span>KES {((currentSale?.amountPaid || 0) - (currentSale?.total || 0)).toFixed(2)}</span>
                    </div>
                  ) : null}
                </div>

                {/* Balance Warning */}
                {currentSale?.remainingBalance > 0 && (
                  <div style={{ 
                    marginTop: '10px', 
                    padding: '6px', 
                    backgroundColor: '#fef3c7', 
                    color: '#b45309', 
                    textAlign: 'center', 
                    fontSize: '10px', 
                    borderRadius: '4px', 
                    border: '1px dashed #b45309' 
                  }}>
                    ⚠️ Balance of KES {currentSale?.remainingBalance?.toFixed(2) || '0.00'} to be paid on next visit
                  </div>
                )}

                {/* Footer */}
                <div style={{ 
                  textAlign: 'center', 
                  borderTop: '1px dashed #000', 
                  marginTop: '10px', 
                  paddingTop: '10px' 
                }}>
                  <p style={{ margin: '2px 0', fontSize: '12px', fontWeight: 'bold' }}>Thank You for shopping with us!</p>
                  <p style={{ margin: '2px 0', fontSize: '9px', color: '#6b7280' }}>Items sold are not returnable</p>
                  <p style={{ margin: '2px 0', fontSize: '9px', color: '#6b7280' }}>Visit us again!</p>
                  <p style={{ margin: '4px 0 0 0', fontSize: '9px', color: '#6b7280', borderTop: '1px dashed #000', paddingTop: '4px' }}>
                    Silicon Hub Technologies
                  </p>
                  <p style={{ margin: '2px 0', fontSize: '9px', color: '#6b7280' }}>www.siliconhub.com</p>
                </div>
              </div>
            </div>

            {/* Visible Receipt Preview */}
            <div className="p-6 border-b font-mono text-xs max-h-96 overflow-y-auto" style={{ fontFamily: 'Courier New, monospace' }}>
              <div className="text-center border-b pb-4">
                <h2 className="text-lg font-bold tracking-wide" style={{ fontSize: '16px', letterSpacing: '1px' }}>SILICON HUB TECH</h2>
                <p className="text-xs">Cyber Services • Printing • Stationery</p>
                <p className="text-xs">Nairobi, Kenya</p>
                <p className="text-xs">Tel: 0721 372710</p>
                <p className="text-xs text-gray-500 mt-2">Receipt #: {currentSale?.receiptNo}</p>
                <p className="text-xs">Date: {new Date(currentSale?.createdAt).toLocaleString()}</p>
                <p className="text-xs">Cashier: {currentSale?.user?.fullName || 'N/A'}</p>
              </div>
              <div className="mt-2">
                <p className="text-xs"><strong>Customer:</strong> {currentSale?.customerName}</p>
                {currentSale?.customerPhone && <p className="text-xs"><strong>Phone:</strong> {currentSale.customerPhone}</p>}
              </div>
              <table className="w-full mt-3 text-xs">
                <thead className="border-t border-b border-dashed">
                  <tr>
                    <th className="text-left py-1">Item</th>
                    <th className="text-right py-1">Qty</th>
                    <th className="text-right py-1">Price</th>
                    <th className="text-right py-1">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {currentSale?.items?.map((item: any, index: number) => (
                    <tr key={item.id} className={index === currentSale.items.length - 1 ? '' : 'border-b border-dashed'}>
                      <td className="py-1 text-xs">{item.product?.name || 'Unknown'}</td>
                      <td className="text-right py-1 text-xs">{item.quantity}</td>
                      <td className="text-right py-1 text-xs">{item.unitPrice?.toFixed(2) || '0.00'}</td>
                      <td className="text-right py-1 text-xs">{item.total?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-3 pt-2 border-t border-dashed">
                <div className="flex justify-between text-xs"><span>Subtotal:</span><span>KES {currentSale?.subtotal?.toFixed(2) || '0.00'}</span></div>
                <div className="flex justify-between text-xs"><span>VAT ({validVatRate}%):</span><span>KES {currentSale?.vat?.toFixed(2) || '0.00'}</span></div>
                {currentSale?.discount > 0 && (
                  <div className="flex justify-between text-xs text-red-600"><span>Discount:</span><span>-KES {currentSale?.discount?.toFixed(2) || '0.00'}</span></div>
                )}
                <div className="flex justify-between font-bold text-sm mt-1 pt-1 border-t border-dashed">
                  <span>TOTAL:</span>
                  <span>KES {currentSale?.total?.toFixed(2) || '0.00'}</span>
                </div>
              </div>
              <div className="mt-3 pt-2 border-t border-dashed">
                <div className="flex justify-between text-xs"><span>Amount Paid:</span><span>KES {currentSale?.amountPaid?.toFixed(2) || '0.00'}</span></div>
                <div className="flex justify-between text-xs"><span>Payment Method:</span><span>{currentSale?.paymentMethod || 'CASH'}</span></div>
                {currentSale?.remainingBalance > 0 ? (
                  <div className="flex justify-between text-xs text-yellow-600 font-bold">
                    <span>Remaining Balance:</span>
                    <span>KES {currentSale?.remainingBalance?.toFixed(2) || '0.00'}</span>
                  </div>
                ) : currentSale?.amountPaid > currentSale?.total ? (
                  <div className="flex justify-between text-xs text-green-600 font-bold">
                    <span>Change:</span>
                    <span>KES {((currentSale?.amountPaid || 0) - (currentSale?.total || 0)).toFixed(2)}</span>
                  </div>
                ) : null}
              </div>
              {currentSale?.remainingBalance > 0 && (
                <div className="mt-3 p-2 bg-yellow-50 text-center text-xs text-yellow-700 rounded border border-dashed">
                  ⚠️ Balance of KES {currentSale?.remainingBalance?.toFixed(2) || '0.00'} to be paid on next visit
                </div>
              )}
              <div className="text-center mt-4 pt-3 border-t border-dashed">
                <p className="text-sm font-bold">Thank You for shopping with us!</p>
                <p className="text-xs text-gray-500">Items sold are not returnable</p>
                <p className="text-xs text-gray-500">Visit us again!</p>
              </div>
            </div>

            {/* Buttons */}
            <div className="p-6 border-t flex gap-3">
              <button
                onClick={handlePrint}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 transition"
              >
                <Printer className="w-5 h-5" /> Print Receipt
              </button>
              <button
                onClick={() => {
                  setShowReceipt(false);
                  resetCart();
                }}
                className="flex-1 bg-gray-200 text-gray-800 py-2 rounded-lg hover:bg-gray-300 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
