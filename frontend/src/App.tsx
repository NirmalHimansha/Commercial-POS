import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import LoginPage from './pages/LoginPage';
import CheckoutPage from './pages/CheckoutPage';
import DashboardPage from './pages/DashboardPage';
import ProductsPage from './pages/ProductsPage';
import LowStockPage from './pages/LowStockPage';
import SettingsPage from './pages/SettingsPage';
import ReportsPage from './pages/ReportsPage';
import ReceiptPage from './pages/ReceiptPage';
import ReceiptsPage from './pages/ReceiptsPage';
import Layout from './components/Layout';

function App() {
  const { user } = useAuthStore();

  if (!user) {
    return <LoginPage />;
  }

  return (
    <BrowserRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/low-stock" element={<LowStockPage />} />
          <Route path="/receipt/:id" element={<ReceiptPage />} />
          <Route path="/receipts" element={<ReceiptsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default function AppWithAuth() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

export default App;