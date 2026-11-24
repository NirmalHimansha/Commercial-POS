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

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  PARTIAL = 'PARTIAL',
}

export enum PurchaseStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  CANCELLED = 'CANCELLED',
}

export enum EntryType {
  CASH_IN = 'CASH_IN',
  CASH_OUT = 'CASH_OUT',
}

export enum MovementType {
  IN = 'IN',
  OUT = 'OUT',
  ADJUSTMENT_IN = 'ADJUSTMENT_IN',
  ADJUSTMENT_OUT = 'ADJUSTMENT_OUT',
}

export interface AuthPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    email: string;
    name: string;
    role: UserRole;
  };
}

export interface DecryptedToken {
  id: number;
  email: string;
  role: UserRole;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}