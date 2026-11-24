import { FastifyInstance, FastifyRequest } from 'fastify';
import { prisma } from '../utils/prisma';
import { authenticate } from '../middleware/auth';
import '../middleware/auth'; // Import module augmentation

export async function reportsRoutes(app: FastifyInstance) {
  // Get sales report summary
  app.get('/reports/sales', { onRequest: [authenticate] }, async (request: FastifyRequest, reply) => {
    try {
      const { period = 'today' } = request.query as { period?: string };
      const userId = request.user!.id;
      const role = request.user!.role;

      // Calculate date range based on period
      const now = new Date();
      let startDate: Date;
      let endDate = now;

      switch (period) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          break;
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      }

      // Build where clause for invoices
      const invoiceWhere = role === 'CASHIER'
        ? {
            userId,
            createdAt: { gte: startDate, lte: endDate },
          }
        : {
            createdAt: { gte: startDate, lte: endDate },
          };

      // Get all invoices for the period
      const invoices = await prisma.invoice.findMany({
        where: {
          ...invoiceWhere,
          status: { not: 'VOIDED' },
        },
        include: { items: true },
      });

      // Calculate statistics
      let totalSales = 0;
      let totalOrders = 0;
      const products = new Set<string>();

      for (const invoice of invoices) {
        if (invoice.status === 'PAID') {
          totalSales += invoice.total;
          totalOrders += 1;
        }
        for (const item of invoice.items) {
          products.add(item.productId.toString());
        }
      }

      const averageOrderValue = totalOrders > 0 ? totalSales / totalOrders : 0;

      return {
        summary: {
          totalSales,
          totalOrders,
          averageOrderValue,
          activeProducts: products.size,
        },
        period,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate sales report' });
    }
  });

  // Get inventory report
  app.get('/reports/inventory', { onRequest: [authenticate] }, async (_request, reply) => {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' },
      });

      const totalProducts = products.length;

      // Calculate current quantities from stock movements
      const productQuantities = new Map<number, number>();
      const lowStockItems: typeof products = [];
      const outOfStockItems: typeof products = [];

      for (const product of products) {
        const movements = await prisma.stockMovement.findMany({
          where: { productId: product.id },
        });

        let quantity = 0;
        for (const m of movements) {
          if (m.type === 'IN' || m.type === 'ADJUSTMENT_IN') {
            quantity += m.quantity as number;
          } else {
            quantity -= m.quantity as number;
          }
        }

        productQuantities.set(product.id, quantity);

        if (quantity <= (product.reorderLevel ?? 0)) {
          lowStockItems.push(product);
        }
        if (quantity === 0) {
          outOfStockItems.push(product);
        }
      }

      let totalValue = 0;
      for (const product of products) {
        const qty = productQuantities.get(product.id) ?? 0;
        totalValue += qty * (product.costPrice as number);
      }

      return {
        summary: {
          totalProducts,
          lowStockCount: lowStockItems.length,
          outOfStockCount: outOfStockItems.length,
          totalInventoryValue: totalValue,
          lowStockItems: lowStockItems.slice(0, 10), // Top 10 low stock
        },
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate inventory report' });
    }
  });

  // Get customer outstanding
  app.get('/reports/customers', { onRequest: [authenticate] }, async (_request, reply) => {
    try {
      // Get all customers with outstanding invoices
      const invoices = await prisma.invoice.findMany({
        where: {
          customerId: { not: null },
          paymentStatus: 'PENDING',
        },
        include: { customer: true },
      });

      // Group by customer
      const customerMap = new Map<number, { customer: any; invoices: typeof invoices }>();
      for (const invoice of invoices) {
        const custId = invoice.customerId!;
        if (!customerMap.has(custId)) {
          customerMap.set(custId, { customer: invoice.customer, invoices: [] });
        }
        customerMap.get(custId)!.invoices.push(invoice);
      }

      const customerData = Array.from(customerMap.values()).map(({ customer, invoices }) => ({
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        totalOutstanding: invoices.reduce((sum, inv) => sum + inv.total, 0),
        invoiceCount: invoices.length,
      }));

      // Sort by outstanding amount descending
      customerData.sort((a, b) => b.totalOutstanding - a.totalOutstanding);

      return {
        customers: customerData,
        summary: {
          totalCustomers: await prisma.customer.count(),
          customersWithOutstanding: customerData.length,
          totalOutstanding: customerData.reduce((sum, c) => sum + c.totalOutstanding, 0),
        },
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate customer report' });
    }
  });

  // Get supplier payables
  app.get('/reports/suppliers', { onRequest: [authenticate] }, async (_request, reply) => {
    try {
      const suppliers = await prisma.supplier.findMany({
        orderBy: { name: 'asc' },
      });

      const supplierData = await Promise.all(
        suppliers.map(async (supplier) => {
          const pendingPurchases = await prisma.purchase.findMany({
            where: {
              supplierId: supplier.id,
              status: 'PENDING',
            },
          });

          const totalPayable = pendingPurchases.reduce(
            (sum, pur) => sum + pur.total,
            0
          );

          return {
            id: supplier.id,
            name: supplier.name,
            phone: supplier.phone,
            email: supplier.email,
            totalPayable,
            purchaseCount: pendingPurchases.length,
          };
        })
      );

      return {
        suppliers: supplierData,
        summary: {
          totalSuppliers: supplierData.length,
          totalPayable: supplierData.reduce((sum, s) => sum + s.totalPayable, 0),
        },
      };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to generate supplier report' });
    }
  });
}