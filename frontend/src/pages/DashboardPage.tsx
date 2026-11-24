import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { ShoppingCart, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import api from '../lib/api';
import { UserRole } from '../types';

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: health, isLoading: loadingHealth } = useQuery({
    queryKey: ['health'],
    queryFn: async () => {
      const response = await api.get('/health/db');
      return response.data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Welcome back, {user?.name}!</p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          icon={<ShoppingCart className="h-6 w-6 text-blue-600" />}
          title="Today's Sales"
          value="Rs 0.00"
          change="+0%"
        />
        <StatCard
          icon={<Package className="h-6 w-6 text-green-600" />}
          title="Inventory Items"
          value="200"
          change="+0"
        />
        <StatCard
          icon={<AlertTriangle className="h-6 w-6 text-yellow-600" />}
          title="Low Stock Items"
          value="0"
          change="Alert"
        />
        <StatCard
          icon={<BarChart3 className="h-6 w-6 text-purple-600" />}
          title="Database Status"
          value={health?.status === 'ok' ? 'Online' : 'Offline'}
          change={health?.database || 'Checking...'}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => (window.location.href = '/checkout')}
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <ShoppingCart className="h-8 w-8 text-blue-600 mr-3" />
            <div>
              <p className="font-medium text-gray-800">New Sale</p>
              <p className="text-sm text-gray-600">Process a new invoice</p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = '/products')}
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Package className="h-8 w-8 text-green-600 mr-3" />
            <div>
              <p className="font-medium text-gray-800">Manage Products</p>
              <p className="text-sm text-gray-600">Add/edit products</p>
            </div>
          </button>

          <button
            onClick={() => (window.location.href = '/low-stock')}
            className="flex items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
          >
            <AlertTriangle className="h-8 w-8 text-yellow-600 mr-3" />
            <div>
              <p className="font-medium text-gray-800">Low Stock</p>
              <p className="text-sm text-gray-600">View items below reorder level</p>
            </div>
          </button>
        </div>
      </div>

      {/* Database Status */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">System Status</h2>
        <div className="flex items-center space-x-4">
          <div className={`w-3 h-3 rounded-full ${health?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span className="text-gray-700">Database: {health?.database || 'Connected'}</span>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  change,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  change: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center">
        <div className="p-2 bg-gray-100 rounded-full">{icon}</div>
        <div className="ml-3">
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

// Import useAuthStore inline to avoid issues
const { useAuthStore } = require('../stores/authStore');