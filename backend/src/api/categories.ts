import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { authenticate, isManagerOrOwner, isOwner } from '../middleware/auth';

export async function categoryRoutes(app: FastifyInstance) {
  // List categories
  app.get('/categories', async (request, reply) => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { products: true } } },
      });
      return { categories };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch categories' });
    }
  });

  // Get category
  app.get('/categories/:id', async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const category = await prisma.category.findUnique({
        where: { id },
        include: {
          products: {
            where: { isActive: true },
            orderBy: { name: 'asc' },
          },
        },
      });
      if (!category) {
        return reply.status(404).send({ error: 'Category not found' });
      }
      return category;
    } catch (error) {
      reply.status(400).send({ error: 'Invalid category ID' });
    }
  });

  // Create category (manager+)
  app.post('/categories', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const { name, description } = request.body as { name: string; description?: string };

      if (!name || !name.trim()) {
        return reply.status(400).send({ error: 'Category name is required' });
      }

      const existing = await prisma.category.findUnique({
        where: { name: name.trim() },
      });

      if (existing) {
        return reply.status(400).send({ error: 'Category with this name already exists' });
      }

      const category = await prisma.category.create({
        data: { name: name.trim(), description },
      });

      return category;
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to create category' });
    }
  });

  // Update category (manager+)
  app.put('/categories/:id', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { name, description } = request.body as { name?: string; description?: string };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name.trim();
      if (description !== undefined) updateData.description = description;

      const category = await prisma.category.update({
        where: { id },
        data: updateData,
      });

      return category;
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to update category' });
    }
  });

  // Delete category (manager+)
  app.delete('/categories/:id', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);

      // Check if category has products
      const productCount = await prisma.product.count({ where: { categoryId: id } });
      if (productCount > 0) {
        return reply.status(400).send({ error: 'Cannot delete category with products' });
      }

      await prisma.category.delete({ where: { id } });
      return { message: 'Category deleted' };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to delete category' });
    }
  });
}