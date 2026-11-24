import { FastifyInstance } from 'fastify';
import { prisma } from '../utils/prisma';
import { authenticate, isManagerOrOwner, isOwner } from '../middleware/auth';
import {
  createInvoiceSchema,
  returnInvoiceSchema,
  voidInvoiceSchema,
  processPaymentSchema,
} from '../validation/invoices';
import { InvoiceStatus, PaymentMethod, MovementType } from '@prisma/client';

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
  app.post('/invoices', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const data = createInvoiceSchema.parse(await request.body);
      const userId = request.user!.id;

      // Calculate totals
      let subtotal = 0n;
      let taxTotal = 0n;

      const items = [];
      for (const itemData of data.items) {
        const product = await prisma.product.findUnique({ where: { id: itemData.productId } });
        if (!product) {
          return reply.status(400).send({ error: `Product not found: ${itemData.productId}` });
        }

        const quantity = parseFloat(itemData.quantity);
        const unitPrice = parseFloat(product.sellingPrice);
        const discountPercent = parseFloat(itemData.discount || '0');
        const taxRate = parseFloat(product.taxRate);

        const lineTotal = unitPrice * quantity * (1 - discountPercent / 100);
        const lineTax = lineTotal * (taxRate / 100);

        items.push({
          productId: itemData.productId,
          quantity: quantity.toString(),
          unitPrice: unitPrice.toString(),
          discount: (discountPercent / 100).toString(),
          taxRate: taxRate.toString(),
          total: lineTotal.toFixed(2),
        });

        subtotal += BigInt(Math.round(lineTotal * 100));
        taxTotal += BigInt(Math.round(lineTax * 100));
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
          status: InvoiceStatus.DRAFT,
          paymentMethod: data.paymentMethod as PaymentMethod,
          total: (Number(subtotal) / 100).toFixed(2),
          taxableTotal: (Number(subtotal) / 100).toFixed(2),
          taxTotal: (Number(taxTotal) / 100).toFixed(2),
          items: { create: items },
        },
        include: { items: true, customer: true },
      });

      return invoice;
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to create invoice' });
    }
  });

  // Get invoice
  app.get('/invoices/:id', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { items: true, customer: true, user: true },
      });

      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }

      return invoice;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid invoice ID' });
    }
  });

  // List invoices
  app.get('/invoices', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const userId = request.user!.id;
      const role = request.user!.role;

      const where = role === 'CASHIER'
        ? { userId }
        : {};

      const invoices = await prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        include: { items: true, customer: true },
        take: 50,
      });

      return { invoices };
    } catch (error) {
      return reply.status(500).send({ error: 'Failed to fetch invoices' });
    }
  });

  // Process payment
  app.post('/invoices/:id/pay', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const invoiceId = parseInt(request.params.id);
      const { amount, method } = processPaymentSchema.parse({
        ...(await request.body),
        invoiceId,
      });

      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }

      if (invoice.paymentStatus === 'PAID') {
        return reply.status(400).send({ error: 'Invoice already paid' });
      }

      const paymentAmount = parseFloat(amount || invoice.total);
      const totalAmount = parseFloat(invoice.total);
      const changeAmount = Math.max(0, paymentAmount - totalAmount);

      const updateData: Record<string, unknown> = {};

      if (paymentAmount >= totalAmount) {
        updateData.status = InvoiceStatus.PAID;
        updateData.paymentStatus = 'PAID';
        updateData.changeAmount = changeAmount.toFixed(2);
      } else {
        updateData.paymentStatus = 'PARTIAL';
        updateData.total = (totalAmount - paymentAmount).toFixed(2);
      }

      updateData.paymentMethod = method as PaymentMethod;

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
        include: { items: true, customer: true },
      });

      return updatedInvoice;
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to process payment' });
    }
  });

  // Return invoice
  app.post('/invoices/:id/return', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const invoiceId = parseInt(request.params.id);
      const items = returnInvoiceSchema.parse({
        ...(await request.body),
        invoiceId,
      }).items;

      const originalInvoice = await prisma.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!originalInvoice || originalInvoice.status === InvoiceStatus.RETURNED || originalInvoice.status === InvoiceStatus.VOIDED) {
        return reply.status(400).send({ error: 'Invoice cannot be returned' });
      }

      // Create return invoice
      const returnInvoice = await prisma.invoice.create({
        data: {
          invoiceNumber: `RET-${originalInvoice.invoiceNumber}`,
          status: InvoiceStatus.PAID,
          paymentMethod: originalInvoice.paymentMethod,
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
        data: { status: InvoiceStatus.RETURNED },
      });

      return returnInvoice;
    } catch (error) {
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to process return' });
    }
  });

  // Void invoice (manager+ with reason)
  app.post('/invoices/:id/void', { onRequest: [authenticate, isManagerOrOwner] }, async (request, reply) => {
    try {
      const { id, reason } = voidInvoiceSchema.parse({
        ...(await request.body),
        id: parseInt(request.params.id),
      });

      const invoice = await prisma.invoice.findUnique({ where: { id } });
      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }

      if (invoice.status === InvoiceStatus.VOIDED) {
        return reply.status(400).send({ error: 'Invoice already voided' });
      }

      await prisma.invoice.update({
        where: { id },
        data: { status: InvoiceStatus.VOIDED },
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
      return reply.status(400).send({ error: error instanceof Error ? error.message : 'Failed to void invoice' });
    }
  });

  // Delete invoice (owner only, drafts only)
  app.delete('/invoices/:id', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const invoice = await prisma.invoice.findUnique({ where: { id } });

      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }

      if (invoice.status !== InvoiceStatus.DRAFT) {
        return reply.status(400).send({ error: 'Only draft invoices can be deleted' });
      }

      // Delete items first
      await prisma.invoiceItem.deleteMany({ where: { invoiceId: id } });

      // Delete invoice
      await prisma.invoice.delete({ where: { id } });

      return { message: 'Invoice deleted' };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to delete invoice' });
    }
  });

  // Search invoices by number
  app.get('/invoices/search/:number', { onRequest: [authenticate] }, async (request, reply) => {
    try {
      const invoice = await prisma.invoice.findFirst({
        where: {
          invoiceNumber: { contains: request.params.number, mode: 'insensitive' },
        },
        orderBy: { createdAt: 'desc' },
        include: { items: true, customer: true },
      });

      if (!invoice) {
        return reply.status(404).send({ error: 'Invoice not found' });
      }

      return invoice;
    } catch (error) {
      return reply.status(400).send({ error: 'Invalid search' });
    }
  });
}