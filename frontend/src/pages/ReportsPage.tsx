import React, { useState } from 'react';
import { BarChart3, Calendar, Download, Users, Package, TrendingUp, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'sales' | 'inventory' | 'customers' | 'suppliers'>('sales');
  const [dateRange, setDateRange] = useState<'today' | 'week' | 'month' | 'year'>('today');
  const { user } = useAuthStore();

  // Sales report data
  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ['reports', 'sales', dateRange],
    queryFn: async () => {
      const response = await api.get('/reports/sales', {
        params: { period: dateRange }
      });
      return response.data;
    },
    enabled: reportType === 'sales',
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Low stock data
  const { data: lowStockData } = useQuery({
    queryKey: ['products', 'low-stock'],
    queryFn: async () => {
      const response = await api.get('/products/low-stock');
      return response.data;
    },
    enabled: reportType === 'inventory',
  });

  // Sales data for charts
  const salesStats = salesData?.summary || {};

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 flex space-x-4">
        <select
          value={reportType}
          onChange={(e) => setReportType(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="sales">Sales Report</option>
          <option value="inventory">Inventory Value</option>
          <option value="customers">Customer Outstanding</option>
          <option value="suppliers">Supplier Payables</option>
        </select>

        <select
          value={dateRange}
          onChange={(e) => setDateRange(e.target.value as any)}
          className="border border-gray-300 rounded-lg px-3 py-2"
        >
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="year">This Year</option>
        </select>

        <button className="ml-auto flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100">
          <Calendar className="h-5 w-5 mr-2" />
          Custom Range
        </button>

        <button className="ml-auto flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
          <Download className="h-5 w-5 mr-2" />
          Export CSV
        </button>
      </div>

      {/* Report Content */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">
          {renderReportTitle(reportType)}
        </h2>

        {renderReportContent()}
      </div>
    </div>
  );
}

function renderReportTitle(type: string): string {
  switch (type) {
    case 'sales': return 'Sales Summary';
    case 'inventory': return 'Inventory Valuation';
    case 'customers': return 'Customer Credit Outstanding';
    case 'suppliers': return 'Supplier Payables';
    default: return 'Reports';
  }
}

function SalesReport() {
  const { data, isLoading } = useQuery({
    queryKey: ['reports', 'sales'],
    queryFn: async () => {
      const response = await api.get('/reports/sales');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return <div className="text-center py-8 text-gray-500">Loading sales data...</div>;
  }

  const stats = data?.summary || {};

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <ReportCard
          title="Total Sales"
          value={`Rs ${stats.totalSales?.toFixed(2) || '0'}`}
          change={stats.growthPercent}
          positive={true}
          icon={<TrendingUp className="h-6 w-6" />}
        />
        <ReportCard
          title="Total Orders"
          value={stats.totalOrders?.toString() || '0'}
          change={stats.growthPercent ? `${stats.growthPercent}%` : 'N/A'}
          positive={true}
          icon={<BarChart3 className="h-6 w-6" />}
        />
        <ReportCard
          title="Avg Order"
          value={`Rs ${stats.averageOrderValue?.toFixed(2) || '0'}`}
          icon={<Calendar className="h-6 w-6" />}
        />
        <ReportCard
          title="Active Products"
          value={stats.activeProducts?.toString() || '0'}
          icon={<Package className="h-6 w-6" />}
        />
      </div>

      {/* Sales Chart Placeholder */}
      <div className="border border-gray-200 rounded-lg p-4">
        <h3 className="font-medium text-gray-800 mb-3">Sales Over Time</h3>
        <div className="h-48 bg-gray-50 rounded flex items-center justify-center">
          <p className="text-gray-500">Chart visualization will be implemented with Chart.js integration</p>
        </div>
      </div>
    </div>
  );
}

function InventoryReport() {
  const { data } = useQuery({
    queryKey: ['reports', 'inventory'],
    queryFn: async () => {
      const response = await api.get('/products');
      return response.data;
    },
    staleTime: 5 * 60 * 1000,
  });

  const products = data?.products || [];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="bg-yellow-50 rounded-lg p-4 text-center">
          <AlertTriangle className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-yellow-900">{data?.lowStockCount || 0}</p>
          <p className="text-sm text-yellow-600">Low Stock Items</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-blue-900">{data?.totalProducts || 0}</p>
          <p className="text-sm text-blue-600">Total Products</p>
        </div>
        <div className="bg-green-50 rounded-lg p-4 text-center">
          <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <p className="text-2xl font-bold text-green-900">
            Rs {data?.totalInventoryValue?.toFixed(2) || '0'}
          </p>
          <p className="text-sm text-green-600">Inventory Value</p>
        </div>
      </div>

      <div className="text-center py-8 text-gray-500">
        <BarChart3 className="h-12 w-12 mx-auto mb-2" />
        <p>Detailed inventory report view</p>
        <p className="text-sm">Connect to backend for full data</p>
      </div>
    </div>
  );
}

function CustomerReport() {
  return (
    <div className="text-center py-8 text-gray-500">
      <Users className="h-12 w-12 mx-auto mb-2" />
      <p>Customer credit report</p>
      <p className="text-sm">Feature coming in Phase 3</p>
    </div>
  );
}

function SupplierReport() {
  return (
    <div className="text-center py-8 text-gray-500">
      <AlertTriangle className="h-12 w-12 mx-auto mb-2" />
      <p>Supplier payables report</p>
      <p className="text-sm">Feature coming in Phase 3</p>
    </div>
  );
}

function renderReportContent() {
  switch (reportType) {
    case 'sales': return <SalesReport />;
    case 'inventory': return <InventoryReport />;
    case 'customers': return <CustomerReport />;
    case 'suppliers': return <SupplierReport />;
    default: return null;
  }
}

interface ReportCardProps {
  title: string;
  value: string;
  change?: string | number;
  positive?: boolean;
  icon: React.ReactNode;
}

function ReportCard({ title, value, change, positive = true, icon }: ReportCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center">
        <div className={`p-2 rounded-full ${positive ? 'bg-blue-100' : 'bg-gray-100'}`}>
          {icon}
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          <p className="text-lg font-semibold text-gray-900">{value}</p>
          {change && (
            <p className={`text-xs ${positive ? 'text-green-600' : 'text-gray-500'}`}>
              {typeof change === 'number' ? `${change}%` : change}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}