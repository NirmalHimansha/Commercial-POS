import { z } from 'zod';

export const createInvoiceItemSchema = z.object({
  productId: z.number().int(),
  quantity: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid quantity format'),
  discount: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid discount format').optional(),
});

export const createInvoiceSchema = z.object({
  customerId: z.number().int().optional(),
  items: z.array(createInvoiceItemSchema).min(1, 'Invoice must have at least one item'),
  paymentMethod: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_TRANSFER', 'CREDIT']),
  paymentAmount: z.string().optional(),
});

export const returnInvoiceSchema = z.object({
  invoiceId: z.number().int(),
  items: z.array(z.object({
    itemId: z.number().int(),
    quantity: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid quantity format'),
    reason: z.string().optional(),
  })).min(1, 'Return must have at least one item'),
});

export const processPaymentSchema = z.object({
  invoiceId: z.number().int(),
  amount: z.string().regex(/^\d+(\.\d{1,6})?$/, 'Invalid amount format'),
  method: z.enum(['CASH', 'CARD', 'BANK_TRANSFER', 'MOBILE_TRANSFER', 'CREDIT']),
});

export const voidInvoiceSchema = z.object({
  id: z.number().int(),
  reason: z.string().optional(),
});