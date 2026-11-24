import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contact: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

export const updateSupplierSchema = createSupplierSchema.partial().merge(
  z.object({
    id: z.number().int(),
  })
);