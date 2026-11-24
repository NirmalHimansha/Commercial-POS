import { FastifyInstance } from 'fastify';

export async function healthRoutes(app: FastifyInstance) {
  app.get('/health', async (request, reply) => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  });

  app.get('/health/db', async (request, reply) => {
    try {
      await app.prisma.$queryRaw`SELECT 1`;
      return { status: 'ok', database: 'connected' };
    } catch (error) {
      return reply.status(500).send({ status: 'error', database: 'disconnected' });
    }
  });
}