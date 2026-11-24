import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Package, ExternalLink } from 'lucide-react';
import api from '../lib/api';
import { Product } from '../types';
import { useAuthStore } from '../stores/authStore';

export default function LowStockPage() {
  const { user } = useAuthStore();
  const { data, isLoading, error } = useQuery({
    queryKey: ['low-stock'],
    queryFn: async () => {
      const response = await api.get('/products/low-stock');
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Low Stock Alerts</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  const products = data?.products || [];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Low Stock Items</h1>
        <p className="text-gray-600 mt-1">Items below their reorder level</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load low stock items</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">All items have sufficient stock</h3>
          <p className="text-gray-600">No low stock alerts at this time.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: any) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm p-4 border-l-4 border-yellow-400">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-yellow-100 rounded-md mr-3 flex-shrink-0 flex items-center justify-center">
                  <Package className="h-6 w-6 text-yellow-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.sku}</p>
                  <div className="mt-2 flex items-center text-sm">
                    <span className="text-gray-500">Current: </span>
                    <span className="font-medium text-yellow-600 ml-1">{product.currentQuantity}</span>
                    <span className="text-gray-500 mx-1">/</span>
                    <span className="text-gray-500">Reorder: </span>
                    <span className="font-medium text-gray-700 ml-1">{product.reorderLevel}</span>
                  </div>
                </div>
              </div>
              {(user?.role === 'OWNER' || user?.role === 'MANAGER') && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <button className="text-sm text-blue-600 hover:underline flex items-center">
                    Create Purchase Order
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl font-bold text-yellow-600">{products.length}</p>
            <p className="text-xs text-gray-600">Items Needing Reorder</p>
          </div>
          <div className="border-l border-r border-gray-200 pl-4 pr-4">
            <p className="text-2xl font-bold text-gray-900">{products.reduce((sum: number, p: any) => sum + (p.reorderLevel - p.currentQuantity), 0)}</p>
            <p className="text-xs text-gray-600">Total Units Needed</p>
          </div>
          <div className="border-l border-r border-gray-200 pl-4">
            <p className="text-2xl font-bold text-gray-900">
              Rs {products.reduce((sum: number, p: any) => sum + (p.reorderLevel - p.currentQuantity) * parseFloat(p.costPrice), 0).toFixed(2)}
            </p>
            <p className="text-xs text-gray-600">Estimated Cost</p>
          </div>
        </div>
      </div>
    </div>
  );
}