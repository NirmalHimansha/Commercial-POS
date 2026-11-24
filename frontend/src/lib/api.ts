import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('pos_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('pos_token');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
export const apiEndpoints = {
  auth: {
    login: '/auth/login',
    loginPin: '/auth/login/pin',
    setPin: '/auth/me/pin',
    me: '/auth/me',
  },
  products: {
    search: '/products',
    get: (id: number) => `/products/${id}`,
    getByBarcode: (barcode: string) => `/products/barcode/${barcode}`,
    create: '/products',
    update: (id: number) => `/products/${id}`,
    delete: (id: number) => `/products/${id}`,
    lowStock: '/low-stock',
    bulkPriceUpdate: '/products/bulk-price-update',
  },
  categories: {
    list: '/categories',
    get: (id: number) => `/categories/${id}`,
    create: '/categories',
    update: (id: number) => `/categories/${id}`,
    delete: (id: number) => `/categories/${id}`,
  },
  invoices: {
    list: '/invoices',
    create: '/invoices',
    get: (id: number) => `/invoices/${id}`,
    pay: (id: number) => `/invoices/${id}/pay`,
    return: (id: number) => `/invoices/${id}/return`,
    void: (id: number) => `/invoices/${id}/void`,
    delete: (id: number) => `/invoices/${id}`,
    search: (number: string) => `/invoices/search/${number}`,
  },
  suppliers: {
    list: '/suppliers',
    get: (id: number) => `/suppliers/${id}`,
    create: '/suppliers',
    update: (id: number) => `/suppliers/${id}`,
    delete: (id: number) => `/suppliers/${id}`,
    suggestedPurchases: '/suppliers/suggested-purchases',
  },
  users: {
    list: '/users',
    get: (id: number) => `/users/${id}`,
    create: '/users',
    update: (id: number) => `/users/${id}`,
    delete: (id: number) => `/users/${id}`,
  },
  reports: {
    sales: '/reports/sales',
    inventory: '/reports/inventory',
    customers: '/reports/customers',
    suppliers: '/reports/suppliers',
  },
  health: {
    check: '/health',
    db: '/health/db',
  },
};