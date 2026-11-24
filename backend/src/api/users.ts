import { FastifyInstance } from 'fastify';
import bcrypt from 'bcrypt';
import { prisma } from '../utils/prisma';
import { authenticate, isOwner } from '../middleware/auth';
import { UserRole } from '../types';

export async function userRoutes(app: FastifyInstance) {
  // List users (owner only)
  app.get('/users', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
        orderBy: { name: 'asc' },
      });
      return { users };
    } catch (error) {
      reply.status(500).send({ error: 'Failed to fetch users' });
    }
  });

  // Get user
  app.get('/users/:id', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const user = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          pin: { not: null },
          createdAt: true,
        },
      });
      if (!user) {
        return reply.status(404).send({ error: 'User not found' });
      }
      return user;
    } catch (error) {
      reply.status(400).send({ error: 'Invalid user ID' });
    }
  });

  // Create user (owner only)
  app.post('/users', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const { email, password, name, role } = request.body as {
        email: string;
        password: string;
        name: string;
        role: UserRole;
      };

      if (!email || !password || !name) {
        return reply.status(400).send({ error: 'Email, password, and name are required' });
      }

      const existingUser = await prisma.user.findUnique({ where: { email } });
      if (existingUser) {
        return reply.status(400).send({ error: 'User with this email already exists' });
      }

      const passwordHash = await bcrypt.hash(password, 12);

      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name,
          role,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          createdAt: true,
        },
      });

      return { user };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to create user' });
    }
  });

  // Update user (owner only)
  app.put('/users/:id', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { name, role } = request.body as { name?: string; role?: UserRole };

      const updateData: Record<string, unknown> = {};
      if (name) updateData.name = name;
      if (role) updateData.role = role;

      const user = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
        },
      });

      return { user };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to update user' });
    }
  });

  // Set user PIN (authenticated)
  app.post('/users/:id/pin', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const { pin } = request.body as { pin: string };

      if (!pin || pin.length !== 4 || !/^\d{4}$/.test(pin)) {
        return reply.status(400).send({ error: 'PIN must be exactly 4 digits' });
      }

      const pinHash = await bcrypt.hash(pin, 12);

      await prisma.user.update({
        where: { id },
        data: { pin: pinHash },
      });

      return { message: 'PIN set successfully' };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to set PIN' });
    }
  });

  // Deactivate user (owner only)
  app.delete('/users/:id', { onRequest: [authenticate, isOwner] }, async (request, reply) => {
    try {
      const id = parseInt(request.params.id);
      const currentUserId = request.user!.id;

      if (id === currentUserId) {
        return reply.status(400).send({ error: 'Cannot deactivate your own account' });
      }

      await prisma.user.delete({ where: { id } });
      return { message: 'User deleted' };
    } catch (error) {
      return reply.status(400).send({ error: 'Failed to delete user' });
    }
  });
}