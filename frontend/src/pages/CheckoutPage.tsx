import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ShoppingCart, CreditCard, Bank, Users, Package, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import { Product, Invoice, PaymentMethod } from '../types';

interface CartItem {
  productId: number;
  product: Product;
  quantity: number;
  unitPrice: number;
  discount: number;
}

export default function CheckoutPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  // Search products
  const { data: searchResult, isLoading: searching } = useQuery({
    queryKey: ['products', searchTerm],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: { search: searchTerm },
      });
      return response.data;
    },
    enabled: searchTerm.length >= 2,
  });

  // Customers
  const { data: customers } = useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      // This would need a customers endpoint
      return [];
    },
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: async (invoice: any) => {
      const response = await api.post('/invoices', invoice);
      return response.data;
    },
    onSuccess: () => {
      setCart([]);
      setCustomerId(null);
      setSearchTerm('');
      queryClient.invalidateQueries(['invoices']);
    },
  });

  // Add to cart
  const addToCart = (productId: number) => {
    const product = searchResult?.products?.find((p: Product) => p.id === productId);
    if (!product) return;

    const existingItem = cart.find((i) => i.productId === productId);

    if (existingItem) {
      updateQuantity(productId, existingItem.quantity + 1);
    } else {
      setCart([...cart, {
        productId,
        product,
        quantity: 1,
        unitPrice: parseFloat(product.sellingPrice),
        discount: 0,
      }]);
    }

    setSearchTerm('');
  };

  // Update quantity
  const updateQuantity = (productId: number, quantity: number) => {
    if (quantity <= 0) {
      setCart(cart.filter((i) => i.productId !== productId));
      return;
    }

    setCart(
      cart.map((i) =>
        i.productId === productId ? { ...i, quantity } : i
      )
    );
  };

  // Calculate totals
  const subtotal = cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  const discountTotal = cart.reduce((sum, item) => {
    const itemDiscount = (item.unitPrice * item.quantity) * (item.discount / 100);
    return sum + itemDiscount;
  }, 0);
  const totalTax = cart.reduce((sum, item) => {
    const taxableAmount = (item.unitPrice * item.quantity) - ((item.unitPrice * item.quantity) * (item.discount / 100));
    return sum + taxableAmount * (parseFloat(item.product.taxRate || '0') / 100);
  }, 0);
  const total = subtotal - discountTotal + totalTax;

  // Handle barcode scan (scanner acts as keyboard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // F2 - search
      if (e.key === 'F2') {
        e.preventDefault();
        barcodeInputRef.current?.focus();
      }
      // Enter - add to cart or complete
      if (e.key === 'Enter' && barcodeInputRef.current?.document.activeElement === barcodeInputRef.current) {
        const term = barcodeInputRef.current?.value || '';
        if (term.length >= 3) {
          setSearchTerm(term);
          barcodeInputRef.current!.value = '';
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleBarcodeScan = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const term = e.currentTarget.value.trim();
      if (term.length >= 3) {
        setSearchTerm(term);
      }
      e.currentTarget.value = '';
    }
  };

  const handlePay = () => {
    const payAmount = parseFloat(paymentAmount) || total;
    const change = payAmount - total;

    const invoiceData = {
      customerId: customerId,
      items: cart.map((i) => ({
        productId: i.productId,
        quantity: i.quantity.toString(),
        discount: i.discount.toString(),
      })),
      paymentMethod,
      paymentAmount: payAmount >= 0 ? payAmount.toString() : total.toString(),
    };

    createInvoiceMutation.mutate(invoiceData);
    setShowPaymentModal(false);
  };

  const handleDeleteItem = (productId: number) => {
    setCart(cart.filter((i) => i.productId !== productId));
  };

  if (cart.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-gray-900">New Sale</h1>
          <button
            onClick={() => (window.history.back())}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <input
            ref={barcodeInputRef}
            type="text"
            placeholder="Scan barcode or search product..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleBarcodeScan}
            className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            autoFocus
          />
          <p className="text-xs text-gray-500 mt-2">Press F2 to focus, scanner acts as keyboard input</p>
        </div>

        {searchTerm && searching && <div className="text-center py-4">Searching...</div>}

        {searchResult?.products && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
            {searchResult.products.map((product: Product) => (
              <div
                key={product.id}
                onClick={() => addToCart(product.id)}
                className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 cursor-pointer transition-colors"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 flex-shrink-0 flex items-center justify-center">
                    <Package className="h-6 w-6 text-gray-500" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{product.name}</p>
                    <p className="text-sm text-gray-600">
                      {product.sku} • {product.sellingPrice} {product.unit}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        <button
          onClick={() => setCart([])}
          className="text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      </div>

      {/* Cart Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Items ({cart.length})</h2>

        <div className="space-y-2">
          {cart.map((item) => (
            <div key={item.productId} className="flex items-center justify-between py-2 border-b">
              <div className="flex items-center">
                <span className="w-20 text-sm truncate">{item.product.name}</span>
                <span className="text-xs text-gray-500 mx-2">x</span>
                <input
                  type="number"
                  min="0.1"
                  step="0.1"
                  value={item.quantity}
                  onChange={(e) => updateQuantity(item.productId, parseFloat(e.target.value) || 0)}
                  className="w-16 text-center border border-gray-300 rounded text-sm"
                />
              </div>
              <div className="text-right">
                <div className="font-medium">
                  {(item.unitPrice * item.quantity).toFixed(2)}
                </div>
                <button
                  onClick={() => handleDeleteItem(item.productId)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t pt-4 mt-4">
          <div className="flex justify-between text-lg font-semibold">
            <span>Total:</span>
            <span>Rs {total.toFixed(2)}</span>
          </div>
        </div>
      </div>

      {/* Payment Button */}
      <button
        onClick={() => setShowPaymentModal(true)}
        className="w-full bg-blue-600 text-white py-4 rounded-lg text-lg font-semibold hover:bg-blue-700 flex items-center justify-center"
      >
        <CreditCard className="h-5 w-5 mr-2" />
        Pay Rs {total.toFixed(2)}
      </button>

      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Payment</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {(Object.values(PaymentMethod) as PaymentMethod[]).map((method) => (
                  <button
                    key={method}
                    onClick={() => setPaymentMethod(method)}
                    className={`p-3 border rounded-lg flex items-center ${
                      paymentMethod === method
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    {method === 'CASH' && <Bank className="h-5 w-5 mr-2" />}
                    {method === 'CARD' && <CreditCard className="h-5 w-5 mr-2" />}
                    {method === 'BANK_TRANSFER' && <Bank className="h-5 w-5 mr-2" />}
                    {method === 'MOBILE_TRANSFER' && <Bank className="h-5 w-5 mr-2" />}
                    <span>{method.replace('_', ' ')}</span>
                  </button>
                ))}
              </div>

              {paymentMethod === 'CASH' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Amount Received</label>
                  <input
                    type="number"
                    step="0.01"
                    value={paymentAmount}
                    onChange={(e) => setPaymentAmount(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    placeholder={total.toFixed(2)}
                  />
                  {parseFloat(paymentAmount) > total && (
                    <p className="text-sm text-green-600 mt-1">Change: Rs {(parseFloat(paymentAmount) - total).toFixed(2)}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}