import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, Package, AlertTriangle, TrendingDown } from 'lucide-react';
import api from '../lib/api';
import { Product } from '../types';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [showInactive, setShowInactive] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['products', searchTerm, showInactive],
    queryFn: async () => {
      const response = await api.get('/products', {
        params: {
          search: searchTerm || undefined,
          isActive: showInactive ? undefined : true,
        },
      });
      return response.data;
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="text-center py-8">Loading...</div>
      </div>
    );
  }

  const products = data?.products || [];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <div className="flex items-center space-x-2">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm text-gray-600">Show Inactive</span>
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name, SKU, or barcode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-600">Failed to load products</p>
        </div>
      )}

      {products.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">No products found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product: Product) => (
            <div key={product.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start">
                <div className="w-12 h-12 bg-gray-100 rounded-md mr-3 flex-shrink-0 flex items-center justify-center">
                  <Package className="h-6 w-6 text-gray-500" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">{product.name}</h3>
                  <p className="text-sm text-gray-600">{product.sku}</p>
                  <div className="mt-2 text-xs text-gray-500">
                    <div>
                      <span className="text-gray-500">Cost: </span>
                      <span>Rs {parseFloat(product.costPrice).toFixed(2)}</span>
                      <span className="mx-2">|</span>
                      <span className="text-green-600">Sell: </span>
                      <span>Rs {parseFloat(product.sellingPrice).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Barcode: {product.barcode || '-'}</span>
                      <span>Stock: ~{product.currentQuantity ?? 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              {product.isLowStock && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                    <AlertTriangle className="h-3 w-3 mr-1" />
                    Low Stock
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}