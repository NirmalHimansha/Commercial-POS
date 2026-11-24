import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { authenticate, isManagerOrOwner, isOwner } from '../middleware/auth';

export async function supplierRoutes(app: FastifyInstance) {
  // List suppliers
  app.get('/suppliers', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' },
        include: { _count: { select: { purchases: true } } },
      });
      return { suppliers };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch suppliers' });
    }
  });

  // Get supplier
  app.get('/suppliers/:id', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          purchases: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
      if (!supplier) {
        return reply.status(404).send({ error: 'Supplier not found' });
      }
      return supplier;
    } catch (error) {
      reply.status(400).send({ error: 'Invalid supplier ID' });
    }
  });

  // Create supplier
  app.post('/suppliers', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const { name, contact, email, phone, address } = request.body as {
        name: string;
        contact?: string;
        email?: string;
        phone?: string;
        address?: string;
      };

      if (!name || !name.trim()) {
        return reply.status(400).send({ error: 'Supplier name is required' });
      }

      const supplier = await prisma.supplier.create({
        data: {
          name: name.trim(),
          contact,
          email,
          phone,
          address,
        },
      });

      return supplier;
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to create supplier' });
    }
  });

  // Update supplier
  app.put('/suppliers/:id', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { name, contact, email, phone, address } = request.body as {
        name?: string;
        contact?: string;
        email?: string;
        phone?: string;
        address?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name.trim();
      if (contact !== undefined) updateData.contact = contact;
      if (email !== undefined) updateData.email = email;
      if (phone !== undefined) updateData.phone = phone;
      if (address !== undefined) updateData.address = address;

      const supplier = await prisma.supplier.update({
        where: { id },
        data: updateData,
      });

      return supplier;
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to update supplier' });
    }
  });

  // Delete supplier (owner only)
  app.delete('/suppliers/:id', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);

      // Check if supplier has purchases
      const purchaseCount = await prisma.purchase.count({ where: { supplierId: id } });
      if (purchaseCount > 0) {
        return reply.status(400).send({ error: 'Cannot delete supplier with purchases' });
      }

      await prisma.supplier.delete({ where: { id } });
      return { message: 'Supplier deleted' };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to delete supplier' });
    }
  });

  // Get suggested purchase list for low stock items
  app.get('/suppliers/suggested-purchases', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      // Get all products with their current stock
      const products = await prisma.product.findMany({
        where: { isActive: true },
      });

      // Get stock movements for each product
      const suggestedPurchases: Record<number, { name: string; quantity: number; totalCost: number }>[] = [];

      for (const product of products) {
        // Calculate current stock
        const movements = await prisma.stockMovement.findMany({
          where: { productId: product.id },
        });

        let quantity = 0;
        for (const m of movements) {
          if (m.type === 'IN' || m.type === 'ADJUSTMENT_IN') {
            quantity += parseFloat(m.quantity.toString());
          } else {
            quantity -= parseFloat(m.quantity.toString());
          }
        }

        // If below reorder level
        if (quantity <= (product.reorderLevel || 10)) {
          const needed = (product.reorderLevel || 10) - quantity;
          const totalCost = needed * parseFloat(product.costPrice);

          suggestedPurchases.push({
            productId: product.id,
            name: product.name,
            quantity: needed,
            totalCost,
          });
        }
      }

      // Group by suppliers (simplified - would need supplier-product mapping in real implementation)
      const totalItems = suggestedPurchases.reduce((sum, item) => sum + item.quantity, 0);

      return {
        items: suggestedPurchases,
        totalItems,
        totalCost: suggestedPurchases.reduce((sum, item) => sum + item.totalCost, 0),
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate suggested purchases' });
    }
  });
}