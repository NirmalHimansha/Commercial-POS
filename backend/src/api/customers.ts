import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { ManagerOrOwner, OwnerOnly } from '../middleware/auth';

export async function customerRoutes(app: FastifyInstance) {
  // List customers
  app.get('/customers', async (request) => {
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
      return { error: 'Failed to fetch customers' };
    }
  });

  // Get customer
  app.get('/customers/:id', async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      const customer = await prisma.customer.findUnique({
        where: { id },
      });

      if (!customer) {
        return { error: 'Customer not found' };
      }

      return customer;
    } catch (error) {
      return { error: 'Invalid customer ID' };
    }
  });

  // Create customer
  app.post('/customers', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const { name, phone, email, address, creditLimit } = request.body as {
        name: string;
        phone?: string;
        email?: string;
        address?: string;
        creditLimit?: number;
      };

      if (!name || !name.trim()) {
        return { error: 'Customer name is required' };
      }

      const customer = await prisma.customer.create({
        data: {
          name: name.trim(),
          phone,
          email,
          address,
          creditLimit: creditLimit ?? 0,
        },
      });

      return customer;
    } catch (error) {
      return { error: 'Failed to create customer' };
    }
  });

  // Update customer
  app.put('/customers/:id', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      const { name, phone, email, address, creditLimit } = request.body as {
        name?: string;
        phone?: string;
        email?: string;
        address?: string;
        creditLimit?: number;
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
      return { error: 'Failed to update customer' };
    }
  });

  // Delete customer (owner only)
  app.delete('/customers/:id', { onRequest: [OwnerOnly] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);

      // Check if customer has invoices
      const invoiceCount = await prisma.invoice.count({ where: { customerId: id } });
      if (invoiceCount > 0) {
        return { error: 'Cannot delete customer with invoices' };
      }

      await prisma.customer.delete({ where: { id } });
      return { message: 'Customer deleted' };
    } catch (error) {
      return { error: 'Failed to delete customer' };
    }
  });
}