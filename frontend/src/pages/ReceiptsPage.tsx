import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search, Receipt as ReceiptIcon, Filter, ArrowLeft, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function ReceiptsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PENDING' | 'RETURNED' | 'VOIDED'>('all');
  const { user } = useAuthStore();

  const { data, isLoading } = useQuery({
    queryKey: ['invoices', searchTerm, statusFilter],
    queryFn: async () => {
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;

      const response = await api.get('/invoices', { params });
      return response.data;
    },
  });

  const invoices = data?.data || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Receipts</h1>
      </div>

      {/* Filters */}
      <div className="flex space-x-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by invoice number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="all">All Status</option>
          <option value="PAID">Paid</option>
          <option value="PENDING">Pending</option>
          <option value="VOIDED">Voided</option>
        </select>
      </div>

      {isLoading ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Loading receipts...</p>
        </div>
      ) : invoices.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <ReceiptIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No receipts found</h3>
          <p className="text-gray-600">
            {searchTerm || statusFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Start a sale in the Checkout section to create your first receipt'}
          </p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Invoice #</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cashier</th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right w-12"> </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {invoices.map((invoice: any) => (
                <tr key={invoice.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    <Link
                      to={`/receipt/${invoice.id}`}
                      className="text-blue-600 hover:underline"
                    >
                      #{invoice.invoiceNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {new Date(invoice.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                    Rs {parseFloat(invoice.total).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {invoice.user?.name || 'Unknown'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      invoice.status === 'PAID'
                        ? 'bg-green-100 text-green-800'
                        : invoice.status === 'VOIDED'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {invoice.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      to={`/receipt/${invoice.id}`}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Total Invoices</p>
          <p className="text-2xl font-bold text-gray-900">{invoices.length}</p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Total Sales</p>
          <p className="text-2xl font-bold text-gray-900">
            Rs {invoices.reduce((sum: number, inv: any) => sum + parseFloat(inv.total), 0).toFixed(2)}
          </p>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-4">
          <p className="text-xs text-gray-600 mb-1">Recent Days</p>
          <p className="text-2xl font-bold text-gray-900">30</p>
        </div>
      </div>
    </div>
  );
}