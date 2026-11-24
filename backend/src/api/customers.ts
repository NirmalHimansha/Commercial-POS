import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { authenticate, isManagerOrOwner, isOwner } from '../middleware/auth';

export async function customerRoutes(app: FastifyInstance) {
  // List customers
  app.get('/customers', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const { search, page = 1, limit = 50 } = request.query as {
        search?: string;
        page?: number;
        limit?: number;
      };

      const where: any = {};
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { phone: { contains: search, mode: 'insensitive' } },
        ];
      }

      const [customers, total] = await Promise.all([
        prisma.customer.findMany({
          where,
          skip: (page - 1) * limit,
          take: limit,
          orderBy: { name: 'asc' },
        }),
        prisma.customer.count({ where }),
      ]);

      return {
        customers,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch customers' });
    }
  });

  // Get customer
  app.get('/customers/:id', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const customer = await prisma.customer.findUnique({
        where: { id },
        include: {
          invoices: {
            orderBy: { createdAt: 'desc' },
            take: 10,
          },
        },
      });

      if (!customer) {
        return reply.status(404).send({ error: 'Customer not found' });
      }

      return customer;
    } catch (error) {
      reply.status(400).send({ error: 'Invalid customer ID' });
    }
  });

  // Create customer
  app.post('/customers', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const { name, phone, email, address, creditLimit } = request.body as {
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        creditLimit?: string;
      };

      if (!name || !name.trim()) {
        return reply.status(400).send({ error: 'Customer name is required' });
      }

      const customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          phone,
          email,
          address,
          creditLimit: creditLimit || '0',
        },
      });

      return customer;
    } catch (error) {
      reply.status(400).send({ error: 'Failed to create customer' });
    }
  });

  // Update customer
  app.put('/customers/:id', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { name, phone, email, address, creditLimit } = request.body as {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        creditLimit?: string;
      };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name.trim();
      if (phone !== undefined) updateData.phone = phone;
      if (email !== undefined) updateData.email = email;
      if (address !== undefined) updateData.address = address;
      if (creditLimit !== undefined) updateData.creditLimit = creditLimit;

      const customer = await prisma.customer.update({
        where: { id },
        data: updateData,
      });

      return customer;
    } catch (error) {
      reply.status(400).send({ error: 'Failed to update customer' });
    }
  });

  // Delete customer (owner only)
  app.delete('/customers/:id', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);

      // Check if customer has invoices
      const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });
      if (invoiceCount > 0) {
        return reply.status(400).send({ error: 'Cannot delete customer with invoices' });
      }

      await prisma.customer.delete({ where: { id } });
      return { message: 'Customer deleted' };
    } catch (error) {
      reply.status(400).send({ error: 'Failed to delete customer' });
    }
  });
}