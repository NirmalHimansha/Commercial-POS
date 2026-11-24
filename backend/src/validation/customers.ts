import { z } from 'zod';

export const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  address: z.string().optional(),
  creditLimit: z.number().min(0).optional(),
});

export const updateCustomerSchema = createCustomerSchema.partial().merge(
  z.object({
    id: z.number().int(),
  })
);