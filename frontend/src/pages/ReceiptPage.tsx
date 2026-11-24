import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, Share2, Print } from 'lucide-react';
import api from '../lib/api';
import { InvoiceStatus } from '../types';

export default function ReceiptPage() {
  const { id } = useParams<{ id: string } };
  const { data, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: async () => {
      const response = await api.get(`/invoices/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Receipt</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  const invoice = data;
  if (!invoice) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Receipt</h1>
        <div className="text-center py-8">
          <p className="text-gray-600">Invoice not found</p>
          <Link to="/" className="text-blue-600 hover:underline mt-2 inline-block">Go to Dashboard</Link>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case InvoiceStatus.PAID:
        return 'text-green-600';
      case InvoiceStatus.VOIDED:
        return 'text-red-600';
      case InvoiceStatus.RETURNED:
        return 'text-orange-600';
      default:
        return 'text-blue-600';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <Link to="/" className="text-gray-600 hover:text-gray-900 flex items-center">
            <ArrowLeft className="h-5 w-5 mr-1" />
            Back
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">Invoice #{invoice.invoiceNumber}</h1>
      </div>

      {/* Status Badge */}
      <div className="flex items-center justify-end">
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
          {invoice.status}
        </span>
      </div>

      {/* Receipt */}
      <div className="bg-white rounded-lg shadow-sm p-6 max-w-md mx-auto">
        {/* Header */}
        <div className="text-center border-b pb-4 mb-4">
          <h1 className="text-xl font-bold text-gray-900">Local Grocery Store</h1>
          <p className="text-sm text-gray-600">No: 123 Main Street | Colombo</p>
          <p className="text-sm text-gray-500">Tel: 011-1234567 | GSTIN: 123456789V</p>
        </div>

        {/* Invoice Info */}
        <div className="border-b pb-2 mb-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm"><span className="text-gray-500">Invoice #: </span>{invoice.invoiceNumber}</p>
              <p className="text-sm"><span className="text-gray-500">Date: </span>{new Date(invoice.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm">Cashier: {invoice.user?.name}</p>
              {invoice.customer && (
                <p className="text-sm">Customer: {invoice.customer.name}</p>
              )}
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="space-y-2 mb-4">
          <div className="grid grid-cols-4 text-xs text-gray-500 mb-2">
            <span>Item</span>
            <span className="text-right">Qty</span>
            <span className="text-right">Price</span>
            <span className="text-right">Total</span>
          </div>
          {invoice.items.map((item, idx) => (
            <div key={item.id || idx} className="grid grid-cols-4 text-sm">
              <span className="truncate">{item.product?.name || `Product ${item.productId}`}</span>
              <span className="text-right">{parseFloat(item.quantity).toFixed(2)}</span>
              <span className="text-right">Rs {parseFloat(item.unitPrice).toFixed(2)}</span>
              <span className="text-right font-medium">Rs {parseFloat(item.total).toFixed(2)} </span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t pt-2 space-y-1">
          <div className="flex justify-between">
            <span>Subtotal</span>
            <span>Rs {parseFloat(invoice.taxableTotal).toFixed(2)}</span>
          </div>
          {parseFloat(invoice.taxTotal) > 0 && (
            <>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>Rs {parseFloat(invoice.taxTotal).toFixed(2)}</span>
              </div>
            </>
          )}
          <div className="flex justify-between text-lg font-bold">
            <span>Total</span>
            <span>Rs {parseFloat(invoice.total).toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Info */}
        <div className="border-t pt-2 text-xs text-gray-600">
          <p>Method: {invoice.paymentMethod}</p>
          <p>Status: {invoice.paymentStatus}</p>
        </div>

        {/* Footer */}
        <div className="border-t pt-4 mt-4 text-center text-xs text-gray-500">
          <p>Thank you for your purchase!</p>
          <p>Terms: Cash only. No refunds after 30 days.</p>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-3 gap-2">
        <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100">
          <Print className="h-4 w-4 mr-2" />
          Print
        </button>
        <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100">
          <Download className="h-4 w-4 mr-2" />
          Download
        </button>
        <button className="flex items-center justify-center py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-100">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </button>
      </div>
    </div>
  );
}