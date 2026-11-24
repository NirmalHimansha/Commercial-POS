import { FastifyInstance } from 'fastify';
import { ProductService } from '../services/product.service';
import { authenticate, isManagerOrOwner, isOwner } from '../middleware/auth';
import {
  createProductSchema,
  updateProductSchema,
  bulkPriceUpdateSchema,
  bulkPriceUpdateCategorySchema,
  searchProductsSchema,
} from '../validation/products';
import { prisma } from '../utils/prisma';

export async function productRoutes(app: FastifyInstance) {
  const productService = new ProductService(app);

  // Search products (public for barcode scanning)
  app.get('/products', async (request, reply) => {
    try {
      const params = searchProductsSchema.parse(request.query);
      const result = await productService.searchProducts(params);
      return result;
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Invalid parameters' });
    }
  });

  // Get product by ID
  app.get('/products/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const product = await productService.getProductById(id);
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      return product;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid product ID' });
    }
  });

  // Get product by barcode
  app.get('/products/barcode/:barcode', async (request, reply) => {
    try {
      const product = await prisma.product.findFirst({
        where: { barcode: request.params.barcode },
      });
      if (!product) {
        return reply.status(404).send({ error: 'Product not found' });
      }
      return product;
    } catch (error) {
      reply.status(400).send({ error: 'Invalid barcode' });
    }
  });

  // Low stock alert
  app.get('/low-stock', { onRequest: [authenticate] }, async (request, reply) => {
    const lowStock = await productService.getLowStockProducts();
    return { products: lowStock };
  });

  // Create product (manager+)
  app.post('/products', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const data = createProductSchema.parse(await request.body);
      const product = await productService.createProduct(data);
      return product;
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to create product' });
    }
  });

  // Update product (manager+)
  app.put('/products/:id', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const data = updateProductSchema.parse({
        ...(await request.body),
        id,
      });
      const product = await productService.updateProduct(id, data);
      return product;
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to update product' });
    }
  });

  // Bulk price update (manager+)
  app.post('/products/bulk-price-update', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const data = bulkPriceUpdateSchema.parse(await request.body);
      const results = await productService.bulkPriceUpdate(data);
      return { updated: results };
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to update prices' });
    }
  });

  // Bulk price update by category (manager+)
  app.post('/products/bulk-price-update-category', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
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
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to update prices' });
    }
  });

  // Delete/inactivate product (manager+)
  app.delete('/products/:id', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      await productService.deleteProduct(id);
      return { message: 'Product inactivated' };
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to inactivate product' });
    }
  });
}