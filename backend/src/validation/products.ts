import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  sku: z.string().min(1, 'SKU is required'),
  costPrice: z.number().min(0, 'Cost price must be non-negative'),
  sellingPrice: z.number().min(0, 'Selling price must be non-negative'),
  taxRate: z.number().min(0).max(100).optional(),
  reorderLevel: z.number().int().min(0).optional(),
  categoryId: z.number().int().optional(),
  brand: z.string().optional(),
  unit: z.string().optional(),
  barcode: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateProductSchema = createProductSchema.partial().merge(
  z.object({
    id: z.number().int(),
  })
);

export const bulkPriceUpdateSchema = z.object({
  productIds: z.array(z.number().int()).min(1, 'At least one product is required'),
  field: z.enum(['costPrice', 'sellingPrice']),
  operation: z.enum(['percentage', 'fixed', 'absolute']),
  value: z.number(),
});

export const bulkPriceUpdateCategorySchema = z.object({
  categoryIds: z.array(z.number().int()).min(1, 'At least one category is required'),
  field: z.enum(['costPrice', 'sellingPrice']),
  operation: z.enum(['percentage', 'fixed', 'absolute']),
  value: z.number(),
});

export const searchProductsSchema = z.object({
  search: z.string().optional(),
  barcode: z.string().optional(),
  categoryId: z.number().int().optional(),
  isActive: z.boolean().optional(),
  belowReorderLevel: z.boolean().optional(),
  page: z.number().int().min(1).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});