import Fastify from 'fastify';
import fastifyjwt from '@fastify/jwt';
import fastifycors from '@fastify/cors';
import { prisma } from './utils/prisma';
import { authRoutes } from './api/auth';
import { productRoutes } from './api/products';
import { categoryRoutes } from './api/categories';
import { invoiceRoutes } from './api/invoices';
import { supplierRoutes } from './api/suppliers';
import { userRoutes } from './api/users';
import { customerRoutes } from './api/customers';
import { healthRoutes } from './api/health';
import { reportsRoutes } from './api/reports';

const env = process.env;

const app = Fastify({
  logger: true,
});

// Register plugins
app.register(fastifycors, {
  origin: true,
  credentials: true,
});

app.register(fastifyjwt, {
  secret: env.JWT_SECRET || 'change-this-in-production',
  sign: {
    expiresIn: '8h',
  },
});

// Make Prisma available in request context
app.decorate('prisma', prisma);

// Register routes
app.register(healthRoutes, { prefix: '/api' });
app.register(authRoutes, { prefix: '/api/auth' });
app.register(productRoutes, { prefix: '/api' });
app.register(categoryRoutes, { prefix: '/api' });
app.register(invoiceRoutes, { prefix: '/api' });
app.register(supplierRoutes, { prefix: '/api' });
app.register(customerRoutes, { prefix: '/api' });
app.register(userRoutes, { prefix: '/api' });
app.register(reportsRoutes, { prefix: '/api' });

// Graceful shutdown
process.on('SIGTERM', async () => {
  app.log.info('SIGTERM received, closing server');
  await prisma.$disconnect();
  await app.close();
});

process.on('SIGINT', async () => {
  app.log.info('SIGINT received, closing server');
  await prisma.$disconnect();
  await app.close();
});

const start = async () => {
  try {
    const port = parseInt(env.APP_PORT || '3000', 10);
    await app.listen({ port, host: '0.0.0.0' });
    app.log.info(`Server listening on ${port}`);
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

start();