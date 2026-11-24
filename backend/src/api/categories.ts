import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { ManagerOrOwner } from '../middleware/auth';

export async function categoryRoutes(app: FastifyInstance) {
  // List categories
  app.get('/categories', async () => {
    try {
      const categories = await prisma.category.findMany({
        orderBy: { name: 'asc' },
      });
      return { categories };
    } catch (error) {
      return { error: 'Failed to fetch categories' };
    }
  });

  // Get category
  app.get('/categories/:id', async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
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
        return { error: 'Category not found' };
      }
      return category;
    } catch (error) {
      return { error: 'Invalid category ID' };
    }
  });

  // Create category (manager+)
  app.post('/categories', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const { name, description } = request.body as { name: string; description?: string };

      if (!name || !name.trim()) {
        return { error: 'Category name is required' };
      }

      const existing = await prisma.category.findUnique({
        where: { name: name.trim() },
      });

      if (existing) {
        return { error: 'Category with this name already exists' };
      }

      const category = await prisma.category.create({
        data: { name: name.trim(), description },
      });

      return category;
    } catch (error) {
      return { error: 'Failed to create category' };
    }
  });

  // Update category (manager+)
  app.put('/categories/:id', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
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
      return { error: 'Failed to update category' };
    }
  });

  // Delete category (manager+)
  app.delete('/categories/:id', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);

      // Check if category has products
      const productCount = await prisma.product.count({ where: { categoryId: id } });
      if (productCount > 0) {
        return { error: 'Cannot delete category with products' };
      }

      await prisma.category.delete({ where: { id } });
      return { message: 'Category deleted' };
    } catch (error) {
      return { error: 'Failed to delete category' };
    }
  });
}