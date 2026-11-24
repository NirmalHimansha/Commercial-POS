import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { authenticate, ManagerOrOwner, OwnerOnly } from '../middleware/auth';
import {
  createInvoiceSchema,
  returnInvoiceSchema,
  voidInvoiceSchema,
  processPaymentSchema,
} from '../validation/invoices';
import { MovementType } from '../types';
import '../middleware/auth'; // Import module augmentation

let invoiceCounter = 1000;

function generateInvoiceNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  return `INV-${year}${month}${day}-${invoiceCounter++}`;
}

export async function invoiceRoutes(app: FastifyInstance) {
  // Create invoice (authenticated)
  app.post('/invoices', { onRequest: [authenticate] }, async (request) => {
    try {
      const data = createInvoiceSchema.parse(await request.body);
      const userId = request.user!.id;

      // Calculate totals
      let subtotal = 0;
      let taxTotal = 0;

      const items = [];
      for (const itemData of data.items) {
        const product = await prisma.product.findUnique({ where: { id: itemData.productId } });
        if (!product) {
          return { error: `Product not found: ${itemData.productId}` };
        }

        const quantity = itemData.quantity;
        const unitPrice = product.sellingPrice;
        const discountPercent = itemData.discount || 0;
        const taxRate = product.taxRate;

        const lineTotal = unitPrice * quantity * (1 - discountPercent / 100);
        const lineTax = lineTotal * (taxRate / 100);

        items.push({
          productId: itemData.productId,
          quantity: quantity,
          unitPrice: unitPrice,
          discount: discountPercent / 100,
          taxRate: taxRate,
          total: lineTotal,
        });

        subtotal += lineTotal;
        taxTotal += lineTax;
      }

      // Deduct stock
      for (const item of items) {
        await prisma.$transaction(async (tx) => {
          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              type: MovementType.OUT,
              quantity: item.quantity,
              referenceId: 0, // Will be updated after invoice creation
              referenceType: 'invoice',
              userId: userId,
            },
          });
        });
      }

      const invoiceNumber = generateInvoiceNumber();

      const invoice = await prisma.invoice.create({
        data: {
          invoiceNumber,
          customerId: data.customerId,
          userId,
          status: 'DRAFT',
          paymentMethod: data.paymentMethod,
          total: subtotal,
          taxableTotal: subtotal,
          taxTotal: taxTotal,
          items: { create: items },
        },
      });

      return invoice;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to create invoice' };
    }
  });

  // Get invoice
  app.get('/invoices/:id', { onRequest: [authenticate] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { items: true },
      });

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      return invoice;
    } catch (error) {
      return { error: 'Invalid invoice ID' };
    }
  });

  // List invoices
  app.get('/invoices', { onRequest: [authenticate] }, async (request) => {
    try {
      const userId = request.user!.id;
      const role = request.user!.role;

      const where = role === 'CASHIER'
        ? { userId }
        : {};

      const invoices = await prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true },
        take: 50,
      });

      return { invoices };
    } catch (error) {
      return { error: 'Failed to fetch invoices' };
    }
  });

  // Process payment
  app.post('/invoices/:id/pay', { onRequest: [authenticate] }, async (request) => {
    try {
      const invoiceId = parseInt((request.params as Record<string, string>).id);
      const body = await request.body as { amount?: number; method: string };
      const { amount, method } = processPaymentSchema.parse({
        ...body,
        invoiceId,
      });

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      if (invoice.paymentStatus === 'PAID') {
        return { error: 'Invoice already paid' };
      }

      const paymentAmount = amount || invoice.total;
      const totalAmount = invoice.total;
      const changeAmount = Math.max(0, paymentAmount - totalAmount);

      const updateData: Record<string, unknown> = {};

      if (paymentAmount >= totalAmount) {
        updateData.status = 'PAID';
        updateData.paymentStatus = 'PAID';
        updateData.changeAmount = changeAmount;
      } else {
        updateData.paymentStatus = 'PARTIAL';
        updateData.total = totalAmount - paymentAmount;
      }

      updateData.paymentMethod = method;
      updateData.paidAt = new Date();

      await prisma.invoice.update({
        where: { id: invoiceId },
        data: updateData,
      });

      // Update stock movement reference
      await prisma.stockMovement.updateMany({
        where: { referenceId: 0, referenceType: 'invoice' },
        data: { referenceId: invoiceId },
      });

      const updatedInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
        include: { items: true },
      });

      return updatedInvoice;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to process payment' };
    }
  });

  // Return invoice
  app.post('/invoices/:id/return', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const invoiceId = parseInt((request.params as Record<string, string>).id);
      const body = await request.body as { items?: { itemId: number; quantity: number; reason?: string }[] };
      const items = returnInvoiceSchema.parse({
        ...body,
        invoiceId,
      }).items;

      const originalInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!originalInvoice || originalInvoice.status === 'RETURNED' || originalInvoice.status === 'VOIDED') {
        return { error: 'Invoice cannot be returned' };
      }

      // Create return invoice
      const returnInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `RET-${originalInvoice.invoiceNumber}`,
          status: 'PAID',
          paymentMethod: originalInvoice.paymentMethod as any,
          total: originalInvoice.total,
          userId: request.user!.id,
        },
      });

      // Return stock
      for (const item of items) {
        const originalItem = await prisma.invoiceItem.findUnique({ where: { id: item.itemId } });
        if (!originalItem) continue;

        await prisma.stockMovement.create({
          data: {
            productId: originalItem.productId,
            type: MovementType.IN,
            quantity: item.quantity,
            referenceId: returnInvoice.id,
            referenceType: 'return',
            userId: request.user!.id,
            reason: 'Return',
          },
        });
      }

      // Mark original as returned
      await prisma.invoice.update({
        where: { id: invoiceId },
        data: { status: 'RETURNED' },
      });

      return returnInvoice;
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to process return' };
    }
  });

  // Void invoice (manager+ with reason)
  app.post('/invoices/:id/void', { onRequest: [ManagerOrOwner] }, async (request) => {
    try {
      const body = await request.body as { reason?: string };
      const { reason } = voidInvoiceSchema.parse({
        ...body,
        id: parseInt((request.params as Record<string, string>).id),
      });

      const id = parseInt((request.params as Record<string, string>).id);
      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      if (invoice.status === 'VOIDED') {
        return { error: 'Invoice already voided' };
      }

      await prisma.invoice.update({
        where: { id },
        data: { status: 'VOIDED' },
      });

      // Return stock
      const items = await prisma.invoiceItem.findMany({ where: { invoiceId: id } });
      for (const item of items) {
        await prisma.stockMovement.create({
          data: {
            productId: item.productId,
            type: MovementType.IN,
            quantity: item.quantity,
            referenceId: id,
            referenceType: 'void',
            userId: request.user!.id,
            reason: reason || 'Voided',
          },
        });
      }

      return { message: 'Invoice voided', reason };
    } catch (error) {
      return { error: error instanceof Error ? error.message : 'Failed to void invoice' };
    }
  });

  // Delete invoice (owner only, drafts only)
  app.delete('/invoices/:id', { onRequest: [OwnerOnly] }, async (request) => {
    try {
      const id = parseInt((request.params as Record<string, string>).id);
      const invoice = await prisma.invoice.findUnique({ where: { id } });

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      if (invoice.status !== 'DRAFT') {
        return { error: 'Only draft invoices can be deleted' };
      }

      // Delete items first
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

      // Delete invoice
      await prisma.invoice.delete({ where: { id } });

      return { message: 'Invoice deleted' };
    } catch (error) {
      return { error: 'Failed to delete invoice' };
    }
  });

  // Search invoices by number
  app.get('/invoices/search/:number', { onRequest: [authenticate] }, async (request) => {
    try {
      const searchNum = (request.params as Record<string, string>).number;
      const invoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: { contains: searchNum },
        },
        orderBy: { createdAt: 'desc' },
        include: { items: true },
      });

      if (!invoice) {
        return { error: 'Invoice not found' };
      }

      return invoice;
    } catch (error) {
      return { error: 'Invalid search' };
    }
  });
}