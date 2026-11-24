import { FastifyInstance } from 'fastify';
import { ProductService } from '../services/product.service';
import { authenticate, ManagerOrOwner } from '../middleware/auth';
import {
  createProductSchema,
  updateProductSchema,
  bulkPriceUpdateSchema,
  bulkPriceUpdateCategorySchema,
  searchProductsSchema,
} from '../validation/products';
import { prisma } from '../utils/prisma';
import '../middleware/auth'; // Import module augmentation

export async function productRoutes(app: FastifyInstance) {
  const productService = new ProductService();

  // Search products (public for barcode scanning)
  app.get('/products', async (request) => {
    try {
      const params = searchProductsSchema.parse(request.query);
      const result = await productService.searchProducts(params);
      return result;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Invalid parameters' };
    }
  });

  // Get product by ID
  app.get('/products/:id', async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      const product = await productService.getProductById(id);
      if (!product) {
        return { error: 'Product not found' };
      }
      return product;
    } catch (error) {
      return { error: 'Invalid product ID' };
    }
  });

  // Get product by barcode
  app.get('/products/barcode/:barcode', async (request) => {
    try {
      const product = await prisma.product.findFirst({
        where: { barcode: (request.params as Record<string, string>).barcode },
      });
      if (!product) {
        return { error: 'Product not found' };
      }
      return product;
    } catch (error) {
      return { error: 'Invalid barcode' };
    }
  });

  // Low stock alert
  app.get('/low-stock', { onRequest: [authenticate] }, async () => {
    const lowStock = await productService.getLowStockProducts();
    return { products: lowStock };
  });

  // Create product (manager+)
  app.post('/products', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const data = createProductSchema.parse(await request.body);
      const product = await productService.createProduct(data);
      return product;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create product' };
    }
  });

  // Update product (manager+)
  app.put('/products/:id', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      const body = await request.body as Partial<{
        name: string;
        sku: string;
        costPrice: number;
        sellingPrice: number;
        taxRate: number;
        reorderLevel: number;
        isActive: boolean;
        categoryId: number | null;
        brand: string | null;
        unit: string | null;
        image: string | null;
        barcode: string | null;
        description: string | null;
      }>;
      const data = updateProductSchema.parse({
        ...body,
        id,
      });
      const product = await productService.updateProduct(id, data);
      return product;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update product' };
    }
  });

  // Bulk price update (manager+)
  app.post('/products/bulk-price-update', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const data = bulkPriceUpdateSchema.parse(await request.body);
      const results = await productService.bulkPriceUpdate(data);
      return { updated: results };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update prices' };
    }
  });

  // Bulk price update by category (manager+)
  app.post('/products/bulk-price-update-category', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const data = bulkPriceUpdateCategorySchema.parse(await request.body);

      // Get all products in categories
      const products = await prisma.product.findMany({
        where: { categoryId: { in: data.categoryIds } },
      });

      const productIds = products.map((p) => p.id);
      const results = await productService.bulkPriceUpdate({
        ...data,
        productIds,
      });

      return { updated: results };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to update prices' };
    }
  });

  // Delete/inactivate product (manager+)
  app.delete('/products/:id', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      await productService.deleteProduct(id);
      return { message: 'Product inactivated' };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to inactivate product' };
    }
  });
}