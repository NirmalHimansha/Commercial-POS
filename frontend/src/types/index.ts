export enum UserRole {
  OWNER = 'OWNER',
  MANAGER = 'MANAGER',
  CASHIER = 'CASHIER',
}

export enum InvoiceStatus {
  DRAFT = 'DRAFT',
  PAID = 'PAID',
  VOIDED = 'VOIDED',
  RETURNED = 'RETURNED',
}

export enum PaymentMethod {
  CASH = 'CASH',
  CARD = 'CARD',
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_TRANSFER = 'MOBILE_TRANSFER',
  CREDIT = 'CREDIT',
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  costPrice: string;
  sellingPrice: string;
  taxRate: string;
  reorderLevel: number;
  isActive: boolean;
  barcode?: string;
  categoryId?: number;
  category?: Category;
  brand?: string;
  unit?: string;
  image?: string;
  currentQuantity?: number;
  isLowStock?: boolean;
}

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface Invoice {
  id: number;
  invoiceNumber: string;
  status: InvoiceStatus;
  customerId?: number;
  customer?: Customer;
  userId: number;
  items: InvoiceItem[];
  total: string;
  taxableTotal: string;
  taxTotal: string;
  discount: string;
  paymentMethod: PaymentMethod;
  paymentStatus: string;
  changeAmount: string;
  createdAt: string;
  notes?: string;
}

export interface InvoiceItem {
  id: number;
  invoiceId: number;
  productId: number;
  product?: Product;
  quantity: string;
  unitPrice: string;
  discount: string;
  taxRate: string;
  total: string;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  creditLimit?: string;
  loyaltyPoints?: number;
}

export interface Supplier {
  id: number;
  name: string;
  contact?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
}