import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerSchema = z.object({
  email: z.string().email('Please provide a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  role: z.enum(['OWNER', 'MANAGER', 'CASHIER']).default('CASHIER'),
});

export const setPinSchema = z.object({
  pin: z.string().length(4, 'PIN must be exactly 4 digits').regex(/^\d{4}$/, 'PIN must contain only digits'),
});