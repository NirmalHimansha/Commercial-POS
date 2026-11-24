import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, Home, ShoppingCart, Package, AlertTriangle, BarChart3, Settings, Receipt, LogOut as LogOutIcon } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  roles: import('../types').UserRole[];
}

const navItems: NavItem[] = [
  { name: 'Dashboard', href: '/', icon: <Home size={20} />, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Checkout', href: '/checkout', icon: <ShoppingCart size={20} />, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Products', href: '/products', icon: <Package size={20} />, roles: ['OWNER', 'MANAGER'] },
  { name: 'Low Stock', href: '/low-stock', icon: <AlertTriangle size={20} />, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Reports', href: '/reports', icon: <BarChart3 size={20} />, roles: ['OWNER', 'MANAGER'] },
  { name: 'Receipts', href: '/receipts', icon: <Receipt size={20} />, roles: ['OWNER', 'MANAGER', 'CASHIER'] },
  { name: 'Settings', href: '/settings', icon: <Settings size={20} />, roles: ['OWNER', 'MANAGER'] },
];

export default function Layout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { user, logout } = useAuthStore();

  const filteredNavItems = navItems.filter((item) => item.roles.includes(user?.role));

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-white border-r border-gray-200">
        <div className="p-4 border-b">
          <h1 className="text-lg font-semibold text-gray-800">POS System</h1>
          <p className="text-xs text-gray-500">Local Grocery</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {filteredNavItems.map((item) => (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center px-3 py-2 text-sm rounded-md transition-colors ${
                location.pathname === item.href
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t">
          <button
            onClick={logout}
            className="flex items-center w-full px-3 py-2 text-sm text-gray-600 rounded-md hover:bg-gray-100"
          >
            <LogOutIcon size={20} />
            <span className="ml-3">Logout</span>
          </button>
          <div className="mt-2 text-xs text-gray-500">
            <p>Logged in as: {user?.name}</p>
            <p className="capitalize">Role: {user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </aside>

      {/* Mobile header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white border-b">
        <button onClick={() => {}} className="p-2">
          <Menu size={24} />
        </button>
        <h1 className="text-lg font-semibold">POS</h1>
      </div>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-4">{children}</main>
    </div>
  );
}